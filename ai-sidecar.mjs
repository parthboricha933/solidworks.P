/**
 * AI Sidecar Proxy Server
 * Runs on port 3005 — isolates AI SDK calls from the Next.js process
 */
import http from 'http';

const ZAI = (await import('z-ai-web-dev-sdk')).default;
let zai = null;

async function ensureZAI() {
  if (!zai) {
    zai = await ZAI.create();
  }
  return zai;
}

function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error(`Timeout after ${ms / 1000}s`)), ms)),
  ]);
}

async function handleSolidWorks(body) {
  const { type, description, parameters } = body;
  let systemPrompt = '';
  let userPrompt = '';

  switch (type) {
    case 'modeling-plan':
      systemPrompt = `Expert SolidWorks engineer. Write concise step-by-step modeling plan in Markdown. Include: setup, sketch, features (Extrude/Cut/Fillet/Chamfer), material, checks. Keep under 120 words.`;
      userPrompt = `Plan for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + parameters : ''}`;
      break;
    case 'vba-macro':
      systemPrompt = `SolidWorks VBA expert. Generate complete runnable macro using SldWorks API. Include error handling, comments, parameterized dimensions. Output ONLY the VBA code block.`;
      userPrompt = `VBA macro to create: ${description}${parameters && parameters !== '{}' ? ' Params: ' + parameters : ''}`;
      break;
    case 'python-script':
      systemPrompt = `SolidWorks Python expert. Generate script using win32com.client with error handling, comments, parameterized dimensions. Output ONLY Python code block.`;
      userPrompt = `Python script for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + parameters : ''}`;
      break;
    case 'design-spec':
      systemPrompt = `Senior mechanical design engineer. Generate concise spec: Summary, Material, Dimensions, Manufacturing, Cost, Validation. Under 200 words.`;
      userPrompt = `Spec for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + parameters : ''}`;
      break;
    default:
      return { error: `Unknown type: ${type}` };
  }

  const ai = await ensureZAI();
  const completion = await withTimeout(
    ai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: (type === 'vba-macro' || type === 'python-script') ? 2000 : 1200,
    }),
    90000
  );

  return {
    success: true,
    type,
    content: completion?.choices?.[0]?.message?.content || 'No content generated',
  };
}

async function handleGenerate3D(body) {
  const { description } = body;
  const { execFile } = require('child_process');
  const { promisify } = require('util');
  const fs = require('fs/promises');
  const path = require('path');
  const execFileAsync = promisify(execFile);

  const enhancedPrompt = `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text`;

  const outputDir = path.join(process.cwd(), 'download');
  await fs.mkdir(outputDir, { recursive: true });
  const outputPath = path.join(outputDir, `3d-model-${Date.now()}.png`);

  let imageBuffer;
  try {
    await withTimeout(
      execFileAsync('z-ai-generate', ['-p', enhancedPrompt, '-o', outputPath, '-s', '1024x1024'], { timeout: 100000 }),
      100000
    );
    imageBuffer = await fs.readFile(outputPath);
  } catch (err) {
    imageBuffer = Buffer.alloc(0);
  }

  let modelingPlan = '';
  try {
    const ai = await ensureZAI();
    const planCompletion = await withTimeout(
      ai.chat.completions.create({
        messages: [
          { role: 'system', content: `Expert SolidWorks engineer. Write a concise step-by-step modeling plan under 80 words.` },
          { role: 'user', content: `Plan for: ${description}` },
        ],
        temperature: 0.3,
        max_tokens: 200,
      }),
      60000
    );
    modelingPlan = planCompletion?.choices?.[0]?.message?.content || '';
  } catch (err) {
    modelingPlan = 'Plan unavailable';
  }

  return {
    success: true,
    image: imageBuffer.length > 0 ? imageBuffer.toString('base64') : null,
    modelingPlan,
  };
}

const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method not allowed' }));
  }

  const url = req.url || '';
  let body = '';
  req.on('data', (c) => body += c);
  await new Promise((r) => req.on('end', r));

  try {
    const parsed = JSON.parse(body);
    let result;

    if (url === '/api/ai/solidworks') {
      result = await handleSolidWorks(parsed);
    } else if (url === '/api/ai/generate-3d') {
      result = await handleGenerate3D(parsed);
    } else {
      result = { error: `Unknown endpoint: ${url}` };
    }

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(result));
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message || 'Internal error' }));
  }
});

const PORT = 3005;
server.listen(PORT, () => {
  console.log(`AI Sidecar Proxy running on port ${PORT}`);
});

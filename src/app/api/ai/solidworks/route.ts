import { NextRequest } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// AI chat completion script (runs in isolated child process to avoid SDK crashes)
const AI_CHAT_SCRIPT = `
const ZAI = (await import('z-ai-web-dev-sdk')).default;
const zai = await ZAI.create();
const input = JSON.parse(process.argv[1]);
const result = await zai.chat.completions.create({
  messages: input.messages || [],
  temperature: input.temperature || 0.3,
  max_tokens: input.max_tokens || 1200,
});
process.stdout.write(JSON.stringify({ content: result?.choices?.[0]?.message?.content || '' }));
`;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, parameters } = body;

    if (!type || !description) {
      return new Response(JSON.stringify({ error: 'Missing required fields: type, description' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

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
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    // Run AI chat in a child process (isolates SDK from Next.js)
    const maxTokens = (type === 'vba-macro' || type === 'python-script') ? 2000 : 1200;
    const chatInput = JSON.stringify({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: maxTokens,
    });

    let content = '';
    try {
      const { stdout } = await execFileAsync('node', [
        '-e', AI_CHAT_SCRIPT, chatInput
      ], { timeout: 90000, maxBuffer: 1024 * 1024 });
      const result = JSON.parse(stdout.trim());
      content = result.content || 'No content generated';
    } catch (err: any) {
      const msg = err.stderr || err.message || 'AI generation failed';
      return new Response(JSON.stringify({ error: `AI generation failed: ${msg.slice(0, 200)}` }), {
        status: 504, headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({ success: true, type, content }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

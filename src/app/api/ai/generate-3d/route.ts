import { NextRequest } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

function enhancePromptFor3D(description: string): string {
  return `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return new Response(JSON.stringify({ error: 'Description is required' }), {
        status: 400, headers: { 'Content-Type': 'application/json' }
      });
    }

    const enhancedPrompt = enhancePromptFor3D(description);
    const outputDir = path.join(process.cwd(), 'download');
    await fs.mkdir(outputDir, { recursive: true });
    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `3d-model-${timestamp}.png`);

    // Step 1: Generate image
    await execFileAsync('z-ai-generate', [
      '-p', enhancedPrompt,
      '-o', outputPath,
      '-s', '1024x1024',
    ], { timeout: 120000 });

    // Step 2: Generate short modeling plan
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const planCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `Expert SolidWorks engineer. Write a concise step-by-step modeling plan under 80 words. Numbered steps with features and dimensions.`
        },
        {
          role: 'user',
          content: `Plan for: ${description}`
        }
      ],
      temperature: 0.3,
      max_tokens: 200,
    });

    const modelingPlan = planCompletion.choices[0]?.message?.content || '';

    // Step 3: Read and return image
    const imageBuffer = await fs.readFile(outputPath);
    const base64Image = imageBuffer.toString('base64');

    return new Response(JSON.stringify({
      success: true,
      image: base64Image,
      modelingPlan,
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '3D generation error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

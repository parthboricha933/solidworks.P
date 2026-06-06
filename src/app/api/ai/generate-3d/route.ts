import { NextRequest, NextResponse } from 'next/server';
import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';

const execFileAsync = promisify(execFile);

// Engineering-specific prompt enhancer for 3D CAD-style images
function enhancePromptFor3D(description: string): string {
  return `Professional photorealistic 3D CAD rendering of a mechanical engineering part: ${description}. Shown in isometric view on a neutral gray background. Metallic finish with subtle reflections, clean technical styling, engineering blueprint quality, SolidWorks rendered appearance, sharp edges, precise geometry, studio lighting, high detail, industrial design visualization, no text or labels`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return NextResponse.json({ error: 'Description is required' }, { status: 400 });
    }

    const enhancedPrompt = enhancePromptFor3D(description);

    // Output path for the generated image
    const outputDir = path.join(process.cwd(), 'download');
    await fs.mkdir(outputDir, { recursive: true });
    const timestamp = Date.now();
    const outputPath = path.join(outputDir, `3d-model-${timestamp}.png`);

    // Use z-ai-generate CLI tool
    try {
      await execFileAsync('z-ai-generate', [
        '-p', enhancedPrompt,
        '-o', outputPath,
        '-s', '1024x1024',
      ], { timeout: 120000 });
    } catch (execError: any) {
      console.error('Image generation CLI error:', execError);
      return NextResponse.json(
        { error: `Image generation failed: ${execError.message}` },
        { status: 500 }
      );
    }

    // Read the generated image and convert to base64
    const imageBuffer = await fs.readFile(outputPath);
    const base64Image = imageBuffer.toString('base64');

    // Also use AI to generate modeling plan alongside the image
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    const zai = await ZAI.create();

    const planCompletion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are an expert SolidWorks CAD engineer. Generate a concise step-by-step SolidWorks modeling plan for the described part. Use numbered steps. Mention specific dimensions, features (Extrude, Fillet, Chamfer, Cut, Pattern), and material. Be specific and practical. Keep it under 200 words.`
        },
        {
          role: 'user',
          content: `Generate a SolidWorks modeling plan for: ${description}`
        }
      ],
      temperature: 0.3,
      max_tokens: 500,
    });

    const modelingPlan = planCompletion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      image: base64Image,
      modelingPlan,
      prompt: enhancedPrompt,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '3D generation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

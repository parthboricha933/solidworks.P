import { NextRequest } from 'next/server';
import { getZAI } from '@/lib/zai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    const zai = await getZAI();

    // Step 1: Generate 3D image
    let base64Image: string | null = null;
    try {
      const enhancedPrompt = `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text`;
      const imageResult = await zai.images.generations.create({
        prompt: enhancedPrompt,
        size: '1024x1024',
      });
      const img = imageResult?.data?.[0];
      if (img?.base64) {
        base64Image = img.base64;
      }
    } catch (err: any) {
      console.error('Image generation failed:', err?.message || err);
    }

    // Step 2: Generate modeling plan
    let modelingPlan = '';
    try {
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Expert SolidWorks engineer. Write concise step-by-step modeling plan under 80 words.' },
          { role: 'user', content: `Plan for: ${description}` },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });
      modelingPlan = result?.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      console.error('Plan generation failed:', err?.message || err);
    }

    return Response.json({
      success: true,
      status: 'completed',
      completedAt: Date.now(),
      image: base64Image,
      modelingPlan,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return Response.json({ error: message }, { status: 500 });
  }
}
import { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    // Step 1: Generate 3D image
    let base64Image: string | null = null;
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const enhancedPrompt = `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text`;
      const imageResult = await zai.images.generate({
        prompt: enhancedPrompt,
        size: '1024x1024',
      });
      if (imageResult?.data?.[0]) {
        // Handle base64 or URL response
        const img = imageResult.data[0];
        if (img.b64_json) {
          base64Image = img.b64_json;
        } else if (img.url) {
          // Fetch URL and convert to base64
          const resp = await fetch(img.url);
          const buffer = Buffer.from(await resp.arrayBuffer());
          base64Image = buffer.toString('base64');
        }
      }
    } catch {
      // Continue without image
    }

    // Step 2: Generate modeling plan
    let modelingPlan = '';
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Expert SolidWorks engineer. Write concise step-by-step modeling plan under 80 words.' },
          { role: 'user', content: `Plan for: ${description}` },
        ],
        temperature: 0.3,
        max_tokens: 200,
      });
      modelingPlan = result?.choices?.[0]?.message?.content || '';
    } catch {
      // Continue without plan
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
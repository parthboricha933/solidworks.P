import { NextRequest } from 'next/server';

export const maxDuration = 120;

async function generateWithPollinations(prompt: string): Promise<string | null> {
  try {
    const encoded = encodeURIComponent(prompt);
    const url = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&nologo=true&model=flux`;
    const res = await fetch(url, { signal: AbortSignal.timeout(100000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    return buffer.toString('base64');
  } catch {
    return null;
  }
}

async function generateModelingPlan(description: string): Promise<string> {
  try {
    const { getZAI } = await import('@/lib/zai');
    const zai = await getZAI();
    const result = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: 'Expert SolidWorks engineer. Write concise step-by-step modeling plan under 80 words.' },
        { role: 'user', content: `Plan for: ${description}` },
      ],
      temperature: 0.3,
      max_tokens: 200,
    });
    return result?.choices?.[0]?.message?.content || '';
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    const enhancedPrompt = `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text, highly detailed engineering visualization`;

    // Generate image (try Z.ai SDK first, fall back to Pollinations)
    let base64Image: string | null = null;

    try {
      const { getZAI } = await import('@/lib/zai');
      const zai = await getZAI();
      const imageResult = await zai.images.generations.create({
        prompt: enhancedPrompt,
        size: '1024x1024',
      });
      const img = imageResult?.data?.[0];
      if (img?.base64) base64Image = img.base64;
    } catch {
      // Z.ai SDK not available (e.g. on Vercel) — fall back to Pollinations
      base64Image = await generateWithPollinations(enhancedPrompt);
    }

    // Generate modeling plan (optional, non-blocking)
    const [modelingPlan] = await Promise.all([
      generateModelingPlan(description),
    ]);

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
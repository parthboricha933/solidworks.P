import { NextRequest } from 'next/server';

export const maxDuration = 60;

// Fallback: generate content via Pollinations text API when Z.ai is unavailable
async function generateWithPollinationsText(systemPrompt: string, userPrompt: string): Promise<string> {
  try {
    const fullPrompt = `${systemPrompt}\n\nUser request: ${userPrompt}`;
    const encoded = encodeURIComponent(fullPrompt);
    const url = `https://text.pollinations.ai/${encoded}?model=openai&nologo=true`;
    const res = await fetch(url, { signal: AbortSignal.timeout(55000) });
    if (!res.ok) return '';
    return await res.text();
  } catch {
    return '';
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, parameters } = body;

    if (!type || !description) {
      return Response.json({ error: 'Missing required fields: type, description' }, { status: 400 });
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
        return Response.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const maxTokens = (type === 'vba-macro' || type === 'python-script') ? 2000 : 1200;

    let content = '';

    // Try Z.ai SDK first
    try {
      const { getZAI } = await import('@/lib/zai');
      const zai = await getZAI();
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      content = result?.choices?.[0]?.message?.content || '';
    } catch {
      // Z.ai SDK unavailable — fall back to Pollinations text API
      content = await generateWithPollinationsText(systemPrompt, userPrompt);
    }

    if (!content) {
      return Response.json({ error: 'AI generation failed. Please try again.' }, { status: 502 });
    }

    return Response.json({ success: true, type, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
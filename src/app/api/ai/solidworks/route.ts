import { NextRequest } from 'next/server';
import { getZAI } from '@/lib/zai';

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
    try {
      const zai = await getZAI();
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: maxTokens,
      });
      content = result?.choices?.[0]?.message?.content || 'No content generated';
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('fetch failed') || msg.includes('ENOTFOUND') || msg.includes('ECONNREFUSED')) {
        return Response.json({ error: 'AI features require the local development environment. The AI API is not accessible from cloud deployments.' }, { status: 503 });
      }
      return Response.json({ error: `AI generation failed: ${msg.slice(0, 200)}` }, { status: 504 });
    }

    return Response.json({ success: true, type, content });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown server error';
    return Response.json({ error: message }, { status: 500 });
  }
}
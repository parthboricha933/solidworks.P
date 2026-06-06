import { NextRequest } from 'next/server';
import ZAI from 'z-ai-web-dev-sdk';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, description, parameters } = body;

    const zai = await ZAI.create();

    let systemPrompt = '';
    let userPrompt = '';

    switch (type) {
      case 'modeling-plan':
        systemPrompt = `Expert SolidWorks engineer. Write concise step-by-step modeling plan in Markdown. Include: setup, sketch, features (Extrude/Cut/Fillet/Chamfer), material, checks. Keep under 120 words.`;
        userPrompt = `Plan for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + JSON.stringify(parameters) : ''}`;
        break;
      case 'vba-macro':
        systemPrompt = `SolidWorks VBA expert. Generate complete runnable macro using SldWorks API. Include error handling, comments, parameterized dimensions. Output ONLY the VBA code block.`;
        userPrompt = `VBA macro to create: ${description}${parameters && parameters !== '{}' ? ' Params: ' + JSON.stringify(parameters) : ''}`;
        break;
      case 'python-script':
        systemPrompt = `SolidWorks Python expert. Generate script using win32com.client with error handling, comments, parameterized dimensions. Output ONLY Python code block.`;
        userPrompt = `Python script for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + JSON.stringify(parameters) : ''}`;
        break;
      case 'design-spec':
        systemPrompt = `Senior mechanical design engineer. Generate concise spec: Summary, Material, Dimensions, Manufacturing, Cost, Validation. Under 200 words.`;
        userPrompt = `Spec for: ${description}${parameters && parameters !== '{}' ? ' Params: ' + JSON.stringify(parameters) : ''}`;
        break;
      default:
        return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
          status: 400, headers: { 'Content-Type': 'application/json' }
        });
    }

    // Stream the AI response to keep connection alive through proxies
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          const completion = await zai.chat.completions.create({
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            temperature: 0.3,
            max_tokens: type === 'vba-macro' || type === 'python-script' ? 2000 : 1200,
          });

          const content = completion.choices[0]?.message?.content || '';

          // Send as a single JSON response (streamed for keepalive)
          const json = JSON.stringify({ success: true, type, content });
          controller.enqueue(encoder.encode(json));
          controller.close();
        } catch (err: any) {
          const errorJson = JSON.stringify({ error: err.message || 'AI generation error' });
          controller.enqueue(encoder.encode(errorJson));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Failed to start generation';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    });
  }
}

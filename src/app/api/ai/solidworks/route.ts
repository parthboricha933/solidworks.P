import { NextRequest, NextResponse } from 'next/server';
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
        systemPrompt = `You are an expert SolidWorks CAD engineer with 20+ years of experience. Generate a detailed, step-by-step SolidWorks modeling plan for the described part. Include:
1. Part setup (units, template)
2. Base sketch creation with specific dimensions
3. Feature-by-feature instructions (Extrude Boss/Base, Cut, Fillet, Chamfer, Pattern, etc.)
4. Each step should mention the specific SolidWorks command, feature name, and dimensions
5. Material assignment
6. Final checks (interference, mass properties)

Format your response in clear Markdown with numbered steps. Be specific about dimensions, references, and SolidWorks commands.`;
        userPrompt = `Generate a step-by-step SolidWorks modeling plan for:\n${description}\n\nParameters: ${JSON.stringify(parameters, null, 2)}`;
        break;

      case 'vba-macro':
        systemPrompt = `You are a SolidWorks API VBA programming expert. Generate complete, runnable SolidWorks VBA macro code. Requirements:
1. Use SolidWorks API (SldWorks namespace)
2. Include error handling
3. Include comments for each section
4. Use proper variable naming
5. Generate the complete code in a single Sub procedure
6. Include dimension variables that can be easily modified
7. Follow SolidWorks API best practices

Output ONLY the VBA code block, no explanation outside the code.`;
        userPrompt = `Generate a SolidWorks VBA macro to create:\n${description}\n\nParameters: ${JSON.stringify(parameters, null, 2)}`;
        break;

      case 'python-script':
        systemPrompt = `You are a SolidWorks Python API expert using pySW or solidworks SDK. Generate complete Python scripts that interact with SolidWorks. Requirements:
1. Use win32com.client to communicate with SolidWorks
2. Include error handling with try/except
3. Include detailed comments
4. Use parameterized dimensions
5. Follow best practices for SolidWorks automation
6. Include material property assignment

Output ONLY the Python code block, no explanation outside the code.`;
        userPrompt = `Generate a Python script to automate SolidWorks creation of:\n${description}\n\nParameters: ${JSON.stringify(parameters, null, 2)}`;
        break;

      case 'design-spec':
        systemPrompt = `You are a senior mechanical design engineer. Generate a comprehensive design specification document for the described component. Include:

## Project Summary
- Project Name, Purpose, Industry

## Engineering Analysis
- Load calculations, stress analysis

## Material Selection
- Recommended material with justification and properties table

## Design Dimensions
- All critical dimensions with tolerances

## GD&T
- Geometric dimensioning and tolerancing recommendations

## SolidWorks Modeling Plan
- Step-by-step feature-based plan

## BOM
- Table with parts, materials, quantities

## Manufacturing Process
- Recommended process with justification

## Cost Estimate
- Material cost, machining cost, total cost

## Design Validation
- Stress considerations, safety factors, failure points

Be thorough and specific. Use tables where appropriate.`;
        userPrompt = `Generate a complete design specification for:\n${description}\n\nParameters: ${JSON.stringify(parameters, null, 2)}`;
        break;

      default:
        return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    const completion = await zai.chat.completions.create({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      max_tokens: type === 'vba-macro' || type === 'python-script' ? 4000 : 3000,
    });

    const content = completion.choices[0]?.message?.content || '';

    return NextResponse.json({
      success: true,
      type,
      content,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'AI generation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

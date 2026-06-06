import { NextRequest, NextResponse } from 'next/server';
import { calculateShaftDesign } from '@/lib/engineering/shaft';
import { calculateGearDesign } from '@/lib/engineering/gear';
import { calculateStressAnalysis } from '@/lib/engineering/stress';
import { calculateFatigueLife } from '@/lib/engineering/fatigue';
import { calculateBearingSelection } from '@/lib/engineering/bearing';
import { analyzeDFM } from '@/lib/engineering/dfm';
import { recommendManufacturingProcess } from '@/lib/engineering/manufacturing';
import { generateBOM } from '@/lib/engineering/bom';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tool, input } = body;

    let result;

    switch (tool) {
      case 'shaft':
        result = calculateShaftDesign(input);
        break;
      case 'gear':
        result = calculateGearDesign(input);
        break;
      case 'stress':
        result = calculateStressAnalysis(input);
        break;
      case 'fatigue':
        result = calculateFatigueLife(input);
        break;
      case 'bearing':
        result = calculateBearingSelection(input);
        break;
      case 'dfm':
        result = analyzeDFM(input);
        break;
      case 'manufacturing':
        result = recommendManufacturingProcess(input);
        break;
      case 'bom':
        result = generateBOM(input.items);
        break;
      default:
        return NextResponse.json({ error: `Unknown tool: ${tool}` }, { status: 400 });
    }

    return NextResponse.json({ success: true, tool, result });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Calculation error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

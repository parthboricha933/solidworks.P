// Design for Manufacturability Analysis

export interface DFMInput {
  partType: 'shaft' | 'gear' | 'bracket' | 'housing' | 'plate' | 'flange' | 'custom';
  material: string;
  manufacturingProcess: 'cnc-machining' | 'sheet-metal' | 'casting' | 'forging' | '3d-printing' | 'welding';
  complexity: 'simple' | 'moderate' | 'complex';
  tolerance: 'standard' | 'precision' | 'ultra-precision';
  surfaceFinish: 'rough' | 'standard' | 'smooth' | 'mirror';
  annualVolume: number;
  minWallThickness?: number; // mm
  maxAspectRatio?: number;
  hasUndercuts: boolean;
  hasInternalFeatures: boolean;
  numberOfHoles?: number;
  requiresHeatTreatment: boolean;
}

export interface DFMResult {
  overallScore: number; // 0-100
  manufacturabilityGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  issues: Array<{ severity: 'info' | 'warning' | 'critical'; category: string; description: string; recommendation: string; }>;
  estimatedCycleTime: string;
  estimatedToolCost: string;
  costDrivers: string[];
  processCompatibility: Array<{ process: string; compatibility: 'excellent' | 'good' | 'fair' | 'poor'; reason: string; }>;
  materialCompatibility: Array<{ material: string; compatibility: 'excellent' | 'good' | 'fair' | 'poor'; reason: string; }>;
}

export function analyzeDFM(input: DFMInput): DFMResult {
  let score = 80;
  const issues: DFMResult['issues'] = [];
  const costDrivers: string[] = [];

  // Wall thickness analysis
  if (input.minWallThickness && input.minWallThickness < 1.5 && input.manufacturingProcess !== '3d-printing') {
    score -= 10;
    issues.push({
      severity: 'warning',
      category: 'Wall Thickness',
      description: `Min wall thickness ${input.minWallThickness}mm is below recommended minimum.`,
      recommendation: 'Increase to at least 1.5mm for structural integrity during machining.',
    });
  }

  // Undercuts
  if (input.hasUndercuts) {
    if (input.manufacturingProcess === 'cnc-machining') {
      score -= 5;
      issues.push({
        severity: 'warning',
        category: 'Undercuts',
        description: 'Undercuts require special tooling or multi-axis setup.',
        recommendation: 'Consider 5-axis CNC or redesign to eliminate undercuts.',
      });
    }
    if (input.manufacturingProcess === 'casting') {
      score -= 15;
      issues.push({
        severity: 'critical',
        category: 'Undercuts',
        description: 'Undercuts prevent simple mold extraction.',
        recommendation: 'Use sliding cores in die casting or redesign part geometry.',
      });
    }
  }

  // Internal features
  if (input.hasInternalFeatures) {
    score -= 5;
    issues.push({
      severity: 'info',
      category: 'Internal Features',
      description: 'Internal features increase tooling complexity and cost.',
      recommendation: 'Evaluate if internal features can be accessed from exterior surfaces.',
    });
  }

  // Tolerance analysis
  if (input.tolerance === 'ultra-precision') {
    score -= 15;
    costDrivers.push('Ultra-precision tolerances require grinding/honing operations');
    issues.push({
      severity: 'critical',
      category: 'Tolerance',
      description: 'Ultra-precision tolerances (<0.005mm) significantly increase cost.',
      recommendation: 'Apply tight tolerances only where functionally critical (tolerance stacking).',
    });
  } else if (input.tolerance === 'precision') {
    score -= 5;
    costDrivers.push('Precision tolerances increase CNC setup time');
  }

  // Surface finish
  if (input.surfaceFinish === 'mirror') {
    score -= 10;
    costDrivers.push('Mirror finish requires polishing operations');
    issues.push({
      severity: 'warning',
      category: 'Surface Finish',
      description: 'Mirror finish (<Ra 0.1μm) requires additional finishing operations.',
      recommendation: 'Specify mirror finish only on visible/mating surfaces.',
    });
  }

  // Complexity vs Volume mismatch
  if (input.complexity === 'complex' && input.annualVolume > 10000) {
    score -= 5;
    issues.push({
      severity: 'info',
      category: 'Volume-Complexity',
      description: 'High-volume production of complex parts may benefit from dedicated tooling.',
      recommendation: 'Consider investment casting or die casting for volumes >10,000.',
    });
  }

  // Heat treatment
  if (input.requiresHeatTreatment) {
    score -= 5;
    costDrivers.push('Heat treatment adds 15-25% to processing cost');
  }

  // Holes
  if (input.numberOfHoles && input.numberOfHoles > 20) {
    score -= 3;
    costDrivers.push(`High hole count (${input.numberOfHoles}) increases cycle time`);
  }

  // Process-specific scoring
  const processCompatibility = getProcessCompatibility(input);
  const materialCompatibility = getMaterialCompatibility(input);

  // Grade assignment
  const grade = score >= 90 ? 'A' : score >= 75 ? 'B' : score >= 60 ? 'C' : score >= 45 ? 'D' : 'F';

  // Cycle time estimate
  const cycleTimeMap: Record<string, Record<string, string>> = {
    'simple': { 'cnc-machining': '5-15 min', 'casting': '3-8 min', '3d-printing': '30-120 min', 'sheet-metal': '1-5 min', 'forging': '2-10 min', 'welding': '15-45 min' },
    'moderate': { 'cnc-machining': '15-45 min', 'casting': '8-20 min', '3d-printing': '2-6 hr', 'sheet-metal': '5-15 min', 'forging': '5-15 min', 'welding': '30-90 min' },
    'complex': { 'cnc-machining': '45-120 min', 'casting': '20-60 min', '3d-printing': '4-12 hr', 'sheet-metal': '15-30 min', 'forging': '10-30 min', 'welding': '60-180 min' },
  };

  const estimatedCycleTime = cycleTimeMap[input.complexity]?.[input.manufacturingProcess] ?? '20-60 min';
  const toolCostMap: Record<string, string> = {
    'cnc-machining': '$500-$5,000',
    'casting': '$5,000-$50,000',
    '3d-printing': '$50-$500',
    'sheet-metal': '$2,000-$20,000',
    'forging': '$10,000-$100,000',
    'welding': '$200-$2,000',
  };

  const estimatedToolCost = toolCostMap[input.manufacturingProcess] ?? '$500-$5,000';

  if (costDrivers.length === 0) {
    costDrivers.push('Standard design — no significant cost drivers identified.');
  }

  return {
    overallScore: Math.max(0, Math.min(100, score)),
    manufacturabilityGrade: grade,
    issues,
    estimatedCycleTime,
    estimatedToolCost,
    costDrivers,
    processCompatibility,
    materialCompatibility,
  };
}

function getProcessCompatibility(input: DFMInput): DFMResult['processCompatibility'] {
  const processes = ['cnc-machining', 'sheet-metal', 'casting', 'forging', '3d-printing', 'welding'] as const;
  return processes.map(process => {
    const compatibilities: Record<string, { compatibility: DFMResult['processCompatibility'][0]['compatibility']; reason: string }> = {
      'cnc-machining': { compatibility: 'good', reason: 'Versatile — handles all geometries. Best for medium volumes.' },
      'sheet-metal': { compatibility: input.partType === 'plate' || input.partType === 'housing' || input.partType === 'bracket' ? 'good' : 'poor', reason: input.partType === 'plate' || input.partType === 'housing' ? 'Ideal for thin-walled structures.' : 'Not suitable for shafts, gears, or complex 3D parts.' },
      'casting': { compatibility: input.partType === 'housing' || input.partType === 'flange' || input.partType === 'bracket' ? 'good' : 'fair', reason: 'Excellent for complex shapes. Avoid for thin sections.' },
      'forging': { compatibility: input.partType === 'shaft' || input.partType === 'flange' || input.partType === 'gear' ? 'good' : 'fair', reason: 'Superior grain flow for shafts/gears. High tooling cost.' },
      '3d-printing': { compatibility: input.annualVolume < 100 ? 'good' : 'poor', reason: input.annualVolume < 100 ? 'Great for prototypes and low-volume complex parts.' : 'Not cost-effective at volume.' },
      'welding': { compatibility: input.partType === 'bracket' || input.partType === 'frame' ? 'good' : 'fair', reason: 'Best for joining structural members.' },
    };
    return { process, ...compatibilities[process] };
  });
}

function getMaterialCompatibility(input: DFMInput): DFMResult['materialCompatibility'] {
  const materials = [
    { name: 'AISI 1045 Steel', compatibility: 'good' as const, reason: 'Excellent machinability. Good for shafts, gears, general purpose.' },
    { name: 'AISI 4140 Alloy Steel', compatibility: 'good' as const, reason: 'High strength. Ideal for stressed components. Heat treatable.' },
    { name: 'SS 304 Stainless Steel', compatibility: 'good' as const, reason: 'Corrosion resistant. Moderate machinability. Good for food/chemical.' },
    { name: 'Al 6061-T6', compatibility: 'good' as const, reason: 'Lightweight, good machinability. Popular for enclosures, brackets.' },
    { name: 'Brass C36000', compatibility: 'good' as const, reason: 'Excellent machinability. Used for fittings, valves, electrical.' },
    { name: 'Titanium Ti-6Al-4V', compatibility: 'fair' as const, reason: 'High strength-to-weight. Difficult to machine. Expensive.' },
    { name: 'Nylon 6/6', compatibility: input.manufacturingProcess === 'cnc-machining' || input.manufacturingProcess === '3d-printing' ? 'good' : 'poor' as const, reason: 'Lightweight. 3D printable. Low strength.' },
    { name: 'Cast Iron GG-25', compatibility: input.manufacturingProcess === 'casting' ? 'excellent' as const : 'fair' as const, reason: 'Excellent castability. Good damping. Used for machine bases.' },
  ];
  return materials;
}

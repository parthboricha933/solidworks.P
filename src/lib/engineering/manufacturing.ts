// Manufacturing Process Recommendation

export interface ManufacturingInput {
  partType: string;
  material: string;
  annualVolume: number;
  complexity: 'simple' | 'moderate' | 'complex';
  maxBudget: number; // USD
  requiredTolerance: string; // e.g., "±0.05mm"
  surfaceFinish: string; // e.g., "Ra 1.6"
  partWeight: number; // kg
  leadTimeWeeks: number;
}

export interface ManufacturingRecommendation {
  primaryProcess: {
    name: string;
    confidence: number; // 0-100
    reason: string;
    estimatedCostPerPart: string;
    toolingCost: string;
    leadTime: string;
    suitable: boolean;
  };
  alternatives: Array<{
    name: string;
    confidence: number;
    reason: string;
    estimatedCostPerPart: string;
    pros: string[];
    cons: string[];
  }>;
  summary: string;
}

export function recommendManufacturingProcess(input: ManufacturingInput): ManufacturingRecommendation {
  const { partType, material, annualVolume, complexity, maxBudget, partWeight, leadTimeWeeks } = input;

  const processes: Array<{
    name: string;
    confidence: number;
    reason: string;
    costPerPart: string;
    toolingCost: string;
    leadTime: string;
    suitable: boolean;
    pros: string[];
    cons: string[];
  }> = [];

  // CNC Machining
  let cncConfidence = 60;
  if (annualVolume <= 1000) cncConfidence += 20;
  if (complexity === 'moderate' || complexity === 'complex') cncConfidence += 10;
  if (leadTimeWeeks <= 4) cncConfidence += 10;
  cncConfidence = Math.min(95, cncConfidence);
  processes.push({
    name: 'CNC Machining',
    confidence: cncConfidence,
    reason: 'Versatile, precise, good for prototyping through mid-volume production.',
    costPerPart: annualVolume > 100 ? `$${(50 / partWeight).toFixed(0)}-$${(200 / partWeight).toFixed(0)}` : '$20-$500',
    toolingCost: '$500-$5,000',
    leadTime: '2-6 weeks',
    suitable: cncConfidence >= 50,
    pros: ['High precision', 'Excellent surface finish', 'No tooling investment for small volumes', 'Wide material compatibility'],
    cons: ['Higher cost at volume', 'Slower for mass production', 'Waste material'],
  });

  // Casting
  let castConfidence = 40;
  if (annualVolume > 500) castConfidence += 25;
  if (complexity === 'complex') castConfidence += 15;
  if (partWeight > 2) castConfidence += 10;
  if (['housing', 'manifold', 'pump-body', 'engine-block', 'bracket'].includes(partType.toLowerCase())) castConfidence += 10;
  castConfidence = Math.min(95, castConfidence);
  processes.push({
    name: 'Casting (Investment / Die)',
    confidence: castConfidence,
    reason: annualVolume > 500 ? 'High volume compatible. Excellent for complex shapes.' : 'Requires high volume to justify tooling.',
    costPerPart: annualVolume > 1000 ? `$${(5).toFixed(0)}-$${(30).toFixed(0)}` : '$50-$200',
    toolingCost: '$5,000-$100,000',
    leadTime: '8-16 weeks (incl. tooling)',
    suitable: castConfidence >= 50,
    pros: ['Complex geometries possible', 'Low per-part cost at volume', 'Good material properties'],
    cons: ['High tooling cost', 'Long lead time', 'Surface finish requires secondary ops', 'Porosity risk'],
  });

  // 3D Printing
  let printConfidence = 30;
  if (annualVolume <= 50) printConfidence += 35;
  if (complexity === 'complex') printConfidence += 15;
  if (leadTimeWeeks <= 2) printConfidence += 10;
  printConfidence = Math.min(95, printConfidence);
  processes.push({
    name: '3D Printing (FDM/SLA/SLS)',
    confidence: printConfidence,
    reason: annualVolume <= 50 ? 'Ideal for prototyping and low-volume complex parts.' : 'Not cost-effective at volume.',
    costPerPart: `$${(5).toFixed(0)}-$${(200).toFixed(0)}`,
    toolingCost: '$0-$500',
    leadTime: '1-5 days',
    suitable: printConfidence >= 50,
    pros: ['No tooling', 'Fast turnaround', 'Complex geometries easy', 'Design flexibility'],
    cons: ['Limited materials', 'Lower strength', 'Surface finish varies', 'Not cost-effective at volume'],
  });

  // Sheet Metal
  let sheetConfidence = 30;
  if (['enclosure', 'chassis', 'bracket', 'panel', 'housing', 'cover'].includes(partType.toLowerCase())) sheetConfidence += 30;
  if (annualVolume > 100) sheetConfidence += 15;
  if (partWeight < 5) sheetConfidence += 10;
  sheetConfidence = Math.min(95, sheetConfidence);
  processes.push({
    name: 'Sheet Metal Fabrication',
    confidence: sheetConfidence,
    reason: sheetConfidence >= 50 ? 'Well-suited for thin-walled structural parts.' : 'Limited to flat/formed geometries.',
    costPerPart: `$${(10).toFixed(0)}-$${(100).toFixed(0)}`,
    toolingCost: '$2,000-$20,000',
    leadTime: '3-8 weeks',
    suitable: sheetConfidence >= 50,
    pros: ['Cost-effective at volume', 'Lightweight', 'Fast production', 'Good strength-to-weight'],
    cons: ['Limited to thin sections', 'Requires bend radii', 'Tooling for each geometry'],
  });

  // Forging
  let forgeConfidence = 20;
  if (['shaft', 'gear', 'crankshaft', 'connecting-rod', 'flange'].includes(partType.toLowerCase())) forgeConfidence += 30;
  if (annualVolume > 1000) forgeConfidence += 20;
  if (partWeight > 1) forgeConfidence += 10;
  forgeConfidence = Math.min(95, forgeConfidence);
  processes.push({
    name: 'Forging',
    confidence: forgeConfidence,
    reason: forgeConfidence >= 50 ? 'Excellent grain flow for high-strength parts.' : 'Best for shafts/gears at high volume.',
    costPerPart: `$${(5).toFixed(0)}-$${(50).toFixed(0)}`,
    toolingCost: '$10,000-$200,000',
    leadTime: '10-20 weeks (incl. tooling)',
    suitable: forgeConfidence >= 50,
    pros: ['Superior strength', 'Excellent fatigue life', 'Grain flow optimization', 'Low scrap'],
    cons: ['High tooling cost', 'Limited geometry', 'Close tolerances require machining', 'Long lead time'],
  });

  // Sort by confidence
  processes.sort((a, b) => b.confidence - a.confidence);

  const primary = processes[0];
  const alternatives = processes.slice(1).map(p => ({
    name: p.name,
    confidence: p.confidence,
    reason: p.reason,
    estimatedCostPerPart: p.costPerPart,
    pros: p.pros,
    cons: p.cons,
  }));

  const summary = `Based on your requirements (${partType}, ${material}, ${annualVolume} units/year, ${complexity} complexity), the recommended manufacturing process is **${primary.name}** with ${primary.confidence}% confidence. ${primary.reason}`;

  return {
    primaryProcess: {
      name: primary.name,
      confidence: primary.confidence,
      reason: primary.reason,
      estimatedCostPerPart: primary.costPerPart,
      toolingCost: primary.toolingCost,
      leadTime: primary.leadTime,
      suitable: primary.suitable,
    },
    alternatives: alternatives.slice(0, 3),
    summary,
  };
}

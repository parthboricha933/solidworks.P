// Bill of Materials & Cost Estimation

export interface BOMItem {
  partName: string;
  material: string;
  quantity: number;
  unitWeight: number; // kg
  materialCostPerKg: number; // USD
  machiningCostPerPart: number; // USD
  surfaceFinishCost: number; // USD
  heatTreatmentCost: number; // USD
  custom: boolean;
}

export interface BOMResult {
  items: Array<BOMItem & {
    totalWeight: number;
    totalMaterialCost: number;
    totalMachiningCost: number;
    totalPartCost: number;
  }>;
  subtotalMaterial: number;
  subtotalMachining: number;
  subtotalFinish: number;
  subtotalHeatTreatment: number;
  subtotalParts: number;
  toolingCost: number;
  inspectionCost: number;
  packagingCost: number;
  overheadPercent: number;
  overheadCost: number;
  profitMarginPercent: number;
  profitCost: number;
  grandTotal: number;
  costPerUnit: number;
  summary: string;
}

// Material cost database ($/kg)
const MATERIAL_COSTS: Record<string, number> = {
  'AISI 1045': 2.5,
  'AISI 4140': 4.0,
  'AISI 316': 8.0,
  'SS 304': 5.5,
  'Al 6061-T6': 6.0,
  'Al 7075-T6': 12.0,
  'Brass C36000': 7.0,
  'Bronze C93200': 9.0,
  'Titanium Ti-6Al-4V': 45.0,
  'Cast Iron GG-25': 1.5,
  'Nylon 6/6': 5.0,
  'Delrin (POM)': 6.0,
  'Polycarbonate': 4.5,
  'PEEK': 80.0,
  'Carbon Steel A36': 1.2,
  'Stainless Steel 17-4PH': 10.0,
};

// Standard hardware costs
const HARDWARE_COSTS: Record<string, number> = {
  'M6 Bolt (Grade 8.8)': 0.15,
  'M8 Bolt (Grade 8.8)': 0.25,
  'M10 Bolt (Grade 8.8)': 0.45,
  'M12 Bolt (Grade 8.8)': 0.75,
  'M6 Nut (Grade 8)': 0.05,
  'M8 Nut (Grade 8)': 0.08,
  'M10 Nut (Grade 8)': 0.12,
  'M12 Nut (Grade 8)': 0.18,
  'M6 Washer': 0.02,
  'M8 Washer': 0.03,
  'M10 Washer': 0.05,
  'M6 Lock Nut': 0.08,
  'M8 Lock Nut': 0.12,
  'M10 Lock Nut': 0.18,
  'M6x20 Set Screw': 0.08,
  'M8x25 Set Screw': 0.12,
  'Dowel Pin 6x30': 0.25,
  'Dowel Pin 8x35': 0.35,
  'Key 6x6x25': 0.15,
  'Key 8x7x32': 0.20,
  'Retaining Ring 25mm': 0.12,
  'Retaining Ring 30mm': 0.15,
  'O-Ring 25x3': 0.08,
  'O-Ring 30x3': 0.10,
  'Deep Groove Ball Bearing 6205': 8.50,
  'Deep Groove Ball Bearing 6206': 10.50,
  'Deep Groove Ball Bearing 6207': 13.00,
  'Deep Groove Ball Bearing 6208': 16.00,
  'Deep Groove Ball Bearing 6210': 22.00,
  'Angular Contact Bearing 7206B': 15.00,
  'Angular Contact Bearing 7208B': 22.00,
  'Lip Seal 25x42x7': 2.50,
  'Lip Seal 30x52x7': 3.00,
  'Lip Seal 35x62x8': 3.50,
};

export function generateBOM(items: BOMItem[]): BOMResult {
  const processedItems = items.map(item => {
    const totalWeight = item.quantity * item.unitWeight;
    const totalMaterialCost = totalWeight * item.materialCostPerKg;
    const totalMachiningCost = item.quantity * item.machiningCostPerPart;
    const totalSurfaceFinish = item.quantity * item.surfaceFinishCost;
    const totalHeatTreatment = item.quantity * item.heatTreatmentCost;
    const totalPartCost = totalMaterialCost + totalMachiningCost + totalSurfaceFinish + totalHeatTreatment;
    return {
      ...item,
      totalWeight: parseFloat(totalWeight.toFixed(3)),
      totalMaterialCost: parseFloat(totalMaterialCost.toFixed(2)),
      totalMachiningCost: parseFloat(totalMachiningCost.toFixed(2)),
      totalPartCost: parseFloat(totalPartCost.toFixed(2)),
    };
  });

  const subtotalMaterial = processedItems.reduce((sum, i) => sum + i.totalMaterialCost, 0);
  const subtotalMachining = processedItems.reduce((sum, i) => sum + i.totalMachiningCost, 0);
  const subtotalFinish = processedItems.reduce((sum, i) => sum + i.quantity * i.surfaceFinishCost, 0);
  const subtotalHeatTreatment = processedItems.reduce((sum, i) => sum + i.quantity * i.heatTreatmentCost, 0);
  const subtotalParts = processedItems.reduce((sum, i) => sum + i.totalPartCost, 0);

  const toolingCost = 5000; // default estimate
  const inspectionCost = subtotalParts * 0.05;
  const packagingCost = subtotalParts * 0.02;
  const overheadPercent = 25;
  const overheadCost = subtotalParts * (overheadPercent / 100);
  const profitMarginPercent = 20;
  const profitCost = (subtotalParts + overheadCost) * (profitMarginPercent / 100);
  const grandTotal = subtotalParts + toolingCost + inspectionCost + packagingCost + overheadCost + profitCost;
  const costPerUnit = grandTotal; // For one assembly unit

  const summary = `Total BOM cost for 1 assembly: $${grandTotal.toFixed(2)}. Material: $${subtotalMaterial.toFixed(2)}, Machining: $${subtotalMachining.toFixed(2)}, Tooling: $${toolingCost.toFixed(2)}. Overhead & profit included.`;

  return {
    items: processedItems,
    subtotalMaterial: parseFloat(subtotalMaterial.toFixed(2)),
    subtotalMachining: parseFloat(subtotalMachining.toFixed(2)),
    subtotalFinish: parseFloat(subtotalFinish.toFixed(2)),
    subtotalHeatTreatment: parseFloat(subtotalHeatTreatment.toFixed(2)),
    subtotalParts: parseFloat(subtotalParts.toFixed(2)),
    toolingCost,
    inspectionCost: parseFloat(inspectionCost.toFixed(2)),
    packagingCost: parseFloat(packagingCost.toFixed(2)),
    overheadPercent,
    overheadCost: parseFloat(overheadCost.toFixed(2)),
    profitMarginPercent,
    profitCost: parseFloat(profitCost.toFixed(2)),
    grandTotal: parseFloat(grandTotal.toFixed(2)),
    costPerUnit: parseFloat(costPerUnit.toFixed(2)),
    summary,
  };
}

export function getMaterialCosts(): Record<string, number> {
  return MATERIAL_COSTS;
}

export function getHardwareCosts(): Record<string, number> {
  return HARDWARE_COSTS;
}

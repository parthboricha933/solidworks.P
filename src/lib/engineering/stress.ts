// Stress Analysis Calculations

export interface StressInput {
  loadingType: 'axial' | 'bending' | 'torsion' | 'combined';
  // Axial
  axialForce?: number; // N
  crossSectionArea?: number; // mm²
  // Bending
  bendingMoment?: number; // N·m
  sectionModulus?: number; // mm³ (calculated from shape)
  beamShape?: 'rectangular' | 'circular' | 'hollow-circular' | 'i-beam';
  beamWidth?: number; // mm
  beamHeight?: number; // mm
  beamOuterDia?: number; // mm
  beamInnerDia?: number; // mm
  beamFlangeW?: number; // mm
  beamFlangeT?: number; // mm
  beamWebH?: number; // mm
  beamWebT?: number; // mm
  // Torsion
  torque?: number; // N·m
  shaftDiameter?: number; // mm
  // Combined
  yieldStrength: number; // MPa
  safetyFactor: number;
}

export interface StressResult {
  axialStress: number; // MPa
  bendingStress: number; // MPa
  shearStress: number; // MPa
  vonMisesStress: number; // MPa
  principalStress1: number; // MPa
  principalStress2: number; // MPa
  maxShearStress: number; // MPa
  factorOfSafety: number;
  designValid: boolean;
  designMessage: string;
  sectionModulusCalculated: number; // mm³
  polarModulusCalculated: number; // mm³
}

export function calculateStressAnalysis(input: StressInput): StressResult {
  const { loadingType, yieldStrength, safetyFactor } = input;

  // Calculate section modulus based on beam shape
  let I = 0; // Second moment of area mm⁴
  let Z = 0; // Section modulus mm³
  let J = 0; // Polar moment mm⁴
  let A = input.crossSectionArea ?? 0; // mm²

  switch (input.beamShape) {
    case 'rectangular':
      if (input.beamWidth && input.beamHeight) {
        const b = input.beamWidth;
        const h = input.beamHeight;
        I = (b * Math.pow(h, 3)) / 12;
        Z = (b * Math.pow(h, 2)) / 6;
        A = b * h;
      }
      break;
    case 'circular':
      if (input.beamOuterDia) {
        const d = input.beamOuterDia;
        I = (Math.PI * Math.pow(d, 4)) / 64;
        Z = (Math.PI * Math.pow(d, 3)) / 32;
        J = (Math.PI * Math.pow(d, 4)) / 32;
        A = (Math.PI * Math.pow(d, 2)) / 4;
      }
      break;
    case 'hollow-circular':
      if (input.beamOuterDia && input.beamInnerDia) {
        const D = input.beamOuterDia;
        const di = input.beamInnerDia;
        I = (Math.PI * (Math.pow(D, 4) - Math.pow(di, 4))) / 64;
        Z = (Math.PI * (Math.pow(D, 4) - Math.pow(di, 4))) / (32 * D);
        J = (Math.PI * (Math.pow(D, 4) - Math.pow(di, 4))) / 32;
        A = (Math.PI * (Math.pow(D, 2) - Math.pow(di, 2))) / 4;
      }
      break;
    case 'i-beam':
      if (input.beamFlangeW && input.beamFlangeT && input.beamWebH && input.beamWebT) {
        const bf = input.beamFlangeW;
        const tf = input.beamFlangeT;
        const hw = input.beamWebH;
        const tw = input.beamWebT;
        const h = hw + 2 * tf;
        I = (bf * Math.pow(h, 3) - (bf - tw) * Math.pow(hw, 3)) / 12;
        Z = (bf * Math.pow(h, 3) - (bf - tw) * Math.pow(hw, 3)) / (6 * h);
        A = 2 * bf * tf + hw * tw;
      }
      break;
  }

  const Z_used = input.sectionModulus ?? Z;
  const J_used = J || (Math.PI * Math.pow(input.shaftDiameter ?? 0, 4)) / 32;
  const A_used = A || input.crossSectionArea || 1;

  // Stress calculations
  let axialStress = 0;
  let bendingStress = 0;
  let shearStress = 0;

  // Axial stress: σ = P/A
  if (input.axialForce) {
    axialStress = Math.abs(input.axialForce) / A_used;
  }

  // Bending stress: σ = M/Z (convert N·m to N·mm)
  if (input.bendingMoment) {
    bendingStress = (input.bendingMoment * 1000) / Z_used;
  }

  // Torsional shear stress: τ = Tr/J
  if (input.torque) {
    const r = (input.shaftDiameter ?? input.beamOuterDia ?? 0) / 2;
    shearStress = (input.torque * 1000 * r) / J_used;
  }

  // Von Mises stress: σ_vm = √(σ_x² + 3τ²)
  // For combined axial + bending + torsion
  const sigma_x = axialStress + bendingStress;
  const vonMisesStress = Math.sqrt(sigma_x * sigma_x + 3 * shearStress * shearStress);

  // Principal stresses
  const sigma_avg = sigma_x / 2;
  const R = Math.sqrt(Math.pow(sigma_avg, 2) + shearStress * shearStress);
  const principalStress1 = sigma_avg + R;
  const principalStress2 = sigma_avg - R;

  // Maximum shear stress (Tresca)
  const maxShearStress = Math.max(Math.abs(principalStress1 - principalStress2) / 2, shearStress);

  const factorOfSafety = yieldStrength / vonMisesStress;
  const designValid = factorOfSafety >= safetyFactor;
  const designMessage = designValid
    ? `DESIGN VALID — FoS = ${factorOfSafety.toFixed(2)} ≥ Required = ${safetyFactor}`
    : `DESIGN INVALID — FoS = ${factorOfSafety.toFixed(2)} < Required = ${safetyFactor}`;

  return {
    axialStress,
    bendingStress,
    shearStress,
    vonMisesStress,
    principalStress1,
    principalStress2,
    maxShearStress,
    factorOfSafety,
    designValid,
    designMessage,
    sectionModulusCalculated: Z_used,
    polarModulusCalculated: J_used,
  };
}

// Fatigue Life Calculations (Soderberg, Goodman, Gerber criteria)

export interface FatigueInput {
  meanStress: number; // MPa (σ_m)
  alternatingStress: number; // MPa (σ_a)
  ultimateTensileStrength: number; // MPa (S_ut)
  yieldStrength: number; // MPa (S_y)
  enduranceLimit?: number; // MPa (S_e) — if not provided, estimated
  surfaceFinish?: 'polished' | 'ground' | 'machined' | 'hot-rolled' | 'forged';
  sizeFactor?: number; // k_b (0.1 to 1.0)
  temperatureFactor?: number; // k_d
  reliabilityFactor?: number; // k_c (0.814 to 1.0)
  desiredLife?: number; // in hours
  cyclesPerSecond?: number; // Hz
  criteria: 'soderberg' | 'goodman' | 'gerber';
}

export interface FatigueResult {
  enduranceLimitEstimated: number; // MPa
  enduranceLimitModified: number; // MPa
  soderbergSafetyFactor: number;
  goodmanSafetyFactor: number;
  gerberSafetyFactor: number;
  selectedSafetyFactor: number;
  estimatedLifeCycles: number; // number of cycles to failure
  estimatedLifeHours: number;
  designValid: boolean;
  designMessage: string;
  modificationFactors: {
    surface: number;
    size: number;
    temperature: number;
    reliability: number;
  };
  snData: { cycles: number; stress: number }[]; // for S-N curve
}

export function estimateEnduranceLimit(ultimateTensileStrength: number): number {
  // For steel: S_e' = 0.5 × S_ut for S_ut ≤ 1400 MPa
  // For S_ut > 1400 MPa, S_e' = 700 MPa (approximate plateau)
  return ultimateTensileStrength <= 1400
    ? 0.5 * ultimateTensileStrength
    : 700;
}

export function getSurfaceFinishFactor(surfaceFinish: string, ultimateTensileStrength: number): number {
  const S_ut = ultimateTensileStrength;
  switch (surfaceFinish) {
    case 'polished': return 1.0;
    case 'ground': return 1.0 * Math.pow(1.34 * S_ut, -0.085);
    case 'machined': return 4.51 * Math.pow(S_ut, -0.265);
    case 'hot-rolled': return 57.7 * Math.pow(S_ut, -0.718);
    case 'forged': return 272 * Math.pow(S_ut, -0.995);
    default: return 0.8;
  }
}

export function calculateFatigueLife(input: FatigueInput): FatigueResult {
  const {
    meanStress, alternatingStress, ultimateTensileStrength, yieldStrength,
    enduranceLimit, surfaceFinish = 'machined', sizeFactor = 0.85,
    temperatureFactor = 1.0, reliabilityFactor = 0.814,
    desiredLife, cyclesPerSecond = 10, criteria,
  } = input;

  // Estimate endurance limit if not provided
  const enduranceLimitEstimated = enduranceLimit ?? estimateEnduranceLimit(ultimateTensileStrength);

  // Modification factors
  const k_a = getSurfaceFinishFactor(surfaceFinish, ultimateTensileStrength);
  const k_b = sizeFactor;
  const k_d = temperatureFactor;
  const k_c = reliabilityFactor;

  const modificationFactors = {
    surface: k_a,
    size: k_b,
    temperature: k_d,
    reliability: k_c,
  };

  // Modified endurance limit: S_e = k_a × k_b × k_c × k_d × S_e'
  const enduranceLimitModified = k_a * k_b * k_c * k_d * enduranceLimitEstimated;

  // Soderberg criterion: σ_a / S_e + σ_m / S_y = 1/n
  const soderbergN = 1 / (alternatingStress / enduranceLimitModified + meanStress / yieldStrength);

  // Goodman criterion: σ_a / S_e + σ_m / S_ut = 1/n
  const goodmanN = 1 / (alternatingStress / enduranceLimitModified + meanStress / ultimateTensileStrength);

  // Gerber criterion: (n × σ_a / S_e)² + (n × σ_m / S_ut) = 1
  const gerberA = Math.pow(alternatingStress / enduranceLimitModified, 2);
  const gerberB = meanStress / ultimateTensileStrength;
  const gerberN = 1 / (gerberA + Math.sqrt(Math.pow(gerberA, 2) / 4 + gerberB * gerberA));

  let selectedSafetyFactor: number;
  switch (criteria) {
    case 'soderberg': selectedSafetyFactor = soderbergN; break;
    case 'goodman': selectedSafetyFactor = goodmanN; break;
    case 'gerber': selectedSafetyFactor = gerberN; break;
    default: selectedSafetyFactor = soderbergN;
  }

  // Estimate life cycles using Basquin's equation (simplified)
  // σ_a^b × N = const, using log-linear S-N interpolation
  const log10Se = Math.log10(enduranceLimitModified);
  const log10Sut = Math.log10(ultimateTensileStrength * 0.9);
  const log10N_e = 6; // endurance limit at 10^6 cycles
  const log10N_f = 3; // fracture at 10^3 cycles

  const slope = (log10Sut - log10Se) / (log10N_f - log10N_e);
  const log10N = log10N_e + (Math.log10(alternatingStress) - log10Se) / slope;
  const estimatedLifeCycles = alternatingStress > enduranceLimitModified
    ? Math.pow(10, Math.max(0, log10N))
    : Infinity;

  const estimatedLifeHours = estimatedLifeCycles === Infinity
    ? Infinity
    : estimatedLifeCycles / (cyclesPerSecond * 3600);

  const designValid = selectedSafetyFactor >= 1.5;
  const designMessage = designValid
    ? `DESIGN VALID — FoS (${criteria}) = ${selectedSafetyFactor.toFixed(2)} ≥ 1.5 (recommended)`
    : `DESIGN RISK — FoS (${criteria}) = ${selectedSafetyFactor.toFixed(2)} < 1.5. Consider redesign.`;

  // Generate S-N curve data
  const snData: { cycles: number; stress: number }[] = [];
  for (let exp = 2; exp <= 8; exp++) {
    const N = Math.pow(10, exp);
    const sigma = N <= 1000
      ? ultimateTensileStrength * 0.9
      : Math.pow(10, log10Se + slope * (exp - log10N_e));
    snData.push({ cycles: N, stress: sigma });
  }

  return {
    enduranceLimitEstimated,
    enduranceLimitModified,
    soderbergSafetyFactor: soderbergN,
    goodmanSafetyFactor: goodmanN,
    gerberSafetyFactor: gerberN,
    selectedSafetyFactor,
    estimatedLifeCycles,
    estimatedLifeHours,
    designValid,
    designMessage,
    modificationFactors,
    snData,
  };
}

// Bearing Selection Calculations (ISO 281 standard)

export interface BearingInput {
  radialLoad: number; // N (F_r)
  axialLoad: number; // N (F_a)
  shaftRPM: number;
  desiredLifeHours: number; // L_h10
  bearingType: 'deep-groove-ball' | 'angular-contact-ball' | 'cylindrical-roller' | 'tapered-roller' | 'thrust-ball';
  shaftDiameter: number; // mm (approximate bore)
  loadType: 'steady' | 'light-shock' | 'moderate-shock' | 'heavy-shock';
}

// Bearing database (simplified) — C (dynamic capacity), C0 (static capacity) in kN
const BEARING_DATABASE: Record<string, Array<{ series: string; bore: number; C: number; C0: number; X: number; Y: number; e: number; }>> = {
  'deep-groove-ball': [
    { series: '6204', bore: 20, C: 12.8, C0: 6.65, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6205', bore: 25, C: 14.0, C0: 7.85, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6206', bore: 30, C: 19.5, C0: 11.3, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6207', bore: 35, C: 25.5, C0: 15.3, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6208', bore: 40, C: 29.1, C0: 17.8, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6210', bore: 50, C: 35.0, C0: 23.2, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6304', bore: 20, C: 15.9, C0: 7.35, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6305', bore: 25, C: 22.2, C0: 11.5, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6306', bore: 30, C: 28.1, C0: 14.6, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6307', bore: 35, C: 33.2, C0: 18.0, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6308', bore: 40, C: 41.0, C0: 22.4, X: 0.56, Y: 1.0, e: 0.44 },
    { series: '6310', bore: 50, C: 61.8, C0: 37.0, X: 0.56, Y: 1.0, e: 0.44 },
  ],
  'angular-contact-ball': [
    { series: '7204B', bore: 20, C: 14.5, C0: 8.15, X: 0.44, Y: 1.0, e: 0.46 },
    { series: '7205B', bore: 25, C: 16.5, C0: 10.0, X: 0.44, Y: 1.0, e: 0.46 },
    { series: '7206B', bore: 30, C: 23.0, C0: 14.5, X: 0.44, Y: 1.0, e: 0.46 },
    { series: '7207B', bore: 35, C: 29.5, C0: 19.0, X: 0.44, Y: 1.0, e: 0.46 },
    { series: '7208B', bore: 40, C: 35.0, C0: 23.5, X: 0.44, Y: 1.0, e: 0.46 },
    { series: '7210B', bore: 50, C: 49.0, C0: 34.0, X: 0.44, Y: 1.0, e: 0.46 },
  ],
  'cylindrical-roller': [
    { series: 'NU204', bore: 20, C: 28.0, C0: 23.8, X: 1.0, Y: 0.0, e: 0.0 },
    { series: 'NU205', bore: 25, C: 35.0, C0: 31.0, X: 1.0, Y: 0.0, e: 0.0 },
    { series: 'NU206', bore: 30, C: 44.5, C0: 40.0, X: 1.0, Y: 0.0, e: 0.0 },
    { series: 'NU207', bore: 35, C: 54.0, C0: 50.0, X: 1.0, Y: 0.0, e: 0.0 },
    { series: 'NU208', bore: 40, C: 62.0, C0: 58.0, X: 1.0, Y: 0.0, e: 0.0 },
    { series: 'NU210', bore: 50, C: 80.0, C0: 78.0, X: 1.0, Y: 0.0, e: 0.0 },
  ],
  'tapered-roller': [
    { series: '30204', bore: 20, C: 28.0, C0: 23.8, X: 0.4, Y: 1.6, e: 0.40 },
    { series: '30205', bore: 25, C: 37.0, C0: 30.0, X: 0.4, Y: 1.6, e: 0.40 },
    { series: '30206', bore: 30, C: 45.0, C0: 38.5, X: 0.4, Y: 1.6, e: 0.40 },
    { series: '30207', bore: 35, C: 55.0, C0: 48.5, X: 0.4, Y: 1.6, e: 0.40 },
    { series: '30208', bore: 40, C: 64.0, C0: 57.0, X: 0.4, Y: 1.6, e: 0.40 },
    { series: '30210', bore: 50, C: 80.0, C0: 74.0, X: 0.4, Y: 1.6, e: 0.40 },
  ],
  'thrust-ball': [
    { series: '51104', bore: 20, C: 22.5, C0: 48.0, X: 0.0, Y: 1.0, e: 0.0 },
    { series: '51105', bore: 25, C: 24.5, C0: 55.0, X: 0.0, Y: 1.0, e: 0.0 },
    { series: '51106', bore: 30, C: 27.0, C0: 62.0, X: 0.0, Y: 1.0, e: 0.0 },
    { series: '51107', bore: 35, C: 31.0, C0: 70.0, X: 0.0, Y: 1.0, e: 0.0 },
    { series: '51108', bore: 40, C: 35.5, C0: 82.0, X: 0.0, Y: 1.0, e: 0.0 },
    { series: '51110', bore: 50, C: 44.0, C0: 100.0, X: 0.0, Y: 1.0, e: 0.0 },
  ],
};

export interface BearingResult {
  equivalentDynamicLoad: number; // N
  requiredCapacity: number; // kN (minimum required C)
  recommendedBearing: {
    series: string;
    bore: number;
    C: number;
    C0: number;
  } | null;
  alternativeBearings: Array<{ series: string; bore: number; C: number; C0: number; achievedLife: number; }>;
  achievedLifeHours: number;
  designValid: boolean;
  designMessage: string;
  loadRatio: number;
  serviceFactor: number;
  pExponent: number;
  lifeMillions: number;
}

export function calculateBearingSelection(input: BearingInput): BearingResult {
  const { radialLoad, axialLoad, shaftRPM, desiredLifeHours, bearingType, shaftDiameter, loadType } = input;

  // Application factor based on load type
  const serviceFactors: Record<string, number> = {
    'steady': 1.0,
    'light-shock': 1.2,
    'moderate-shock': 1.5,
    'heavy-shock': 2.0,
  };
  const serviceFactor = serviceFactors[loadType] ?? 1.2;

  // p exponent: 3 for ball bearings, 10/3 for roller bearings
  const p_exponent = ['deep-groove-ball', 'angular-contact-ball', 'thrust-ball'].includes(bearingType) ? 3 : 10 / 3;

  // Find candidate bearings for this type
  const candidates = BEARING_DATABASE[bearingType] || [];

  // For each candidate, calculate equivalent dynamic load P = XF_r + YF_a
  // For thrust bearings, only axial load is considered
  let bestBearing: typeof candidates[0] | null = null;
  let bestLife = 0;

  const results: BearingResult['alternativeBearings'] = candidates.map(bearing => {
    let P: number;
    if (bearingType === 'thrust-ball') {
      P = axialLoad * serviceFactor;
    } else {
      const fa_ratio = axialLoad / (bearing.C0 * 1000);
      const useX = fa_ratio > bearing.e ? bearing.X : 1.0;
      const useY = fa_ratio > bearing.e ? bearing.Y : 0.0;
      P = (useX * radialLoad + useY * axialLoad) * serviceFactor;
    }

    // L10 life in millions of revolutions: L = (C/P)^p
    const L_millions = Math.pow((bearing.C * 1000) / P, p_exponent);

    // Life in hours: L_h = L10 × 10^6 / (60 × n)
    const L_hours = (L_millions * 1e6) / (60 * shaftRPM);

    if (L_hours > bestLife) {
      bestLife = L_hours;
      bestBearing = bearing;
    }

    return {
      series: bearing.series,
      bore: bearing.bore,
      C: bearing.C,
      C0: bearing.C0,
      achievedLife: L_hours,
    };
  });

  // Calculate required capacity for desired life
  // C_req = P × (L_desired_millions)^(1/p)
  const desiredLifeMillions = (desiredLifeHours * 60 * shaftRPM) / 1e6;
  const recommendedBearing = bestBearing;
  const achievedLifeHours = bestLife;

  const equivalentDynamicLoad = recommendedBearing
    ? (bearingType === 'thrust-ball'
      ? axialLoad * serviceFactor
      : (() => {
          const fa_ratio = axialLoad / (recommendedBearing.C0 * 1000);
          const useX = fa_ratio > recommendedBearing.e ? recommendedBearing.X : 1.0;
          const useY = fa_ratio > recommendedBearing.e ? recommendedBearing.Y : 0.0;
          return (useX * radialLoad + useY * axialLoad) * serviceFactor;
        })())
    : radialLoad * serviceFactor;

  const requiredCapacity = Math.pow(equivalentDynamicLoad, 1 - 1 / p_exponent) * Math.pow(desiredLifeMillions, 1 / p_exponent) / 1000;

  // Prefer bearings close to shaft diameter
  const sortedResults = results.sort((a, b) => {
    const distA = Math.abs(a.bore - shaftDiameter);
    const distB = Math.abs(b.bore - shaftDiameter);
    return distA - distB;
  });

  const designValid = achievedLifeHours >= desiredLifeHours;
  const designMessage = designValid
    ? `DESIGN VALID — Achieved L10 = ${achievedLifeHours.toFixed(0)} hours ≥ Required = ${desiredLifeHours} hours`
    : `WARNING — Achieved L10 = ${achievedLifeHours.toFixed(0)} hours < Required = ${desiredLifeHours} hours. Consider larger bearing or reduce load.`;

  return {
    equivalentDynamicLoad,
    requiredCapacity,
    recommendedBearing: recommendedBearing ? { series: recommendedBearing.series, bore: recommendedBearing.bore, C: recommendedBearing.C, C0: recommendedBearing.C0 } : null,
    alternativeBearings: sortedResults,
    achievedLifeHours,
    designValid,
    designMessage,
    loadRatio: axialLoad > 0 ? radialLoad / axialLoad : Infinity,
    serviceFactor,
    pExponent: p_exponent,
    lifeMillions: (achievedLifeHours * 60 * shaftRPM) / 1e6,
  };
}

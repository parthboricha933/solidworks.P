// Shaft Design Calculations

export interface ShaftInput {
  power: number; // kW
  rpm: number;
  materialYieldStrength: number; // MPa
  safetyFactor: number;
  shaftType: 'solid' | 'hollow';
  keywayFactor?: number; // typically 0.75 for keyway
}

export interface ShaftResult {
  torque: number; // N·m
  shearStressAllowable: number; // MPa
  diameterMin: number; // mm
  diameterRecommended: number; // mm (rounded to nearest standard)
  polarMomentOfInertia: number; // mm⁴
  angularDeflection: number; // degrees per meter
  powerValidation: string;
  standardSizes: number[];
  selectedDiameter: number;
}

export function calculateShaftDesign(input: ShaftInput): ShaftResult {
  // Torque calculation: T = (60 × P) / (2π × N)
  const torque = (60 * input.power * 1000) / (2 * Math.PI * input.rpm); // N·m (P in Watts)

  // Allowable shear stress: τ_allow = σ_y / (2 × FS)
  const keywayFactor = input.keywayFactor ?? 0.75;
  const shearStressAllowable = (input.materialYieldStrength * keywayFactor) / (2 * input.safetyFactor);

  // Minimum diameter: d = (16T / (π × τ_allow))^(1/3)
  const torqueNmm = torque * 1000; // Convert to N·mm
  const diameterMin = Math.pow((16 * torqueNmm) / (Math.PI * shearStressAllowable), 1 / 3);

  // Standard shaft diameters (ISO 286) in mm
  const standardSizes = [6, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 19, 20, 21, 22, 24, 25,
    26, 28, 30, 32, 34, 35, 36, 38, 40, 42, 44, 45, 46, 48, 50, 52, 55, 56, 58, 60,
    62, 63, 65, 68, 70, 72, 75, 78, 80, 82, 85, 88, 90, 92, 95, 98, 100, 105, 110,
    115, 120, 125, 130, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190,
    195, 200, 210, 220, 230, 240, 250];

  // Select the next standard size above minimum
  const selectedDiameter = standardSizes.find(d => d >= diameterMin) ?? Math.ceil(diameterMin);
  const diameterRecommended = selectedDiameter;

  // Polar moment of inertia for solid shaft: J = πd⁴/32
  const d_mm = diameterRecommended;
  const polarMomentOfInertia = (Math.PI * Math.pow(d_mm, 4)) / 32;

  // Angular deflection per meter: θ = TL / (GJ) where G = 79.3 GPa for steel
  const G = 79300; // MPa for steel
  const angularDeflection = (torqueNmm * 1000) / (G * polarMomentOfInertia) * (180 / Math.PI); // degrees/m

  // Power validation
  const actualTorque = torque;
  const actualShearStress = (16 * torqueNmm) / (Math.PI * Math.pow(d_mm, 3));
  const actualFoS = (input.materialYieldStrength * keywayFactor) / (2 * actualShearStress);
  const powerValidation = actualFoS >= input.safetyFactor
    ? `DESIGN VALID — Actual FoS = ${actualFoS.toFixed(2)} ≥ Required FoS = ${input.safetyFactor}`
    : `DESIGN INVALID — Actual FoS = ${actualFoS.toFixed(2)} < Required FoS = ${input.safetyFactor}`;

  return {
    torque: torque,
    shearStressAllowable: shearStressAllowable,
    diameterMin: diameterMin,
    diameterRecommended: diameterRecommended,
    polarMomentOfInertia: polarMomentOfInertia,
    angularDeflection: angularDeflection,
    powerValidation: powerValidation,
    standardSizes: standardSizes.slice(0, 30),
    selectedDiameter: selectedDiameter,
  };
}

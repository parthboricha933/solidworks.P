// Spur Gear Design Calculations (AGMA Standards)

export interface GearInput {
  power: number; // kW
  rpm: number; // pinion RPM
  numberOfTeethPinion: number;
  gearRatio: number; // i = Z2/Z1
  module: number; // mm
  pressureAngle: number; // degrees (typically 20)
  faceWidthFactor?: number; // b = factor × m (typically 10)
  materialAllowableStress: number; // MPa (bending fatigue limit)
  serviceFactor: number;
}

export interface GearResult {
  pinionTeeth: number;
  gearTeeth: number;
  module: number;
  pitchDiameterPinion: number; // mm
  pitchDiameterGear: number; // mm
  centerDistance: number; // mm
  addendum: number; // mm
  dedendum: number; // mm
  wholeDepth: number; // mm
  faceWidth: number; // mm
  circularPitch: number; // mm
  basePitch: number; // mm
  tangentialForce: number; // N
  bendingStress: number; // MPa
  LewisFormFactor: number;
  designValid: boolean;
  designMessage: string;
  tipDiameterPinion: number; // mm
  tipDiameterGear: number; // mm
  rootDiameterPinion: number; // mm
  rootDiameterGear: number; // mm
  helixAngle: number; // degrees (0 for spur)
  gearRPM: number;
}

export function calculateGearDesign(input: GearInput): GearResult {
  const { power, rpm, numberOfTeethPinion, gearRatio, module, pressureAngle,
    faceWidthFactor = 10, materialAllowableStress, serviceFactor } = input;

  const gearTeeth = Math.round(numberOfTeethPinion * gearRatio);
  const gearRPM = rpm / gearRatio;

  // Pitch diameters
  const pitchDiameterPinion = module * numberOfTeethPinion;
  const pitchDiameterGear = module * gearTeeth;

  // Center distance
  const centerDistance = (pitchDiameterPinion + pitchDiameterGear) / 2;

  // Tooth proportions (standard full-depth involute)
  const addendum = 1 * module;
  const dedendum = 1.25 * module;
  const wholeDepth = addendum + dedendum;

  // Face width
  const faceWidth = faceWidthFactor * module;

  // Circular and base pitch
  const circularPitch = Math.PI * module;
  const pressureAngleRad = (pressureAngle * Math.PI) / 180;
  const basePitch = circularPitch * Math.cos(pressureAngleRad);

  // Torque on pinion
  const torquePinion = (power * 1000 * 60) / (2 * Math.PI * rpm); // N·m

  // Tangential force
  const tangentialForce = (torquePinion * 1000) / (pitchDiameterPinion / 2); // N (using mm)

  // Lewis form factor (approximate for standard 20° full-depth teeth)
  const lewisFormFactor = 0.154 + 0.912 / numberOfTeethPinion;

  // Bending stress (Lewis equation): σ = Ft × FS / (b × m × Y)
  const bendingStress = (tangentialForce * serviceFactor) / (faceWidth * module * lewisFormFactor);

  // Tip and root diameters
  const tipDiameterPinion = pitchDiameterPinion + 2 * addendum;
  const tipDiameterGear = pitchDiameterGear + 2 * addendum;
  const rootDiameterPinion = pitchDiameterPinion - 2 * dedendum;
  const rootDiameterGear = pitchDiameterGear - 2 * dedendum;

  const designValid = bendingStress <= materialAllowableStress;
  const designMessage = designValid
    ? `DESIGN VALID — Bending stress ${bendingStress.toFixed(1)} MPa ≤ Allowable ${materialAllowableStress} MPa`
    : `DESIGN INVALID — Bending stress ${bendingStress.toFixed(1)} MPa > Allowable ${materialAllowableStress} MPa. Increase module or face width.`;

  return {
    pinionTeeth: numberOfTeethPinion,
    gearTeeth,
    module,
    pitchDiameterPinion,
    pitchDiameterGear,
    centerDistance,
    addendum,
    dedendum,
    wholeDepth,
    faceWidth,
    circularPitch,
    basePitch,
    tangentialForce,
    bendingStress,
    LewisFormFactor: lewisFormFactor,
    designValid,
    designMessage,
    tipDiameterPinion,
    tipDiameterGear,
    rootDiameterPinion,
    rootDiameterGear,
    helixAngle: 0,
    gearRPM,
  };
}

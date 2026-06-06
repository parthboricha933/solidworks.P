'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Cog, Calculator, Wrench, Cpu, FileText, Settings, Gauge,
  CheckCircle, AlertTriangle, XCircle, Copy, Download, RotateCcw, Zap, Shield, Box, Image as ImageIcon, Eye, Loader2
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

type ToolTab = 'shaft' | 'gear' | 'stress' | 'fatigue' | 'bearing' | 'dfm' | 'manufacturing' | 'bom' | 'ai-modeling' | 'ai-vba' | 'ai-python' | 'ai-spec';

// Safe fetch helper — handles non-JSON responses (e.g. proxy HTML error pages)
async function fetchJSON(url: string, options?: RequestInit, timeoutMs = 30000): Promise<any> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('application/json')) {
      const text = await res.text().catch(() => '');
      throw new Error(`Server returned non-JSON response (${res.status}). ${text.slice(0, 120)}`);
    }
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Request failed with status ${res.status}`);
    }
    return data;
  } finally {
    clearTimeout(timer);
  }
}

// =============================================
// SHAFT DESIGN CALCULATOR
// =============================================
function ShaftCalculator() {
  const [power, setPower] = useState('20');
  const [rpm, setRpm] = useState('1500');
  const [yieldStrength, setYieldStrength] = useState('350');
  const [safetyFactor, setSafetyFactor] = useState('2.5');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'shaft',
          input: {
            power: parseFloat(power),
            rpm: parseFloat(rpm),
            materialYieldStrength: parseFloat(yieldStrength),
            safetyFactor: parseFloat(safetyFactor),
            shaftType: 'solid',
            keywayFactor: 0.75,
          },
        }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Input Parameters</CardTitle>
          <CardDescription>Enter shaft design parameters</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Power (kW)</Label><Input type="number" value={power} onChange={e => setPower(e.target.value)} /></div>
            <div><Label>RPM</Label><Input type="number" value={rpm} onChange={e => setRpm(e.target.value)} /></div>
            <div><Label>Yield Strength (MPa)</Label><Input type="number" value={yieldStrength} onChange={e => setYieldStrength(e.target.value)} /></div>
            <div><Label>Safety Factor</Label><Input type="number" step="0.1" value={safetyFactor} onChange={e => setSafetyFactor(e.target.value)} /></div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Calculate Shaft Diameter</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Results</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Torque</span><div className="font-bold text-lg">{result.torque.toFixed(1)} N·m</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Min Diameter</span><div className="font-bold text-lg">{result.diameterMin.toFixed(2)} mm</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg"><span className="opacity-80">Recommended (ISO)</span><div className="font-bold text-xl">{result.diameterRecommended} mm</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Allowable Shear</span><div className="font-bold text-lg">{result.shearStressAllowable.toFixed(1)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Polar Moment J</span><div className="font-bold text-lg">{result.polarMomentOfInertia.toFixed(0)} mm⁴</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Torsional Deflection</span><div className="font-bold text-lg">{result.angularDeflection.toFixed(4)} °/m</div></div>
            </div>
            <Alert className={result.powerValidation.includes('VALID') ? 'border-green-500' : 'border-red-500'}>
              <AlertTitle className="flex items-center gap-2">
                {result.powerValidation.includes('VALID') ? <><CheckCircle className="h-4 w-4 text-green-500" /> Valid</> : <><XCircle className="h-4 w-4 text-red-500" /> Invalid</>}
              </AlertTitle>
              <AlertDescription className="text-sm">{result.powerValidation}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// GEAR DESIGN CALCULATOR
// =============================================
function GearCalculator() {
  const [input, setInput] = useState({ power: '10', rpm: '1440', teeth: '20', gearRatio: '3', module: '3', pressureAngle: '20', allowStress: '200', serviceFactor: '1.5' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: 'gear',
          input: {
            power: parseFloat(input.power), rpm: parseFloat(input.rpm),
            numberOfTeethPinion: parseInt(input.teeth), gearRatio: parseFloat(input.gearRatio),
            module: parseFloat(input.module), pressureAngle: parseFloat(input.pressureAngle),
            materialAllowableStress: parseFloat(input.allowStress), serviceFactor: parseFloat(input.serviceFactor),
          },
        }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const set = (key: string, value: string) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Spur Gear Parameters</CardTitle>
          <CardDescription>AGMA standard gear design</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Power (kW)</Label><Input type="number" value={input.power} onChange={e => set('power', e.target.value)} /></div>
            <div><Label>Pinion RPM</Label><Input type="number" value={input.rpm} onChange={e => set('rpm', e.target.value)} /></div>
            <div><Label>No. of Teeth (Pinion)</Label><Input type="number" value={input.teeth} onChange={e => set('teeth', e.target.value)} /></div>
            <div><Label>Gear Ratio (i)</Label><Input type="number" step="0.1" value={input.gearRatio} onChange={e => set('gearRatio', e.target.value)} /></div>
            <div><Label>Module (mm)</Label><Input type="number" value={input.module} onChange={e => set('module', e.target.value)} /></div>
            <div><Label>Pressure Angle (°)</Label><Input type="number" value={input.pressureAngle} onChange={e => set('pressureAngle', e.target.value)} /></div>
            <div><Label>Allowable Stress (MPa)</Label><Input type="number" value={input.allowStress} onChange={e => set('allowStress', e.target.value)} /></div>
            <div><Label>Service Factor</Label><Input type="number" step="0.1" value={input.serviceFactor} onChange={e => set('serviceFactor', e.target.value)} /></div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Design Gear Pair</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Gear Design Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Pinion Teeth</span><div className="font-bold">{result.pinionTeeth}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Gear Teeth</span><div className="font-bold">{result.gearTeeth}</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg"><span className="opacity-80">Center Distance</span><div className="font-bold text-lg">{result.centerDistance.toFixed(1)} mm</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Tangential Force</span><div className="font-bold">{result.tangentialForce.toFixed(0)} N</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Pinion Ø</span><div className="font-bold">{result.pitchDiameterPinion.toFixed(1)} mm</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Gear Ø</span><div className="font-bold">{result.pitchDiameterGear.toFixed(1)} mm</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Face Width</span><div className="font-bold">{result.faceWidth.toFixed(1)} mm</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Bending Stress</span><div className="font-bold">{result.bendingStress.toFixed(1)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Lewis Factor Y</span><div className="font-bold">{result.LewisFormFactor.toFixed(3)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Gear RPM</span><div className="font-bold">{result.gearRPM.toFixed(0)}</div></div>
            </div>
            <Alert className={result.designValid ? 'border-green-500' : 'border-red-500'}>
              <AlertTitle className="flex items-center gap-2">
                {result.designValid ? <><CheckCircle className="h-4 w-4 text-green-500" /> Valid</> : <><XCircle className="h-4 w-4 text-red-500" /> Invalid</>}
              </AlertTitle>
              <AlertDescription className="text-sm">{result.designMessage}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// STRESS ANALYSIS CALCULATOR
// =============================================
function StressCalculator() {
  const [input, setInput] = useState({ loadingType: 'combined', axialForce: '5000', bendingMoment: '100', beamShape: 'circular', beamOuterDia: '50', beamInnerDia: '0', torque: '80', shaftDiameter: '50', yieldStrength: '250', safetyFactor: '2' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'stress', input: { ...input, axialForce: parseFloat(input.axialForce), bendingMoment: parseFloat(input.bendingMoment), beamShape: input.beamShape, beamOuterDia: parseFloat(input.beamOuterDia), beamInnerDia: parseFloat(input.beamInnerDia) || 0, torque: parseFloat(input.torque), shaftDiameter: parseFloat(input.shaftDiameter), yieldStrength: parseFloat(input.yieldStrength), safetyFactor: parseFloat(input.safetyFactor) } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const s = (key: string, value: string) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stress Analysis Parameters</CardTitle>
          <CardDescription>Von Mises, principal stresses, shear analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Loading Type</Label>
              <Select value={input.loadingType} onValueChange={v => s('loadingType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="axial">Axial</SelectItem>
                  <SelectItem value="bending">Bending</SelectItem>
                  <SelectItem value="torsion">Torsion</SelectItem>
                  <SelectItem value="combined">Combined</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Cross Section</Label>
              <Select value={input.beamShape} onValueChange={v => s('beamShape', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="circular">Solid Circular</SelectItem>
                  <SelectItem value="hollow-circular">Hollow Circular</SelectItem>
                  <SelectItem value="rectangular">Rectangular</SelectItem>
                  <SelectItem value="i-beam">I-Beam</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Axial Force (N)</Label><Input type="number" value={input.axialForce} onChange={e => s('axialForce', e.target.value)} /></div>
            <div><Label>Bending Moment (N·m)</Label><Input type="number" value={input.bendingMoment} onChange={e => s('bendingMoment', e.target.value)} /></div>
            <div><Label>Torque (N·m)</Label><Input type="number" value={input.torque} onChange={e => s('torque', e.target.value)} /></div>
            <div><Label>Outer Dia/Width (mm)</Label><Input type="number" value={input.beamOuterDia} onChange={e => s('beamOuterDia', e.target.value)} /></div>
            <div><Label>Inner Dia/Height (mm)</Label><Input type="number" value={input.beamInnerDia} onChange={e => s('beamInnerDia', e.target.value)} /></div>
            <div><Label>Yield Strength (MPa)</Label><Input type="number" value={input.yieldStrength} onChange={e => s('yieldStrength', e.target.value)} /></div>
            <div><Label>Safety Factor</Label><Input type="number" step="0.1" value={input.safetyFactor} onChange={e => s('safetyFactor', e.target.value)} /></div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Analyze Stress</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Stress Analysis Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Axial Stress</span><div className="font-bold">{result.axialStress.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Bending Stress</span><div className="font-bold">{result.bendingStress.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Shear Stress</span><div className="font-bold">{result.shearStress.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg"><span className="opacity-80">Von Mises Stress</span><div className="font-bold text-lg">{result.vonMisesStress.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Principal Stress σ₁</span><div className="font-bold">{result.principalStress1.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Principal Stress σ₂</span><div className="font-bold">{result.principalStress2.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Max Shear (Tresca)</span><div className="font-bold">{result.maxShearStress.toFixed(2)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Factor of Safety</span><div className="font-bold">{result.factorOfSafety.toFixed(2)}</div></div>
            </div>
            <Alert className={result.designValid ? 'border-green-500' : 'border-red-500'}>
              <AlertTitle className="flex items-center gap-2">
                {result.designValid ? <><CheckCircle className="h-4 w-4 text-green-500" /> Valid</> : <><XCircle className="h-4 w-4 text-red-500" /> Invalid</>}
              </AlertTitle>
              <AlertDescription className="text-sm">{result.designMessage}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// FATIGUE LIFE CALCULATOR
// =============================================
function FatigueCalculator() {
  const [input, setInput] = useState({ meanStress: '50', alternatingStress: '100', ultimateTensileStrength: '550', yieldStrength: '350', surfaceFinish: 'machined', sizeFactor: '0.85', criteria: 'goodman', cyclesPerSecond: '25' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'fatigue', input: { meanStress: parseFloat(input.meanStress), alternatingStress: parseFloat(input.alternatingStress), ultimateTensileStrength: parseFloat(input.ultimateTensileStrength), yieldStrength: parseFloat(input.yieldStrength), surfaceFinish: input.surfaceFinish, sizeFactor: parseFloat(input.sizeFactor), cyclesPerSecond: parseFloat(input.cyclesPerSecond), criteria: input.criteria } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const s = (key: string, value: string) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Fatigue Life Parameters</CardTitle>
          <CardDescription>Soderberg, Goodman, Gerber criteria</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Mean Stress σₘ (MPa)</Label><Input type="number" value={input.meanStress} onChange={e => s('meanStress', e.target.value)} /></div>
            <div><Label>Alternating Stress σₐ (MPa)</Label><Input type="number" value={input.alternatingStress} onChange={e => s('alternatingStress', e.target.value)} /></div>
            <div><Label>UTS (MPa)</Label><Input type="number" value={input.ultimateTensileStrength} onChange={e => s('ultimateTensileStrength', e.target.value)} /></div>
            <div><Label>Yield Strength (MPa)</Label><Input type="number" value={input.yieldStrength} onChange={e => s('yieldStrength', e.target.value)} /></div>
            <div><Label>Surface Finish</Label>
              <Select value={input.surfaceFinish} onValueChange={v => s('surfaceFinish', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="polished">Polished</SelectItem>
                  <SelectItem value="ground">Ground</SelectItem>
                  <SelectItem value="machined">Machined</SelectItem>
                  <SelectItem value="hot-rolled">Hot-Rolled</SelectItem>
                  <SelectItem value="forged">Forged</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Size Factor k_b</Label><Input type="number" step="0.05" value={input.sizeFactor} onChange={e => s('sizeFactor', e.target.value)} /></div>
            <div><Label>Fatigue Criterion</Label>
              <Select value={input.criteria} onValueChange={v => s('criteria', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="soderberg">Soderberg (Conservative)</SelectItem>
                  <SelectItem value="goodman">Goodman</SelectItem>
                  <SelectItem value="gerber">Gerber (Optimistic)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Cycles/Second (Hz)</Label><Input type="number" value={input.cyclesPerSecond} onChange={e => s('cyclesPerSecond', e.target.value)} /></div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Calculate Fatigue Life</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Fatigue Analysis Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Endurance Limit (Est.)</span><div className="font-bold">{result.enduranceLimitEstimated.toFixed(0)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Endurance Limit (Mod.)</span><div className="font-bold">{result.enduranceLimitModified.toFixed(0)} MPa</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Soderberg FoS</span><div className="font-bold">{result.soderbergSafetyFactor.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Goodman FoS</span><div className="font-bold">{result.goodmanSafetyFactor.toFixed(2)}</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg"><span className="opacity-80">Gerber FoS</span><div className="font-bold text-lg">{result.gerberSafetyFactor.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Est. Life Cycles</span><div className="font-bold">{result.estimatedLifeCycles === Infinity ? 'Infinite' : result.estimatedLifeCycles.toExponential(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg col-span-2"><span className="text-muted-foreground">Modification Factors</span>
                <div className="flex gap-4 mt-1">
                  <span>k_a: {result.modificationFactors.surface.toFixed(3)}</span>
                  <span>k_b: {result.modificationFactors.size.toFixed(2)}</span>
                  <span>k_d: {result.modificationFactors.temperature.toFixed(2)}</span>
                  <span>k_c: {result.modificationFactors.reliability.toFixed(3)}</span>
                </div>
              </div>
            </div>
            <Alert className={result.designValid ? 'border-green-500' : 'border-red-500'}>
              <AlertTitle className="flex items-center gap-2">
                {result.designValid ? <><CheckCircle className="h-4 w-4 text-green-500" /> Valid</> : <><AlertTriangle className="h-4 w-4 text-yellow-500" /> Risk</>}
              </AlertTitle>
              <AlertDescription className="text-sm">{result.designMessage}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// BEARING SELECTION CALCULATOR
// =============================================
function BearingCalculator() {
  const [input, setInput] = useState({ radialLoad: '5000', axialLoad: '2000', rpm: '1500', desiredLife: '20000', bearingType: 'deep-groove-ball', shaftDia: '35', loadType: 'moderate-shock' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'bearing', input: { radialLoad: parseFloat(input.radialLoad), axialLoad: parseFloat(input.axialLoad), shaftRPM: parseFloat(input.rpm), desiredLifeHours: parseFloat(input.desiredLife), bearingType: input.bearingType, shaftDiameter: parseFloat(input.shaftDia), loadType: input.loadType } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const s = (key: string, value: string) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Bearing Selection Parameters</CardTitle>
          <CardDescription>ISO 281 bearing life calculation</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Radial Load (N)</Label><Input type="number" value={input.radialLoad} onChange={e => s('radialLoad', e.target.value)} /></div>
            <div><Label>Axial Load (N)</Label><Input type="number" value={input.axialLoad} onChange={e => s('axialLoad', e.target.value)} /></div>
            <div><Label>Shaft RPM</Label><Input type="number" value={input.rpm} onChange={e => s('rpm', e.target.value)} /></div>
            <div><Label>Desired Life (hrs)</Label><Input type="number" value={input.desiredLife} onChange={e => s('desiredLife', e.target.value)} /></div>
            <div><Label>Bearing Type</Label>
              <Select value={input.bearingType} onValueChange={v => s('bearingType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="deep-groove-ball">Deep Groove Ball</SelectItem>
                  <SelectItem value="angular-contact-ball">Angular Contact Ball</SelectItem>
                  <SelectItem value="cylindrical-roller">Cylindrical Roller</SelectItem>
                  <SelectItem value="tapered-roller">Tapered Roller</SelectItem>
                  <SelectItem value="thrust-ball">Thrust Ball</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Shaft Diameter (mm)</Label><Input type="number" value={input.shaftDia} onChange={e => s('shaftDia', e.target.value)} /></div>
            <div className="col-span-2"><Label>Load Type</Label>
              <Select value={input.loadType} onValueChange={v => s('loadType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="steady">Steady</SelectItem>
                  <SelectItem value="light-shock">Light Shock</SelectItem>
                  <SelectItem value="moderate-shock">Moderate Shock</SelectItem>
                  <SelectItem value="heavy-shock">Heavy Shock</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Select Bearing</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Bearing Selection Results</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Equivalent Load</span><div className="font-bold">{result.equivalentDynamicLoad.toFixed(0)} N</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Service Factor</span><div className="font-bold">{result.serviceFactor}</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg"><span className="opacity-80">Recommended Bearing</span><div className="font-bold text-lg">{result.recommendedBearing?.series || 'N/A'}</div><div className="text-xs opacity-80">Bore: {result.recommendedBearing?.bore || '—'} mm | C: {result.recommendedBearing?.C || '—'} kN</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Achieved L10 Life</span><div className="font-bold">{result.achievedLifeHours.toFixed(0)} hrs</div></div>
            </div>
            {result.alternativeBearings && result.alternativeBearings.length > 0 && (
              <div className="mt-3">
                <p className="text-sm font-medium mb-2">Available Bearings Comparison:</p>
                <div className="max-h-48 overflow-y-auto space-y-1">
                  {result.alternativeBearings.map((b: any, i: number) => (
                    <div key={i} className={`flex justify-between items-center text-xs p-2 rounded ${b.series === result.recommendedBearing?.series ? 'bg-primary/10 border border-primary/30' : 'bg-muted/50'}`}>
                      <span className="font-mono font-medium">{b.series}</span>
                      <span>Ø{b.bore}mm</span>
                      <span>C={b.C}kN</span>
                      <span className={b.achievedLife >= parseFloat(input.desiredLife) ? 'text-green-600 font-bold' : 'text-red-500'}>{b.achievedLife.toFixed(0)} hrs</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <Alert className={result.designValid ? 'border-green-500' : 'border-red-500'}>
              <AlertTitle className="flex items-center gap-2">
                {result.designValid ? <><CheckCircle className="h-4 w-4 text-green-500" /> Valid</> : <><AlertTriangle className="h-4 w-4 text-yellow-500" /> Warning</>}
              </AlertTitle>
              <AlertDescription className="text-sm">{result.designMessage}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// DFM ANALYZER
// =============================================
function DFMAnalyzer() {
  const [input, setInput] = useState({ partType: 'bracket', material: 'Al 6061-T6', manufacturingProcess: 'cnc-machining', complexity: 'moderate', tolerance: 'standard', surfaceFinish: 'standard', annualVolume: '500', minWallThickness: '2.5', hasUndercuts: false, hasInternalFeatures: true, numberOfHoles: '8', requiresHeatTreatment: false });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'dfm', input: { ...input, partType: input.partType, annualVolume: parseInt(input.annualVolume), minWallThickness: parseFloat(input.minWallThickness), numberOfHoles: parseInt(input.numberOfHoles) } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const s = (key: string, value: string | boolean) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">DFM Analysis Parameters</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Part Type</Label>
              <Select value={input.partType} onValueChange={v => s('partType', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['shaft', 'gear', 'bracket', 'housing', 'plate', 'flange', 'custom'].map(t => <SelectItem key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Manufacturing Process</Label>
              <Select value={input.manufacturingProcess} onValueChange={v => s('manufacturingProcess', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {['cnc-machining', 'sheet-metal', 'casting', 'forging', '3d-printing', 'welding'].map(p => <SelectItem key={p} value={p}>{p.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div><Label>Complexity</Label>
              <Select value={input.complexity} onValueChange={v => s('complexity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Tolerance</Label>
              <Select value={input.tolerance} onValueChange={v => s('tolerance', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="standard">Standard</SelectItem>
                  <SelectItem value="precision">Precision</SelectItem>
                  <SelectItem value="ultra-precision">Ultra-Precision</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Annual Volume</Label><Input type="number" value={input.annualVolume} onChange={e => s('annualVolume', e.target.value)} /></div>
            <div><Label>Min Wall Thickness (mm)</Label><Input type="number" step="0.5" value={input.minWallThickness} onChange={e => s('minWallThickness', e.target.value)} /></div>
            <div><Label>Number of Holes</Label><Input type="number" value={input.numberOfHoles} onChange={e => s('numberOfHoles', e.target.value)} /></div>
            <div className="col-span-2 flex gap-4 items-center">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={input.hasUndercuts} onChange={e => s('hasUndercuts', e.target.checked)} /> Undercuts</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={input.hasInternalFeatures} onChange={e => s('hasInternalFeatures', e.target.checked)} /> Internal Features</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={input.requiresHeatTreatment} onChange={e => s('requiresHeatTreatment', e.target.checked)} /> Heat Treatment</label>
            </div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Shield className="mr-2 h-4 w-4" /> Run DFM Analysis</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">DFM Analysis Results</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="text-5xl font-bold">{result.manufacturabilityGrade}</div>
              <div className="flex-1">
                <div className="text-sm text-muted-foreground mb-1">Manufacturability Score</div>
                <Progress value={result.overallScore} className="h-3" />
                <div className="text-sm mt-1">{result.overallScore}/100</div>
              </div>
            </div>
            {result.issues.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                <p className="text-sm font-medium">Issues & Recommendations:</p>
                {result.issues.map((issue: any, i: number) => (
                  <div key={i} className={`p-3 rounded-lg text-sm border ${issue.severity === 'critical' ? 'border-red-300 bg-red-50 dark:bg-red-950/20' : issue.severity === 'warning' ? 'border-yellow-300 bg-yellow-50 dark:bg-yellow-950/20' : 'border-blue-300 bg-blue-50 dark:bg-blue-950/20'}`}>
                    <div className="font-medium">{issue.category} — <Badge variant={issue.severity === 'critical' ? 'destructive' : issue.severity === 'warning' ? 'outline' : 'secondary'}>{issue.severity}</Badge></div>
                    <div className="text-muted-foreground mt-1">{issue.description}</div>
                    <div className="mt-1 text-xs italic">Recommendation: {issue.recommendation}</div>
                  </div>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Est. Cycle Time</span><div className="font-bold">{result.estimatedCycleTime}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Tooling Cost</span><div className="font-bold">{result.estimatedToolCost}</div></div>
            </div>
            <div className="max-h-40 overflow-y-auto">
              <p className="text-sm font-medium mb-2">Process Compatibility:</p>
              <div className="space-y-1">
                {result.processCompatibility.map((p: any, i: number) => (
                  <div key={i} className="flex justify-between text-xs p-2 bg-muted/50 rounded">
                    <span className="font-medium">{p.process.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</span>
                    <Badge variant={p.compatibility === 'excellent' ? 'default' : p.compatibility === 'good' ? 'secondary' : p.compatibility === 'fair' ? 'outline' : 'destructive'}>{p.compatibility}</Badge>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// MANUFACTURING ADVISOR
// =============================================
function ManufacturingAdvisor() {
  const [input, setInput] = useState({ partType: 'shaft', material: 'AISI 4140', annualVolume: '1000', complexity: 'moderate', maxBudget: '50', requiredTolerance: '±0.05mm', surfaceFinish: 'Ra 1.6', partWeight: '3', leadTimeWeeks: '6' });
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'manufacturing', input: { ...input, annualVolume: parseInt(input.annualVolume), maxBudget: parseFloat(input.maxBudget), partWeight: parseFloat(input.partWeight), leadTimeWeeks: parseInt(input.leadTimeWeeks) } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };
  const s = (key: string, value: string) => setInput(prev => ({ ...prev, [key]: value }));

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <Card>
        <CardHeader><CardTitle className="text-lg">Manufacturing Requirements</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div><Label>Part Type</Label><Input value={input.partType} onChange={e => s('partType', e.target.value)} /></div>
            <div><Label>Material</Label><Input value={input.material} onChange={e => s('material', e.target.value)} /></div>
            <div><Label>Annual Volume</Label><Input type="number" value={input.annualVolume} onChange={e => s('annualVolume', e.target.value)} /></div>
            <div><Label>Complexity</Label>
              <Select value={input.complexity} onValueChange={v => s('complexity', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="simple">Simple</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="complex">Complex</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div><Label>Max Budget ($/part)</Label><Input type="number" value={input.maxBudget} onChange={e => s('maxBudget', e.target.value)} /></div>
            <div><Label>Part Weight (kg)</Label><Input type="number" step="0.1" value={input.partWeight} onChange={e => s('partWeight', e.target.value)} /></div>
            <div><Label>Tolerance</Label><Input value={input.requiredTolerance} onChange={e => s('requiredTolerance', e.target.value)} /></div>
            <div><Label>Lead Time (weeks)</Label><Input type="number" value={input.leadTimeWeeks} onChange={e => s('leadTimeWeeks', e.target.value)} /></div>
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Analyzing...</> : <><Wrench className="mr-2 h-4 w-4" /> Get Recommendation</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Manufacturing Recommendation</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Primary Process</p>
                  <p className="text-xl font-bold">{result.primaryProcess.name}</p>
                </div>
                <div className="text-right">
                  <Badge variant="default" className="text-lg px-3">{result.primaryProcess.confidence}%</Badge>
                  <p className="text-xs text-muted-foreground mt-1">confidence</p>
                </div>
              </div>
              <p className="text-sm mt-2">{result.primaryProcess.reason}</p>
              <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                <div className="bg-muted rounded p-2 text-center"><span className="text-muted-foreground">Cost/Part</span><div className="font-bold">{result.primaryProcess.estimatedCostPerPart}</div></div>
                <div className="bg-muted rounded p-2 text-center"><span className="text-muted-foreground">Tooling</span><div className="font-bold">{result.primaryProcess.toolingCost}</div></div>
                <div className="bg-muted rounded p-2 text-center"><span className="text-muted-foreground">Lead Time</span><div className="font-bold">{result.primaryProcess.leadTime}</div></div>
              </div>
            </div>
            {result.alternatives && result.alternatives.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium">Alternative Processes:</p>
                {result.alternatives.map((alt: any, i: number) => (
                  <div key={i} className="p-3 bg-muted/50 rounded-lg text-sm">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">{alt.name}</span>
                      <Badge variant="outline">{alt.confidence}%</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{alt.reason}</p>
                    <div className="flex gap-4 mt-2 text-xs">
                      <span className="text-green-600">✓ {alt.pros[0]}</span>
                      <span className="text-red-500">✗ {alt.cons[0]}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// BOM & COST ESTIMATOR
// =============================================
function BOMEstimator() {
  const [items, setItems] = useState([
    { partName: 'Main Shaft', material: 'AISI 4140', quantity: 1, unitWeight: 2.5, materialCostPerKg: 4.0, machiningCostPerPart: 45, surfaceFinishCost: 5, heatTreatmentCost: 15, custom: true },
    { partName: 'Ball Bearing 6207', material: 'Chrome Steel', quantity: 2, unitWeight: 0.3, materialCostPerKg: 0, machiningCostPerPart: 0, surfaceFinishCost: 0, heatTreatmentCost: 0, custom: false, unitCost: 13 },
  ]);
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const addItem = () => setItems([...items, { partName: '', material: '', quantity: 1, unitWeight: 0, materialCostPerKg: 0, machiningCostPerPart: 0, surfaceFinishCost: 0, heatTreatmentCost: 0, custom: true }]);
  const updateItem = (idx: number, key: string, value: any) => {
    const updated = [...items];
    (updated as any)[idx][key] = value;
    setItems(updated);
  };
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));

  const calculate = async () => {
    setLoading(true);
    try {
      const data = await fetchJSON('/api/engineering', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tool: 'bom', input: { items } }),
      });
      setResult(data.result);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div><CardTitle className="text-lg">Bill of Materials</CardTitle><CardDescription>Add parts to calculate total cost</CardDescription></div>
            <Button variant="outline" size="sm" onClick={addItem}><span className="mr-1">+</span> Add Part</Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-8 gap-2 text-xs p-2 bg-muted/30 rounded-lg">
                <Input placeholder="Part Name" value={item.partName} onChange={e => updateItem(idx, 'partName', e.target.value)} className="h-8 text-xs" />
                <Input placeholder="Material" value={item.material} onChange={e => updateItem(idx, 'material', e.target.value)} className="h-8 text-xs" />
                <Input type="number" placeholder="Qty" value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} className="h-8 text-xs" />
                <Input type="number" placeholder="Wt(kg)" value={item.unitWeight} onChange={e => updateItem(idx, 'unitWeight', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                <Input type="number" placeholder="$/kg" value={item.materialCostPerKg} onChange={e => updateItem(idx, 'materialCostPerKg', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                <Input type="number" placeholder="Mach $" value={item.machiningCostPerPart} onChange={e => updateItem(idx, 'machiningCostPerPart', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                <Input type="number" placeholder="Finish $" value={item.surfaceFinishCost} onChange={e => updateItem(idx, 'surfaceFinishCost', parseFloat(e.target.value) || 0)} className="h-8 text-xs" />
                <Button variant="ghost" size="sm" onClick={() => removeItem(idx)} className="h-8 text-xs text-red-500">✕</Button>
              </div>
            ))}
          </div>
          <Button onClick={calculate} disabled={loading} className="w-full mt-4">
            {loading ? <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Calculating...</> : <><Calculator className="mr-2 h-4 w-4" /> Calculate BOM Cost</>}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Cost Summary</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Material</span><div className="font-bold">${result.subtotalMaterial.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Machining</span><div className="font-bold">${result.subtotalMachining.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Tooling</span><div className="font-bold">${result.toolingCost.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Inspection</span><div className="font-bold">${result.inspectionCost.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Overhead ({result.overheadPercent}%)</span><div className="font-bold">${result.overheadCost.toFixed(2)}</div></div>
              <div className="p-3 bg-muted rounded-lg"><span className="text-muted-foreground">Profit ({result.profitMarginPercent}%)</span><div className="font-bold">${result.profitCost.toFixed(2)}</div></div>
              <div className="p-3 bg-primary text-primary-foreground rounded-lg col-span-2"><span className="opacity-80">Grand Total</span><div className="font-bold text-2xl">${result.grandTotal.toFixed(2)}</div></div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// AI 3D MODEL GENERATOR (with image generation)
// =============================================
function AI3DModelGenerator() {
  const [descriptionInput, setDescriptionInput] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [modelingPlan, setModelingPlan] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingText, setLoadingText] = useState('');
  const [error, setError] = useState('');

  const generate = async () => {
    if (!descriptionInput.trim()) return;
    setLoading(true);
    setError('');
    setImage(null);
    setModelingPlan('');
    setLoadingText('Generating 3D visualization...');

    try {
      const data = await fetchJSON('/api/ai/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionInput }),
      }, 180000); // 3 min timeout

      if (data.error) {
        setError(data.error);
      } else {
        if (data.image) setImage(data.image);
        if (data.modelingPlan) setModelingPlan(data.modelingPlan);
      }
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Request timed out. Please try again.' : e.message;
      setError('Error: ' + msg);
    }

    setLoading(false);
    setLoadingText('');
  };

  const downloadImage = () => {
    if (!image) return;
    const link = document.createElement('a');
    link.href = `data:image/png;base64,${image}`;
    link.download = `3d-model-${Date.now()}.png`;
    link.click();
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      {/* Input Panel - Left Side */}
      <div className="lg:col-span-2 space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2"><Box className="h-5 w-5" /> 3D Model Generator</CardTitle>
            <CardDescription>Describe a mechanical part and get an AI-generated 3D visualization plus SolidWorks modeling plan</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Describe the part you want to visualize</Label>
              <Textarea
                placeholder="e.g., A spur gear with 40 teeth, module 2, 20 degree pressure angle, face width 25mm, made of AISI 4340 steel with a keyed bore of 30mm diameter"
                value={descriptionInput}
                onChange={e => setDescriptionInput(e.target.value)}
                rows={5}
                className="mt-1"
              />
            </div>
            <div className="space-y-2 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <p className="font-medium text-foreground">Try these examples:</p>
              <button className="block w-full text-left hover:text-foreground transition-colors" onClick={() => setDescriptionInput('A stepped shaft with 3 diameters: 50mm section for 80mm length, 35mm section for 60mm length with a keyway, and 25mm section for 40mm length with threads. Include chamfers and a retaining ring groove.')}>Stepped shaft with keyway and threads</button>
              <button className="block w-full text-left hover:text-foreground transition-colors" onClick={() => setDescriptionInput('A flange coupling with 6 bolt holes on a 120mm PCD, for connecting a 40mm shaft. Include a spigot and recess for alignment, with 4mm thick flange plate.')}>Flange coupling with bolt holes</button>
              <button className="block w-full text-left hover:text-foreground transition-colors" onClick={() => setDescriptionInput('A centrifugal pump impeller with 6 backward-curved blades, 200mm outer diameter, 80mm inlet diameter, 30mm width. Include a keyed hub of 25mm bore.')}>Centrifugal pump impeller</button>
              <button className="block w-full text-left hover:text-foreground transition-colors" onClick={() => setDescriptionInput('A robotic arm bracket made of aluminum, with mounting holes pattern, ribbed structure for stiffness, and a cable routing channel.')}>Robotic arm bracket</button>
            </div>
            <Button onClick={generate} disabled={loading || !descriptionInput.trim()} className="w-full" size="lg">
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> {loadingText}</>
              ) : (
                <><Zap className="mr-2 h-4 w-4" /> Generate 3D Model</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Result Panel - Right Side */}
      <div className="lg:col-span-3 space-y-4">
        {/* 3D Image Display */}
        {(loading || image || error) && (
          <Card className="overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  {loading ? 'Generating Visualization...' : error ? 'Error' : '3D Visualization'}
                </CardTitle>
                {image && (
                  <Button variant="outline" size="sm" onClick={downloadImage}>
                    <Download className="mr-2 h-3 w-3" /> Download PNG
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {loading && (
                <div className="flex flex-col items-center justify-center py-16 bg-muted/30 rounded-lg border-2 border-dashed border-muted">
                  <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />
                  <p className="text-sm text-muted-foreground">Rendering your 3D model visualization...</p>
                  <p className="text-xs text-muted-foreground mt-1">This may take 10-30 seconds</p>
                </div>
              )}
              {error && (
                <div className="p-6 bg-red-50 dark:bg-red-950/20 rounded-lg border border-red-200">
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}
              {image && !loading && (
                <div className="relative group rounded-lg overflow-hidden bg-muted">
                  <img
                    src={`data:image/png;base64,${image}`}
                    alt="AI Generated 3D CAD Visualization"
                    className="w-full h-auto rounded-lg shadow-lg"
                  />
                  <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Badge variant="secondary" className="bg-black/60 text-white">AI Generated</Badge>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Modeling Plan */}
        {modelingPlan && !loading && (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5" /> SolidWorks Modeling Plan
                </CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigator.clipboard.writeText(modelingPlan)}>
                  <Copy className="mr-2 h-3 w-3" /> Copy
                </Button>
              </div>
            </CardHeader>
            <CardContent className="max-h-96 overflow-y-auto">
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{modelingPlan}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty state */}
        {!loading && !image && !error && !modelingPlan && (
          <Card>
            <CardContent className="py-16 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center mb-4">
                <Box className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-lg font-medium text-muted-foreground">No 3D Model Generated Yet</p>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm">Describe a mechanical part on the left panel and click &quot;Generate 3D Model&quot; to see a CAD-style visualization here.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

// =============================================
// AI SOLIDWORKS TOOLS (VBA, Python, Spec)
// =============================================
function AISolidWorksTool({ type, title, description, placeholder }: { type: string; title: string; description: string; placeholder: string }) {
  const [descriptionInput, setDescriptionInput] = useState('');
  const [parameters, setParameters] = useState('');
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!descriptionInput.trim()) return;
    setLoading(true);
    setResult('');
    try {
      const data = await fetchJSON('/api/ai/solidworks', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, description: descriptionInput, parameters: parameters || '{}' }),
      }, 180000); // 3 min timeout
      if (data.content) setResult(data.content);
      else if (data.error) setResult('Error: ' + data.error);
    } catch (e: any) {
      const msg = e.name === 'AbortError' ? 'Request timed out. The AI model took too long. Please try again.' : e.message;
      setResult('Error: ' + msg);
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Describe what you want to design</Label>
            <Textarea
              placeholder={placeholder}
              value={descriptionInput}
              onChange={e => setDescriptionInput(e.target.value)}
              rows={3}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Parameters (JSON, optional)</Label>
            <Textarea
              placeholder='{"power": 20, "rpm": 1500, "shaft_diameter": 35}'
              value={parameters}
              onChange={e => setParameters(e.target.value)}
              rows={2}
              className="mt-1 font-mono text-xs"
            />
          </div>
          <Button onClick={generate} disabled={loading || !descriptionInput.trim()} className="w-full">
            {loading ? (
              <><RotateCcw className="mr-2 h-4 w-4 animate-spin" /> Generating with AI...</>
            ) : (
              <><Zap className="mr-2 h-4 w-4" /> Generate {type === 'modeling-plan' ? 'Modeling Plan' : type === 'vba-macro' ? 'VBA Macro' : type === 'python-script' ? 'Python Script' : 'Design Spec'}</>
            )}
          </Button>
        </CardContent>
      </Card>
      {result && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Generated Output</CardTitle>
              <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="mr-2 h-3 w-3" /> Copy</Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-[600px] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <ReactMarkdown
                components={{
                  code(props: any) {
                    const { children, className, ...rest } = props;
                    const match = /language-(\w+)/.exec(className || '');
                    return match ? (
                      <SyntaxHighlighter style={vscDarkPlus} language={match[1]} PreTag="div" customStyle={{ fontSize: '0.75rem', borderRadius: '0.5rem' }}>
                        {String(children).replace(/\n$/, '')}
                      </SyntaxHighlighter>
                    ) : (
                      <code className={className} {...rest}>{children}</code>
                    );
                  },
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =============================================
// MAIN PAGE
// =============================================
export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('shaft');

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Header */}
      <header className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:py-12">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
              <Cog className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">MechDesign Pro</h1>
              <p className="text-gray-400 text-sm sm:text-base">All-in-One Mechanical Engineering Design Hub</p>
            </div>
          </div>
          <p className="text-gray-300 text-sm sm:text-base max-w-2xl">
            Shaft design, gear design, stress analysis, fatigue life, bearing selection, SolidWorks automation,
            BOM & cost estimation, and DFM analysis — all in one place.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            {['Shaft Design', 'Gear Design', 'Stress Analysis', 'Fatigue Life', 'Bearing Selection', 'DFM', 'BOM & Cost', '3D Model AI'].map(tag => (
              <Badge key={tag} variant="secondary" className="bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer">{tag}</Badge>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto px-4 py-6 w-full">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <div className="mb-6 overflow-x-auto">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="shaft" className="text-xs"><Cog className="mr-1 h-3 w-3" />Shaft Design</TabsTrigger>
              <TabsTrigger value="gear" className="text-xs"><Settings className="mr-1 h-3 w-3" />Gear Design</TabsTrigger>
              <TabsTrigger value="stress" className="text-xs"><Gauge className="mr-1 h-3 w-3" />Stress Analysis</TabsTrigger>
              <TabsTrigger value="fatigue" className="text-xs"><Zap className="mr-1 h-3 w-3" />Fatigue Life</TabsTrigger>
              <TabsTrigger value="bearing" className="text-xs"><Cog className="mr-1 h-3 w-3" />Bearing</TabsTrigger>
              <TabsTrigger value="dfm" className="text-xs"><Shield className="mr-1 h-3 w-3" />DFM</TabsTrigger>
              <TabsTrigger value="manufacturing" className="text-xs"><Wrench className="mr-1 h-3 w-3" />Manufacturing</TabsTrigger>
              <TabsTrigger value="bom" className="text-xs"><FileText className="mr-1 h-3 w-3" />BOM & Cost</TabsTrigger>
              <TabsTrigger value="ai-modeling" className="text-xs"><Box className="mr-1 h-3 w-3" />3D Model</TabsTrigger>
              <TabsTrigger value="ai-vba" className="text-xs"><Cpu className="mr-1 h-3 w-3" />AI VBA</TabsTrigger>
              <TabsTrigger value="ai-python" className="text-xs"><Cpu className="mr-1 h-3 w-3" />AI Python</TabsTrigger>
              <TabsTrigger value="ai-spec" className="text-xs"><Cpu className="mr-1 h-3 w-3" />AI Spec</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="shaft"><ShaftCalculator /></TabsContent>
          <TabsContent value="gear"><GearCalculator /></TabsContent>
          <TabsContent value="stress"><StressCalculator /></TabsContent>
          <TabsContent value="fatigue"><FatigueCalculator /></TabsContent>
          <TabsContent value="bearing"><BearingCalculator /></TabsContent>
          <TabsContent value="dfm"><DFMAnalyzer /></TabsContent>
          <TabsContent value="manufacturing"><ManufacturingAdvisor /></TabsContent>
          <TabsContent value="bom"><BOMEstimator /></TabsContent>
          <TabsContent value="ai-modeling">
            <AI3DModelGenerator />
          </TabsContent>
          <TabsContent value="ai-vba">
            <AISolidWorksTool type="vba-macro" title="AI SolidWorks VBA Macro" description="Generate SolidWorks API VBA macro code using AI" placeholder="e.g., Create a parametric shaft with stepped diameters: 30mm for 50mm length, 25mm for 40mm length, with chamfers and a keyway" />
          </TabsContent>
          <TabsContent value="ai-python">
            <AISolidWorksTool type="python-script" title="AI SolidWorks Python Script" description="Generate Python automation scripts for SolidWorks using AI" placeholder="e.g., Automate creation of a flange coupling with 6 bolt holes for a 30mm shaft, including bolt circle and keyway" />
          </TabsContent>
          <TabsContent value="ai-spec">
            <AISolidWorksTool type="design-spec" title="AI Complete Design Specification" description="Generate comprehensive mechanical design specs including calculations, BOM, GD&T, and manufacturing recommendations" placeholder="e.g., Design a centrifugal pump impeller for 500 LPM flow rate, 10m head, 1450 RPM, handling water at 60°C" />
          </TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t py-4">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-muted-foreground">
          <span>MechDesign Pro — Mechanical Engineering Design Hub</span>
          <span>Standards: ISO 286 | ISO 281 | AGMA 2001 | ASME B1.1</span>
        </div>
      </footer>
    </div>
  );
}

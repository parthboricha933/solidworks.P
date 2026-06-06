'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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

async function fetchJSON(url, options, timeoutMs = 30000) {
  const maxRetries = 2;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const res = await fetch(url, { ...options, signal: controller.signal });
      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await res.text().catch(() => '');
        if (attempt < maxRetries && [502, 503, 504].includes(res.status)) {
          await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
          continue;
        }
        throw new Error('Server returned non-JSON response (' + res.status + '). ' + text.slice(0, 120));
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Request failed with status ' + res.status);
      return data;
    } finally { clearTimeout(timer); }
  }
  throw new Error('Server unavailable after retries');
}


export default function StressCalculator() {
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
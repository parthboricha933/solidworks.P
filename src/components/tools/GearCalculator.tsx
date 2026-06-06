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


export default function GearCalculator() {
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
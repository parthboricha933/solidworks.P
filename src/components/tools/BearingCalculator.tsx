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


export default function BearingCalculator() {
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
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


export default function ShaftCalculator() {
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

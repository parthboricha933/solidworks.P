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


export default function FatigueCalculator() {
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
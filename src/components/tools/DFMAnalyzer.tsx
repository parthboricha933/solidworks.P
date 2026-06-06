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


export default function DFMAnalyzer() {
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

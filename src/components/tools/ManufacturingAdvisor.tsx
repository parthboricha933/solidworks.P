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


export default function ManufacturingAdvisor() {
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

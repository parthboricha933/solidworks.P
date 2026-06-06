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


export default function BOMEstimator() {
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

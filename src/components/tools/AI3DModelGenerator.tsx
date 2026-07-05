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


export default function AI3DModelGenerator() {
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
      const res = await fetchJSON('/api/ai/generate-3d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: descriptionInput }),
      }, 120000); // 2 min timeout for image generation

      if (res.error) {
        setError(res.error);
      } else {
        if (res.image) setImage(res.image);
        if (res.modelingPlan) setModelingPlan(res.modelingPlan);
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
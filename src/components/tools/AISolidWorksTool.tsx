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


export default function AISolidWorksTool({ type, title, description, placeholder }: { type: string; title: string; description: string; placeholder: string }) {
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
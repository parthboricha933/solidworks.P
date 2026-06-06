'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  Cog, Calculator, Wrench, Cpu, FileText, Settings, Gauge,
  Zap, Shield, Box, Eye
} from 'lucide-react';

type ToolTab = 'shaft' | 'gear' | 'stress' | 'fatigue' | 'bearing' | 'dfm' | 'manufacturing' | 'bom' | 'ai-modeling' | 'ai-vba' | 'ai-python' | 'ai-spec';

// Lazy-load each tool component — prevents 10s+ compile freeze on a 1193-line monolith
const ShaftCalculator = dynamic(() => import('@/components/tools/ShaftCalculator'), { ssr: false });
const GearCalculator = dynamic(() => import('@/components/tools/GearCalculator'), { ssr: false });
const StressCalculator = dynamic(() => import('@/components/tools/StressCalculator'), { ssr: false });
const FatigueCalculator = dynamic(() => import('@/components/tools/FatigueCalculator'), { ssr: false });
const BearingCalculator = dynamic(() => import('@/components/tools/BearingCalculator'), { ssr: false });
const DFMAnalyzer = dynamic(() => import('@/components/tools/DFMAnalyzer'), { ssr: false });
const ManufacturingAdvisor = dynamic(() => import('@/components/tools/ManufacturingAdvisor'), { ssr: false });
const BOMEstimator = dynamic(() => import('@/components/tools/BOMEstimator'), { ssr: false });
const AI3DModelGenerator = dynamic(() => import('@/components/tools/AI3DModelGenerator'), { ssr: false });
const AISolidWorksTool = dynamic(() => import('@/components/tools/AISolidWorksTool'), { ssr: false });

// Shared loading placeholder for lazy components
function ToolLoading() {
  return (
    <Card>
      <CardContent className="py-16 flex flex-col items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-4" />
        <p className="text-sm text-muted-foreground">Loading tool...</p>
      </CardContent>
    </Card>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<ToolTab>('shaft');

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
              <Cog className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight">MechDesign Pro</h1>
              <p className="text-xs text-blue-200">Mechanical Engineering Design & Analysis Suite</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ToolTab)} className="w-full">
          <TabsList className="grid grid-cols-6 lg:grid-cols-12 w-full h-auto gap-1 p-1 mb-6 flex-wrap">
            <TabsTrigger value="shaft" className="text-xs"><Calculator className="mr-1 h-3 w-3" />Shaft</TabsTrigger>
            <TabsTrigger value="gear" className="text-xs"><Cog className="mr-1 h-3 w-3" />Gear</TabsTrigger>
            <TabsTrigger value="stress" className="text-xs"><Gauge className="mr-1 h-3 w-3" />Stress</TabsTrigger>
            <TabsTrigger value="fatigue" className="text-xs"><Wrench className="mr-1 h-3 w-3" />Fatigue</TabsTrigger>
            <TabsTrigger value="bearing" className="text-xs"><Settings className="mr-1 h-3 w-3" />Bearing</TabsTrigger>
            <TabsTrigger value="dfm" className="text-xs"><Shield className="mr-1 h-3 w-3" />DFM</TabsTrigger>
            <TabsTrigger value="manufacturing" className="text-xs"><Cpu className="mr-1 h-3 w-3" />Mfg</TabsTrigger>
            <TabsTrigger value="bom" className="text-xs"><FileText className="mr-1 h-3 w-3" />BOM</TabsTrigger>
            <TabsTrigger value="ai-modeling" className="text-xs"><Box className="mr-1 h-3 w-3" />3D Model</TabsTrigger>
            <TabsTrigger value="ai-vba" className="text-xs"><Zap className="mr-1 h-3 w-3" />AI VBA</TabsTrigger>
            <TabsTrigger value="ai-python" className="text-xs"><Zap className="mr-1 h-3 w-3" />AI Py</TabsTrigger>
            <TabsTrigger value="ai-spec" className="text-xs"><Zap className="mr-1 h-3 w-3" />AI Spec</TabsTrigger>
          </TabsList>

          {/* Engineering Tools */}
          <TabsContent value="shaft"><ShaftCalculator /></TabsContent>
          <TabsContent value="gear"><GearCalculator /></TabsContent>
          <TabsContent value="stress"><StressCalculator /></TabsContent>
          <TabsContent value="fatigue"><FatigueCalculator /></TabsContent>
          <TabsContent value="bearing"><BearingCalculator /></TabsContent>
          <TabsContent value="dfm"><DFMAnalyzer /></TabsContent>
          <TabsContent value="manufacturing"><ManufacturingAdvisor /></TabsContent>
          <TabsContent value="bom"><BOMEstimator /></TabsContent>

          {/* AI Tools */}
          <TabsContent value="ai-modeling"><AI3DModelGenerator /></TabsContent>
          <TabsContent value="ai-vba">
            <AISolidWorksTool type="vba-macro" title="AI VBA Macro Generator" description="Generate SolidWorks VBA macros using AI" placeholder="e.g., Create a parametric spur gear with customizable number of teeth, module, and pressure angle" />
          </TabsContent>
          <TabsContent value="ai-python">
            <AISolidWorksTool type="python-script" title="AI Python Script Generator" description="Generate SolidWorks Python automation scripts using AI" placeholder="e.g., Automate shaft design with multiple diameters, keyways, and fillets" />
          </TabsContent>
          <TabsContent value="ai-spec">
            <AISolidWorksTool type="design-spec" title="AI Design Specification Generator" description="Generate comprehensive mechanical design specifications using AI" placeholder="e.g., Design a gearbox housing for a 5kW motor with 10:1 reduction ratio" />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

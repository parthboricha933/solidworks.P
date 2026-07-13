import ZAI from 'z-ai-web-dev-sdk';

let _zai: InstanceType<typeof ZAI> | null = null;

export async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (_zai) return _zai;

  // Priority 1: Environment variable (works on Vercel)
  const configStr = process.env.ZAI_CONFIG;
  if (configStr) {
    try {
      const config = JSON.parse(configStr);
      if (config.baseUrl && config.apiKey) {
        _zai = new ZAI(config);
        return _zai;
      }
    } catch (e) {
      console.error('Failed to parse ZAI_CONFIG env var:', e);
    }
  }

  // Priority 2: File-based config (local dev only)
  try {
    _zai = await ZAI.create();
    return _zai;
  } catch (e: any) {
    console.error('ZAI.create() failed (no config file):', e.message);
    throw new Error('AI SDK configuration not found. Ensure ZAI_CONFIG environment variable is set.');
  }
}
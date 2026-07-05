import ZAI from 'z-ai-web-dev-sdk';

let _zai: InstanceType<typeof ZAI> | null = null;

export async function getZAI(): Promise<InstanceType<typeof ZAI>> {
  if (_zai) return _zai;

  const configStr = process.env.ZAI_CONFIG;
  if (configStr) {
    const config = JSON.parse(configStr);
    _zai = new ZAI(config);
    return _zai;
  }

  // Fallback: try file-based config (works in local dev)
  _zai = await ZAI.create();
  return _zai;
}
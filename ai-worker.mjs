#!/usr/bin/env node
/**
 * 3D Model Generation Worker
 * Runs as a detached child process - completely independent from Next.js
 * Usage: node ai-worker.mjs <taskId> <description>
 */
import fs from 'fs/promises';
import path from 'path';
import { execFile } from 'child_process';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

const taskId = process.argv[2];
const description = process.argv[3];
const TASKS_DIR = path.join(process.cwd(), 'download', '.ai-tasks');
const taskFile = path.join(TASKS_DIR, `${taskId}.json`);

async function updateStatus(status, extra = {}) {
  const task = {
    id: taskId,
    description,
    createdAt: Date.now(),
    ...extra,
    status,
  };
  await fs.writeFile(taskFile, JSON.stringify(task)).catch(() => {});
}

async function run() {
  try {
    await updateStatus('generating_image');

    const enhancedPrompt = `Professional 3D CAD rendering: ${description}. Isometric view, gray background, metallic finish, SolidWorks style, studio lighting, no text`;
    const outputDir = path.join(process.cwd(), 'download');
    await fs.mkdir(outputDir, { recursive: true });
    const outputPath = path.join(outputDir, `3d-model-${taskId}.png`);

    let base64Image = null;
    try {
      await execFileAsync('z-ai-generate', [
        '-p', enhancedPrompt, '-o', outputPath, '-s', '1024x1024',
      ], { timeout: 100000 });
      const imageBuffer = await fs.readFile(outputPath);
      base64Image = imageBuffer.toString('base64');
    } catch (err) {
      // Continue without image
    }

    await updateStatus('generating_plan');

    let modelingPlan = '';
    try {
      const ZAI = (await import('z-ai-web-dev-sdk')).default;
      const zai = await ZAI.create();
      const result = await zai.chat.completions.create({
        messages: [
          { role: 'system', content: 'Expert SolidWorks engineer. Write concise step-by-step modeling plan under 80 words.' },
          { role: 'user', content: `Plan for: ${description}` },
        ],
        temperature: 0.3, max_tokens: 200,
      });
      modelingPlan = result?.choices?.[0]?.message?.content || '';
    } catch (err) {
      // Continue without plan
    }

    await updateStatus('completed', {
      completedAt: Date.now(),
      success: true,
      image: base64Image,
      modelingPlan,
    });
  } catch (err) {
    await updateStatus('error', {
      error: err.message || 'Generation failed',
      completedAt: Date.now(),
    });
  }

  process.exit(0);
}

run();

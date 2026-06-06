import { NextRequest } from 'next/server';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

const TASKS_DIR = path.join(process.cwd(), 'download', '.ai-tasks');

async function ensureTasksDir() {
  await fs.mkdir(TASKS_DIR, { recursive: true });
}

// POST: Start 3D generation task (returns immediately)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return Response.json({ error: 'Description is required' }, { status: 400 });
    }

    await ensureTasksDir();
    const taskId = `task-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const taskFile = path.join(TASKS_DIR, `${taskId}.json`);

    // Write initial task status
    await fs.writeFile(taskFile, JSON.stringify({
      id: taskId,
      status: 'pending',
      description,
      createdAt: Date.now(),
    }));

    // Spawn detached worker process (independent from Next.js)
    const workerPath = path.join(process.cwd(), 'ai-worker.mjs');
    const child = spawn('node', [workerPath, taskId, description], {
      detached: true,
      stdio: 'ignore',
      env: { ...process.env },
    });
    child.unref(); // Allow parent to exit without waiting for child

    return Response.json({ success: true, taskId, status: 'pending' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return Response.json({ error: message }, { status: 500 });
  }
}

// GET: Check task status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return Response.json({ error: 'taskId is required' }, { status: 400 });
    }

    const taskFile = path.join(TASKS_DIR, `${taskId}.json`);
    try {
      const data = await fs.readFile(taskFile, 'utf-8');
      return Response.json(JSON.parse(data));
    } catch {
      return Response.json({ error: 'Task not found' }, { status: 404 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Error';
    return Response.json({ error: message }, { status: 500 });
  }
}

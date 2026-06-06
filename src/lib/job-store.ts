// In-memory job store for async AI tasks
type JobStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Job<T = any> {
  id: string;
  status: JobStatus;
  result?: T;
  error?: string;
  createdAt: number;
  completedAt?: number;
}

const jobs = new Map<string, Job>();

export function createJob<T = any>(): Job<T> {
  const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const job: Job<T> = { id, status: 'pending', createdAt: Date.now() };
  jobs.set(id, job);
  return job;
}

export function updateJob<T>(id: string, update: Partial<Job<T>>): Job<T> | undefined {
  const job = jobs.get(id);
  if (!job) return undefined;
  Object.assign(job, update);
  return job;
}

export function getJob<T = any>(id: string): Job<T> | undefined {
  return jobs.get(id) as Job<T> | undefined;
}

// Clean up jobs older than 10 minutes (run periodically)
export function cleanupOldJobs() {
  const now = Date.now();
  const maxAge = 10 * 60 * 1000;
  for (const [id, job] of jobs) {
    if (now - job.createdAt > maxAge) {
      jobs.delete(id);
    }
  }
}

// Auto-cleanup every 2 minutes
if (typeof globalThis !== 'undefined') {
  try { setInterval(cleanupOldJobs, 2 * 60 * 1000); } catch (_) { /* ignore */ }
}

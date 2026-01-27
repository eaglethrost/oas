import { Worker } from 'node:worker_threads';
import { dirname, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

import type { OASDocument } from '../types.js';

import { syncQueries, type SyncQueryName, type SyncQueryResults } from './queries/types.js';
import type { WorkerTask, WorkerResult } from './worker.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Get the worker file path. Workers can only execute JavaScript files,
 * so we need the compiled .js version.
 */
function getWorkerPath(): string | null {
  const jsPath = join(__dirname, 'worker.js');
  return existsSync(jsPath) ? jsPath : null;
}

/**
 * Create a worker thread and run a single query
 * Returns a promise that resolves to the query result
 */
function runInWorker<K extends SyncQueryName>(
  queryName: K,
  definition: OASDocument,
  workerPath: string,
): Promise<SyncQueryResults[K]> {
  return new Promise((resolve, reject) => {
    const task: WorkerTask = { queryName, definition };
    const worker = new Worker(workerPath, { workerData: task });

    worker.on('message', (result: WorkerResult<K>) => {
      if (result.error) {
        reject(new Error(result.error));
      } else {
        resolve(result.result);
      }
      worker.terminate();
    });

    worker.on('error', reject);
    worker.on('exit', code => {
      if (code !== 0) {
        reject(new Error(`Worker stopped with exit code ${code}`));
      }
    });
  });
}

/**
 * Run queries sequentially in the main thread.
 */
function runSequentially<K extends SyncQueryName>(
  queryNames: readonly K[],
  definition: OASDocument,
): Pick<SyncQueryResults, K> {
  const results = {} as Pick<SyncQueryResults, K>;
  for (const name of queryNames) {
    (results as Record<K, SyncQueryResults[K]>)[name] = syncQueries[name](definition) as SyncQueryResults[K];
  }
  return results;
}

export interface ParallelOptions {
  /** Force workers on/off. Default: true (use workers when available) */
  useWorkers?: boolean;
  /** Minimum definition size (in chars) to use workers. Default: 100,000 */
  minSizeForWorkers?: number;
}

/**
 * Run multiple synchronous queries in parallel using worker threads.
 * Falls back to sequential execution for small documents or when workers unavailable.
 */
export async function runQueriesInParallel<K extends SyncQueryName>(
  queryNames: readonly K[],
  definition: OASDocument,
  options?: ParallelOptions,
): Promise<Pick<SyncQueryResults, K>> {
  const { useWorkers = true, minSizeForWorkers = 100_000 } = options ?? {};
  const definitionSize = JSON.stringify(definition).length;
  const workerPath = getWorkerPath();

  // Fall back to sequential for small docs or when worker unavailable
  if (!useWorkers || definitionSize < minSizeForWorkers || !workerPath) {
    return runSequentially(queryNames, definition);
  }

  // Run queries in parallel using worker threads
  const results = await Promise.all(
    queryNames.map(async name => ({
      name,
      result: await runInWorker(name, definition, workerPath),
    })),
  );

  const output = {} as Pick<SyncQueryResults, K>;
  for (const { name, result } of results) {
    output[name] = result as SyncQueryResults[K];
  }
  return output;
}

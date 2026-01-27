/**
 * Worker thread script for running a single query.
 */
import { parentPort, workerData } from 'node:worker_threads';

import type { OASDocument } from '../types.js';

import { syncQueries, type SyncQueryName, type SyncQueryResults } from './queries/types.js';

export interface WorkerTask {
  queryName: SyncQueryName;
  definition: OASDocument;
}

export interface WorkerResult<K extends SyncQueryName = SyncQueryName> {
  queryName: K;
  result: SyncQueryResults[K];
  error?: string;
}

if (parentPort) {
  const task = workerData as WorkerTask;

  try {
    const queryFn = syncQueries[task.queryName];
    const result = queryFn(task.definition);

    parentPort.postMessage({
      queryName: task.queryName,
      result,
    } as WorkerResult);
  } catch (error) {
    parentPort.postMessage({
      queryName: task.queryName,
      result: undefined,
      error: error instanceof Error ? error.message : String(error),
    } as WorkerResult);
  }
}

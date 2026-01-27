import type { OASDocument } from '../../src/types.js';

import petstore from '@readme/oas-examples/3.0/json/petstore.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';

import { runQueries } from '../../src/analyzer/queries/run.js';
import { syncQueries } from '../../src/analyzer/queries/types.js';

describe('runQueriesInParallel', () => {
  it('matches direct sync query results', async () => {
    const definition = petstore as OASDocument;
    const names = ['mediaTypes', 'totalOperations'] as const;

    const expected = {
      mediaTypes: syncQueries.mediaTypes(definition),
      totalOperations: syncQueries.totalOperations(definition),
    };

    const actual = await runQueries(names, definition, { minSizeForWorkers: 0 });

    expect(actual.results).toStrictEqual(expected);
  });

  it('uses sequential execution when workers disabled', async () => {
    const definition = petstore as OASDocument;
    const names = ['mediaTypes'] as const;

    const result = await runQueries(names, definition, { useWorkers: false });

    expect(result.executionMode).toBe('sequential');
    expect(result.results).toStrictEqual({
      mediaTypes: syncQueries.mediaTypes(definition),
    });
  });

  it('uses workers when available', async () => {
    const definition = petstore as OASDocument;
    const names = ['mediaTypes'] as const;

    const result = await runQueries(names, definition, { useWorkers: true, minSizeForWorkers: 0 });

    expect(result.executionMode).toBe('parallel');
    expect(result.results).toStrictEqual({
      mediaTypes: syncQueries.mediaTypes(definition),
    });
  });
});

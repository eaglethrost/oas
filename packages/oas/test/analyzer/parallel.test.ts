import type { OASDocument } from '../../src/types.js';

import petstore from '@readme/oas-examples/3.0/json/petstore.json' with { type: 'json' };
import { describe, expect, it } from 'vitest';

import { runQueriesInParallel } from '../../src/analyzer/parallel.js';
import { syncQueries } from '../../src/analyzer/queries/types.js';

describe('runQueriesInParallel', () => {
  it('matches direct sync query results', async () => {
    const definition = petstore as OASDocument;
    const names = ['mediaTypes', 'totalOperations'] as const;

    const expected = {
      mediaTypes: syncQueries.mediaTypes(definition),
      totalOperations: syncQueries.totalOperations(definition),
    };

    const actual = await runQueriesInParallel(names, definition, { minSizeForWorkers: 0 });

    expect(actual).toStrictEqual(expected);
  });
});

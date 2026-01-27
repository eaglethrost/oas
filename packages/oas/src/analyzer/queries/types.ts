/**
 * Central registry of all synchronous query functions.
 * Types are derived from this object
 */
import type { OASDocument } from '../../types.js';

import {
  additionalProperties,
  callbacks,
  commonParameters,
  discriminators,
  links,
  mediaTypes,
  parameterSerialization,
  polymorphism,
  securityTypes,
  serverVariables,
  totalOperations,
  webhooks,
  xml,
  xmlRequests,
  xmlResponses,
  xmlSchemas,
} from './openapi.js';
import {
  authDefaults,
  codeSampleLanguages,
  codeSamplesDisabled,
  corsProxyDisabled,
  customCodeSamples,
  explorerDisabled,
  rawBody,
  refNames,
  staticHeaders,
} from './readme.js';

/** Query function signature */
type QueryFn<T> = (definition: OASDocument) => T;

/** Registry of all synchronous query functions */
interface SyncQueriesRegistry {
  // OpenAPI queries
  additionalProperties: QueryFn<string[]>;
  callbacks: QueryFn<string[]>;
  commonParameters: QueryFn<string[]>;
  discriminators: QueryFn<string[]>;
  links: QueryFn<string[]>;
  mediaTypes: QueryFn<string[]>;
  parameterSerialization: QueryFn<string[]>;
  polymorphism: QueryFn<string[]>;
  securityTypes: QueryFn<string[]>;
  serverVariables: QueryFn<string[]>;
  totalOperations: QueryFn<number>;
  webhooks: QueryFn<string[]>;
  xml: QueryFn<string[]>;
  xmlRequests: QueryFn<string[]>;
  xmlResponses: QueryFn<string[]>;
  xmlSchemas: QueryFn<string[]>;
  // ReadMe queries
  authDefaults: QueryFn<string[]>;
  codeSampleLanguages: QueryFn<string[]>;
  codeSamplesDisabled: QueryFn<string[]>;
  corsProxyDisabled: QueryFn<string[]>;
  customCodeSamples: QueryFn<string[]>;
  explorerDisabled: QueryFn<string[]>;
  rawBody: QueryFn<string[]>;
  refNames: QueryFn<string[]>;
  staticHeaders: QueryFn<string[]>;
}

/**
 * All synchronous query functions that can be parallelized.
 * Async queries (circularRefs, fileSize) are excludedååå
 */
export const syncQueries: SyncQueriesRegistry = {
  // OpenAPI queries
  additionalProperties,
  callbacks,
  commonParameters,
  discriminators,
  links,
  mediaTypes,
  parameterSerialization,
  polymorphism,
  securityTypes,
  serverVariables,
  totalOperations,
  webhooks,
  xml,
  xmlRequests,
  xmlResponses,
  xmlSchemas,
  // ReadMe queries
  authDefaults,
  codeSampleLanguages,
  codeSamplesDisabled,
  corsProxyDisabled,
  customCodeSamples,
  explorerDisabled,
  rawBody,
  refNames,
  staticHeaders,
};

/** Names of all available synchronous queries */
export type SyncQueryName = keyof SyncQueriesRegistry;

/** Return type for a specific query */
export type QueryReturnType<K extends SyncQueryName> = ReturnType<SyncQueriesRegistry[K]>;

/** Map of query names to their results */
export type SyncQueryResults = {
  [K in SyncQueryName]: QueryReturnType<K>;
};

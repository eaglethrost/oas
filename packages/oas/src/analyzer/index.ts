import type { OASDocument } from '../types.js';
import type { OASAnalysis } from './types.js';

import { circularRefs as queryCircularRefs, fileSize as queryFileSize } from './queries/openapi.js';
import { runQueries } from './queries/run.js';

/** All sync queries to run in parallel */
const SYNC_QUERY_NAMES = [
  'additionalProperties',
  'callbacks',
  'commonParameters',
  'discriminators',
  'links',
  'parameterSerialization',
  'polymorphism',
  'serverVariables',
  'webhooks',
  'xml',
  'xmlSchemas',
  'xmlRequests',
  'xmlResponses',
  'authDefaults',
  'codeSampleLanguages',
  'customCodeSamples',
  'codeSamplesDisabled',
  'corsProxyDisabled',
  'explorerDisabled',
  'staticHeaders',
  'rawBody',
  'refNames',
  'mediaTypes',
  'totalOperations',
  'securityTypes',
] as const;

/**
 * Analyze a given OpenAPI or Swagger definition for any OpenAPI, JSON Schema, and ReadMe-specific
 * feature uses it may contain.
 */
// biome-ignore lint/style/noDefaultExport: This is safe for now.
export default async function analyzer(definition: OASDocument): Promise<OASAnalysis> {
  // Run async queries that require dereferencing
  const [circularRefs, { raw: rawFileSize, dereferenced: dereferencedFileSize }] = await Promise.all([
    queryCircularRefs(definition),
    queryFileSize(definition),
  ]);

  // Run synchronous queries in parallel using worker threads (for large documents)
  // Falls back to sequential execution for small documents to avoid worker overhead
  const { results: queryResults } = await runQueries(SYNC_QUERY_NAMES, definition);

  const analysis: OASAnalysis = {
    general: {
      dereferencedFileSize: {
        name: 'Dereferenced File Size',
        found: dereferencedFileSize,
      },
      mediaTypes: {
        name: 'Media Type',
        found: queryResults.mediaTypes,
      },
      operationTotal: {
        name: 'Operation',
        found: queryResults.totalOperations,
      },
      rawFileSize: {
        name: 'Raw File Size',
        found: rawFileSize,
      },
      securityTypes: {
        name: 'Security Type',
        found: queryResults.securityTypes,
      },
    },
    openapi: {
      additionalProperties: {
        present: !!queryResults.additionalProperties.length,
        locations: queryResults.additionalProperties,
      },
      callbacks: {
        present: !!queryResults.callbacks.length,
        locations: queryResults.callbacks,
      },
      circularRefs: {
        present: !!circularRefs.length,
        locations: circularRefs,
      },
      commonParameters: {
        present: !!queryResults.commonParameters.length,
        locations: queryResults.commonParameters,
      },
      discriminators: {
        present: !!queryResults.discriminators.length,
        locations: queryResults.discriminators,
      },
      links: {
        present: !!queryResults.links.length,
        locations: queryResults.links,
      },
      style: {
        present: !!queryResults.parameterSerialization.length,
        locations: queryResults.parameterSerialization,
      },
      polymorphism: {
        present: !!queryResults.polymorphism.length,
        locations: queryResults.polymorphism,
      },
      serverVariables: {
        present: !!queryResults.serverVariables.length,
        locations: queryResults.serverVariables,
      },
      webhooks: {
        present: !!queryResults.webhooks.length,
        locations: queryResults.webhooks,
      },
      xml: {
        present: !!queryResults.xml.length,
        locations: queryResults.xml,
      },
      xmlSchemas: {
        present: !!queryResults.xmlSchemas.length,
        locations: queryResults.xmlSchemas,
      },
      xmlRequests: {
        present: !!queryResults.xmlRequests.length,
        locations: queryResults.xmlRequests,
      },
      xmlResponses: {
        present: !!queryResults.xmlResponses.length,
        locations: queryResults.xmlResponses,
      },
    },
    readme: {
      'x-default': {
        present: !!queryResults.authDefaults.length,
        locations: queryResults.authDefaults,
      },
      'x-readme.code-samples': {
        present: !!queryResults.customCodeSamples.length,
        locations: queryResults.customCodeSamples,
      },
      'x-readme.headers': {
        present: !!queryResults.staticHeaders.length,
        locations: queryResults.staticHeaders,
      },
      'x-readme.explorer-enabled': {
        present: !!queryResults.explorerDisabled.length,
        locations: queryResults.explorerDisabled,
      },
      'x-readme.proxy-enabled': {
        present: !!queryResults.corsProxyDisabled.length,
        locations: queryResults.corsProxyDisabled,
      },
      'x-readme.samples-languages': {
        present: !!queryResults.codeSampleLanguages.length,
        locations: queryResults.codeSampleLanguages,
      },
      'x-readme-ref-name': {
        present: !!queryResults.refNames.length,
        locations: queryResults.refNames,
      },
    },
  };

  // Only surface deprecated features if they're present
  if (queryResults.codeSamplesDisabled.length) {
    analysis.readme['x-readme.samples-enabled'] = {
      present: true,
      locations: queryResults.codeSamplesDisabled,
    };
  }

  if (queryResults.rawBody.length) {
    analysis.readme.raw_body = {
      present: true,
      locations: queryResults.rawBody,
    };
  }

  return analysis;
}

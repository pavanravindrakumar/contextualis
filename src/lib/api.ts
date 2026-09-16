/**
 * api.ts — Client-side API caller
 *
 * Thin wrapper around fetch('/api/analyze').
 * Never exposes the API key — the key lives only on the server.
 */

import type { AnalysisResult } from './schema';

export interface AnalyzeRequest {
  pdfBase64: string;
  role: string;
  concern: string;
}

export interface AnalyzeResponse {
  analysis: AnalysisResult;
  mock: boolean;
  latencyMs: number;
  requestId: string;
}

export class ApiError extends Error {
  statusCode?: number;
  requestId?: string;

  constructor(
    message: string,
    statusCode?: number,
    requestId?: string,
  ) {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.requestId = requestId;
  }
}

/**
 * Send a PDF (as base64) with role/concern context to the analysis endpoint.
 * Returns validated AnalysisResult or throws ApiError.
 */
export async function analyzeDocument(
  request: AnalyzeRequest,
): Promise<AnalyzeResponse> {
  const response = await fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new ApiError('Server returned non-JSON response', response.status);
  }

  if (!response.ok) {
    const errorBody = body as { error?: string };
    throw new ApiError(
      errorBody?.error ?? 'Analysis failed',
      response.status,
    );
  }

  return body as AnalyzeResponse;
}

/**
 * Convert a File object to a base64 string suitable for the API request.
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the data URL prefix (data:application/pdf;base64,)
      const base64 = result.split(',')[1];
      if (!base64) {
        reject(new Error('Failed to convert file to base64'));
        return;
      }
      resolve(base64);
    };
    reader.onerror = () => reject(new Error('FileReader failed'));
    reader.readAsDataURL(file);
  });
}

import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest';
import { GoogleGenAI } from '@google/genai';
import handler, { setGeminiClientForTesting } from '../api/analyze';

vi.mock('@google/genai', () => {
  return {
    GoogleGenAI: vi.fn().mockImplementation(function (this: any) {
      return {
        interactions: {
          create: vi.fn().mockResolvedValue({ output_text: '{"document_type":"Test", "contextual_summary":"Test", "key_facts":[], "obligations":[], "attention_items":[]}' })
        }
      };
    })
  };
});

describe('api/analyze.ts — Production Config', () => {
  beforeEach(() => {
    process.env.GEMINI_API_KEY = 'test-fake-key-for-testing';
    process.env.USE_MOCK_GEMINI = 'false';
  });

  afterEach(() => {
    setGeminiClientForTesting(null);
    delete process.env.GEMINI_API_KEY;
    delete process.env.USE_MOCK_GEMINI;
    vi.clearAllMocks();
  });

  it('instantiates GoogleGenAI with disabled automatic SDK retries (fail-fast for 429s)', async () => {
    const VALID_PDF_B64 = Buffer.from('%PDF-1.4\n1 0 obj\n<<>>\nendobj\ntrailer\n<<>>\n%%EOF').toString('base64');
    const req = { method: 'POST', body: { pdfBase64: VALID_PDF_B64, role: 'Tenant', concern: 'Financial Exposure' } } as any;
    const res = { status: () => res, json: () => res, setHeader: () => res, end: () => {} } as any;

    await handler(req, res);

    expect(GoogleGenAI).toHaveBeenCalled();
    const callArgs = vi.mocked(GoogleGenAI).mock.calls[0][0];

    expect(callArgs!.httpOptions).toBeDefined();
    expect(callArgs!.httpOptions?.retryOptions?.attempts).toBe(1);
  });
});

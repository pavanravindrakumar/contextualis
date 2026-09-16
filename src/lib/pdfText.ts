/**
 * pdfText.ts
 *
 * PDF.js-based text extraction, normalization, and reverse index construction.
 *
 * This is Pipeline B (client-side only).
 * This file NEVER sends data to a server.
 *
 * Exports:
 * - extractDocumentIndex(pdf): builds DocumentIndex from a PDF.js PDFDocumentProxy
 * - isLikelyScanned(pageItems, pageViewport): heuristic for scanned pages
 * - buildReverseIndex(pages): constructs the char→TextItem mapping
 * - SCANNED_CHAR_DENSITY_THRESHOLD: configurable threshold for scanned page detection
 */

import type { PDFDocumentProxy } from 'pdfjs-dist';
import { normalize } from './evidenceMatcher';
import type { DocumentIndex, TextItem } from './evidenceMatcher';

// Local type for PDF.js text items (avoids the TextItem/TextMarkedContent union complexity)
interface PdfJsTextItem {
  str: string;
  transform: number[];
  width?: number;
  height?: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * If a page has fewer than this many characters per unit of visible area,
 * we treat it as a scanned page (no reliable text layer).
 * Tune this value based on real PDF testing.
 */
export const SCANNED_CHAR_DENSITY_THRESHOLD = 0.05;

/**
 * A line that appears in the top/bottom of more than this fraction of pages
 * is treated as a running header/footer and excluded from matching text.
 * (Matches ADR-0004 config)
 */
export const HEADER_FOOTER_PAGE_THRESHOLD = 0.5;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PageExtractionResult {
  pageIndex: number;
  items: TextItem[];
  /** Raw normalized text for this page */
  normalizedText: string;
  /** Whether this page appears to be scanned (no useful text layer) */
  isScanned: boolean;
}

// ---------------------------------------------------------------------------
// Scanned page detection
// ---------------------------------------------------------------------------

/**
 * Determine if a page is likely scanned (no usable text layer).
 *
 * Heuristic: if total extracted characters divided by the page area is below
 * the threshold, the page is likely scanned or image-only.
 */
export function isLikelyScanned(
  items: PdfJsTextItem[],
  pageWidth: number,
  pageHeight: number,
): boolean {
  const totalChars = items.reduce((sum, item) => sum + (item.str?.length ?? 0), 0);
  const area = pageWidth * pageHeight;
  if (area === 0) return true;
  const density = totalChars / area;
  return density < SCANNED_CHAR_DENSITY_THRESHOLD;
}

// ---------------------------------------------------------------------------
// Header/footer detection
// ---------------------------------------------------------------------------

/**
 * Detect running headers and footers.
 *
 * A "line" that appears verbatim (normalized) in the top or bottom band of
 * more than HEADER_FOOTER_PAGE_THRESHOLD of pages is treated as boilerplate
 * and excluded from the searchable text index.
 *
 * Returns a Set of normalized line strings to exclude.
 */
export function detectHeaderFooterLines(
  pages: PageExtractionResult[],
): Set<string> {
  const totalPages = pages.length;
  if (totalPages === 0) return new Set();

  // Collect lines from the top 15% and bottom 15% of each page by y-position
  const lineCounts = new Map<string, number>();

  for (const page of pages) {
    if (page.isScanned) continue;

    // Group items by approximate y-position (quantized to nearest 5 units)
    const byY = new Map<number, string[]>();
    for (const item of page.items) {
      const yBucket = Math.round(item.bbox[1] / 5) * 5;
      if (!byY.has(yBucket)) byY.set(yBucket, []);
      byY.get(yBucket)!.push(item.text);
    }

    if (byY.size === 0) continue;

    const ys = [...byY.keys()].sort((a, b) => a - b);
    const topBand = ys.slice(0, Math.ceil(ys.length * 0.15));
    const bottomBand = ys.slice(Math.floor(ys.length * 0.85));

    for (const yBucket of [...topBand, ...bottomBand]) {
      const lineText = normalize((byY.get(yBucket) ?? []).join(' '));
      if (lineText.length > 2) {
        lineCounts.set(lineText, (lineCounts.get(lineText) ?? 0) + 1);
      }
    }
  }

  const excluded = new Set<string>();
  for (const [line, count] of lineCounts) {
    if (count / totalPages > HEADER_FOOTER_PAGE_THRESHOLD) {
      excluded.add(line.toLowerCase());
    }
  }

  return excluded;
}

// ---------------------------------------------------------------------------
// Single-page extraction
// ---------------------------------------------------------------------------

/**
 * Extract text items from a single PDF.js page.
 * Returns both the raw items and a determination of whether the page is scanned.
 */
async function extractPage(
  pdf: PDFDocumentProxy,
  pageIndex: number,
): Promise<PageExtractionResult> {
  const page = await pdf.getPage(pageIndex + 1); // PDF.js is 1-indexed
  const viewport = page.getViewport({ scale: 1 });
  const textContent = await page.getTextContent();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawItems = (textContent.items as any[]).filter(
    (item): item is PdfJsTextItem => typeof item === 'object' && item !== null && 'str' in item,
  );

  const scanned = isLikelyScanned(
    rawItems,
    viewport.width,
    viewport.height,
  );

  // Convert to our TextItem format
  const items: TextItem[] = rawItems
    .filter((item) => item.str.trim().length > 0)
    .map((item) => {
      // PDF.js transform: [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const transform = item.transform;
      const x = transform[4];
      const y = transform[5];
      const w = item.width ?? 0;
      const h = item.height ?? 10;
      return {
        text: normalize(item.str),
        page: pageIndex,
        bbox: [x, y, w, h] as [number, number, number, number],
      };
    })
    .filter((item) => item.text.length > 0);

  const normalizedText = items.map((i) => i.text).join(' ');

  return { pageIndex, items, normalizedText, isScanned: scanned };
}

// ---------------------------------------------------------------------------
// Reverse index construction
// ---------------------------------------------------------------------------

/**
 * Build the reverse index: for every character in the concatenated
 * normalized document text, which TextItem produced it.
 *
 * This allows us to map a match offset → page + bounding box.
 */
export function buildReverseIndex(
  pages: PageExtractionResult[],
  excludedLines: Set<string>,
): { normalizedText: string; charToItem: TextItem[] } {
  const charToItem: TextItem[] = [];
  let normalizedText = '';

  for (const page of pages) {
    for (const item of page.items) {
      // Skip header/footer lines
      if (excludedLines.has(item.text.toLowerCase())) continue;

      const text = item.text.toLowerCase(); // normalizeForComparison already done in normalize()
      // Add separator space if needed
      if (normalizedText.length > 0 && !normalizedText.endsWith(' ')) {
        normalizedText += ' ';
        charToItem.push(item);
      }
      normalizedText += text;
      for (let i = 0; i < text.length; i++) {
        charToItem.push(item);
      }
    }

    // Page separator (helps prevent cross-page false matches in single-word context)
    if (page.pageIndex < pages.length - 1 && normalizedText.length > 0) {
      normalizedText += ' ';
      charToItem.push({
        text: ' ',
        page: page.pageIndex,
        bbox: [0, 0, 0, 0],
      });
    }
  }

  return { normalizedText, charToItem };
}

// ---------------------------------------------------------------------------
// Main extraction entry point
// ---------------------------------------------------------------------------

/**
 * Extract the complete DocumentIndex from a PDF.js PDFDocumentProxy.
 *
 * Call this once per uploaded PDF. Cache the result — switching contexts
 * never re-parses the PDF.
 *
 * @param pdf - A PDF.js PDFDocumentProxy (already loaded)
 */
export async function extractDocumentIndex(
  pdf: PDFDocumentProxy,
): Promise<DocumentIndex> {
  const pageCount = pdf.numPages;

  // Extract all pages in parallel
  const pagePromises = Array.from({ length: pageCount }, (_, i) =>
    extractPage(pdf, i),
  );
  const pages = await Promise.all(pagePromises);

  // Detect headers/footers
  const excludedLines = detectHeaderFooterLines(pages);

  // Build reverse index
  const { normalizedText, charToItem } = buildReverseIndex(pages, excludedLines);

  // Collect scanned pages
  const scannedPages = new Set<number>(
    pages.filter((p) => p.isScanned).map((p) => p.pageIndex),
  );

  return {
    normalizedText,
    charToItem,
    scannedPages,
    pageCount,
  };
}

// ---------------------------------------------------------------------------
// File validation utilities (used before Gemini call)
// ---------------------------------------------------------------------------

const PDF_MAGIC = '%PDF-';

/**
 * Validate a File object before sending it to the server.
 *
 * Returns { valid: true } or { valid: false, reason: string }.
 * Fail fast — never call Gemini with an invalid file.
 */
export async function validatePdfFile(
  file: File,
  maxSizeMB = 15,
  _maxPages = 200,
): Promise<{ valid: true } | { valid: false; reason: string }> {
  // 1. MIME type check
  if (file.type && file.type !== 'application/pdf') {
    return { valid: false, reason: 'File must be a PDF (got: ' + file.type + ')' };
  }

  // 2. Zero-byte check
  if (file.size === 0) {
    return { valid: false, reason: 'File is empty (0 bytes)' };
  }

  // 3. Size cap
  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      valid: false,
      reason: `File exceeds ${maxSizeMB} MB limit (got ${(file.size / 1024 / 1024).toFixed(1)} MB)`,
    };
  }

  // 4. Magic bytes check (%PDF-)
  const header = await file.slice(0, 5).text();
  if (!header.startsWith(PDF_MAGIC)) {
    return {
      valid: false,
      reason: 'File does not appear to be a valid PDF (missing %PDF- header)',
    };
  }

  return { valid: true };
}

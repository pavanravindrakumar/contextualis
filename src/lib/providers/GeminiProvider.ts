import type { AnalyzeResponse } from '../api';
import type { AIAnalysisProvider } from './AIProvider';
import type { RoleId, ConcernId } from '../domain';
import { roleLabel, concernLabel } from '../domain';
import { analyzeDocument } from '../api';

export class GeminiProvider implements AIAnalysisProvider {
  async analyze(pdfBase64: string, roleId: RoleId, concernId: ConcernId): Promise<AnalyzeResponse> {
    // Convert typed IDs to display labels for the server prompt
    return analyzeDocument({
      pdfBase64,
      role: roleLabel(roleId),
      concern: concernLabel(concernId),
    });
  }
}

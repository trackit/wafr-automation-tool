import { z } from 'zod';

import { tokenObjectsStorage } from '@backend/infrastructure';
import { Finding, ScanningTool } from '@backend/models';
import { tokenAssociateFindingsToBestPracticesUseCase } from '@backend/useCases';
import { inject } from '@shared/di-container';
import { parseJsonArray } from '@shared/utils';

export const AssociateFindingsChunkToBestPracticesInputSchema = z.object({
  assessmentId: z.uuid(),
  organizationDomain: z.string().nonempty(),
  findingsChunkURI: z.string().nonempty(),
});

export type AssociateFindingsChunkToBestPracticesInput = z.infer<
  typeof AssociateFindingsChunkToBestPracticesInputSchema
>;
export type AssociateFindingsChunkToBestPracticesOutput = void;

export class AssociateFindingsChunkToBestPracticesAdapter {
  private readonly useCase = inject(
    tokenAssociateFindingsToBestPracticesUseCase,
  );
  private readonly objectsStorage = inject(tokenObjectsStorage);

  public parseScanningToolFromURI(uri: string): ScanningTool {
    const { key } = this.objectsStorage.parseURI(uri);
    const chunkFileName = key.split('/').pop() || '';
    if (!chunkFileName) {
      throw new Error(`Invalid findings chunk URI: ${uri}`);
    }
    const [chunkFileNameWithoutExtension] = chunkFileName.split('.');
    const [scanningTool] = chunkFileNameWithoutExtension.split('_');
    return z.enum(ScanningTool).parse(scanningTool);
  }

  public async fetchFindingsToAssociate(findingsChunkURI: string): Promise<{
    scanningTool: ScanningTool;
    findings: Finding[];
  }> {
    const scanningTool = this.parseScanningToolFromURI(findingsChunkURI);
    const { key } = this.objectsStorage.parseURI(findingsChunkURI);
    const fetchedFindings = await this.objectsStorage.get(key);
    if (!fetchedFindings) {
      throw new Error(
        `Findings to associate not found for URI: ${findingsChunkURI}`,
      );
    }
    const findings = parseJsonArray(fetchedFindings) as unknown as Finding[];
    return {
      scanningTool,
      findings,
    };
  }

  public async handle(
    event: Record<string, unknown>,
  ): Promise<AssociateFindingsChunkToBestPracticesOutput> {
    const { assessmentId, organizationDomain, findingsChunkURI } =
      AssociateFindingsChunkToBestPracticesInputSchema.parse(event);
    const { scanningTool, findings } =
      await this.fetchFindingsToAssociate(findingsChunkURI);
    await this.useCase.associateFindingsToBestPractices({
      assessmentId,
      organizationDomain,
      scanningTool,
      findings,
    });
  }
}

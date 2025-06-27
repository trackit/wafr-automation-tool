import { z } from 'zod';

import { ScanFinding } from '@backend/models';
import { parseJsonArray } from '@shared/utils';
import { ScanProvider } from './ScanProvider';

const CloudSploitFindingSchema = z.object({
  plugin: z.string(),
  category: z.string(),
  title: z.string(),
  description: z.string(),
  resource: z.string(),
  region: z.string(),
  status: z.enum(['PASS', 'WARN', 'FAIL', 'UNKNOWN']),
  message: z.string(),
});

export class CloudSploitScanProvider extends ScanProvider {
  static getScanKey(assessmentId: string): string {
    return `assessments/${assessmentId}/scans/cloudsploit/output.json`;
  }

  private mapCloudSploitFindings(
    findings: z.infer<typeof CloudSploitFindingSchema>[]
  ): Omit<ScanFinding, 'id'>[] {
    return findings.map((finding) => ({
      resources: [
        {
          region: finding.region,
          ...(finding.resource !== 'N/A' && { uid: finding.resource }),
        },
      ],
      statusCode: finding.status,
      statusDetail: finding.message,
      riskDetails: finding.description,
    }));
  }

  protected override async fetchFindings(): Promise<Omit<ScanFinding, 'id'>[]> {
    const scanOutput = await this.objectsStorage.get(
      CloudSploitScanProvider.getScanKey(this.assessmentId)
    );
    if (!scanOutput) {
      return [];
    }
    const jsonOutput = parseJsonArray(scanOutput);
    const parsedFindings = CloudSploitFindingSchema.array().parse(jsonOutput);
    const cloudSploitFindingsFilteredByRegion = parsedFindings.filter(
      (finding) =>
        this.regions.length === 0 || this.regions.includes(finding.region)
    );
    const cloudSploitFindingsFilteredByFailedStatus =
      cloudSploitFindingsFilteredByRegion.filter(
        (finding) => finding.status === 'FAIL'
      );
    return this.mapCloudSploitFindings(
      cloudSploitFindingsFilteredByFailedStatus
    );
  }
}

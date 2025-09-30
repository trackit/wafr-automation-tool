import { z } from 'zod';

import { ScanFinding, SeverityType } from '@backend/models';
import { parseJsonArray } from '@shared/utils';

import { ScanProvider } from './ScanProvider';

const ProwlerFindingSchema = z.object({
  resources: z
    .array(
      z.object({
        name: z.string().optional(),
        uid: z.string().optional(),
        type: z.string().optional(),
        region: z.string().optional(),
      })
    )
    .optional(),
  remediation: z
    .object({
      desc: z.string(),
      references: z.array(z.string()).optional(),
    })
    .optional(),
  risk_details: z.string().optional(),
  metadata: z.object({
    event_code: z.string().optional(),
  }),
  severity: z.enum(SeverityType).optional(),
  status_code: z.string().optional(),
  status_detail: z.string().optional(),
});

export class ProwlerScanProvider extends ScanProvider {
  static getScanKey(assessmentId: string): string {
    return `assessments/${assessmentId}/scans/prowler/json-ocsf/output.ocsf.json`;
  }

  protected override async fetchFindings(): Promise<Omit<ScanFinding, 'id'>[]> {
    const scanOutput = await this.objectsStorage.get(
      ProwlerScanProvider.getScanKey(this.assessmentId)
    );
    if (!scanOutput) {
      return [];
    }
    const jsonOutput = parseJsonArray(scanOutput);
    const parsedFindings = ProwlerFindingSchema.array().parse(jsonOutput);
    return parsedFindings.map((prowlerFinding) => ({
      resources:
        prowlerFinding.resources?.map((resource) => ({
          name: resource.name,
          uid: resource.uid,
          type: resource.type,
          region: resource.region,
        })) ?? [],
      ...(prowlerFinding.remediation && {
        remediation: {
          desc: prowlerFinding.remediation?.desc,
          references: prowlerFinding.remediation?.references,
        },
      }),
      riskDetails: prowlerFinding.risk_details,
      metadata: {
        ...(prowlerFinding.metadata.event_code && {
          eventCode: prowlerFinding.metadata.event_code,
        }),
      },
      severity: prowlerFinding.severity ?? SeverityType.Unknown,
      statusCode: prowlerFinding.status_code,
      statusDetail: prowlerFinding.status_detail,
    }));
  }
}

import { z } from 'zod';

import { tokenLogger } from '@backend/infrastructure';
import { ScanFinding, SeverityType } from '@backend/models';
import { inject } from '@shared/di-container';
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
      }),
    )
    .optional(),
  remediation: z
    .object({
      desc: z.string(),
      references: z.array(z.string()).optional(),
    })
    .optional(),
  risk_details: z.string().optional(),
  event_code: z.string().optional(),
  severity: z.enum(SeverityType).optional(),
  status_code: z.string().optional(),
  status_detail: z.string().optional(),
});

type ProwlerFinding = z.infer<typeof ProwlerFindingSchema>;

export class ProwlerScanProvider extends ScanProvider {
  static getScanKey(assessmentId: string): string {
    return `assessments/${assessmentId}/scans/prowler/json-ocsf/output.ocsf.json`;
  }
  private readonly logger = inject(tokenLogger);

  protected override async fetchFindings(): Promise<Omit<ScanFinding, 'id'>[]> {
    const scanOutput = await this.objectsStorage.get(
      ProwlerScanProvider.getScanKey(this.assessmentId),
    );
    if (!scanOutput) {
      return [];
    }
    const jsonOutput = parseJsonArray(scanOutput);
    const parsedFindings = ProwlerFindingSchema.array().parse(jsonOutput);
    const invalidFindings: ProwlerFinding[] = [];
    const validFindings = parsedFindings.filter(
      (
        prowlerFinding,
      ): prowlerFinding is ProwlerFinding & {
        risk_details: string;
        status_code: string;
        status_detail: string;
      } => {
        const hasRequiredFields =
          prowlerFinding.risk_details !== undefined &&
          prowlerFinding.status_code !== undefined &&
          prowlerFinding.status_detail !== undefined;
        if (!hasRequiredFields) {
          invalidFindings.push(prowlerFinding);
        }
        return hasRequiredFields;
      },
    );

    if (invalidFindings.length > 0) {
      this.logger.warn('Dropping Prowler findings missing required fields', {
        assessmentId: this.assessmentId,
        invalidFindingsCount: invalidFindings.length,
        invalidFindings: invalidFindings,
      });
    }
    return validFindings.map((prowlerFinding) => ({
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
          references: prowlerFinding.remediation?.references ?? [],
        },
      }),
      riskDetails: prowlerFinding.risk_details,
      ...(prowlerFinding.event_code && {
        eventCode: prowlerFinding.event_code,
      }),
      severity: prowlerFinding.severity ?? SeverityType.Unknown,
      statusCode: prowlerFinding.status_code,
      statusDetail: prowlerFinding.status_detail,
    }));
  }
}

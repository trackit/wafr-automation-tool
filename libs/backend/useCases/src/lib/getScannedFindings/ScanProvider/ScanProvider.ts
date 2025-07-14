import { tokenObjectsStorage } from '@backend/infrastructure';
import { ScanFinding } from '@backend/models';
import { inject } from '@shared/di-container';

const SELF_MADE_SIGNATURE = 'wafr-automation-tool';

export class ScanProvider {
  protected objectsStorage = inject(tokenObjectsStorage);

  constructor(
    protected readonly assessmentId: string,
    protected readonly workflows: string[],
    protected readonly regions: string[],
    protected readonly scanningTool: string
  ) {}

  protected async fetchFindings(): Promise<Omit<ScanFinding, 'id'>[]> {
    throw new Error('Method not implemented.');
  }

  private mapFindingsWithoutNonWorkflowsResources(
    findings: ScanFinding[]
  ): ScanFinding[] {
    if (this.workflows.length === 0) {
      return findings;
    }

    return findings.map((finding) => {
      if (!finding.resources) {
        return finding;
      }

      const filteredResources = finding.resources.filter(
        (resource) =>
          this.workflows.some((workflow) =>
            resource.name?.toLowerCase()?.includes(workflow)
          ) ||
          this.workflows.some((workflow) =>
            resource.uid?.toLowerCase()?.includes(workflow)
          )
      );
      return {
        ...finding,
        resources: filteredResources,
      };
    });
  }

  private isFindingMatchingWorkflows(
    finding: Omit<ScanFinding, 'id'>
  ): boolean {
    if (this.workflows.length === 0) {
      return true;
    }

    return (
      finding.resources?.some(
        (resource) =>
          this.workflows.some((workflow) =>
            resource.name?.toLowerCase()?.includes(workflow)
          ) ||
          this.workflows.some((workflow) =>
            resource.uid?.toLowerCase()?.includes(workflow)
          )
      ) ||
      this.workflows.some((workflow) =>
        finding.riskDetails?.toLowerCase()?.includes(workflow)
      ) ||
      this.workflows.some((workflow) =>
        finding.statusDetail?.toLowerCase()?.includes(workflow)
      )
    );
  }

  private isSelfMadeFinding(finding: Omit<ScanFinding, 'id'>): boolean {
    return (
      !!finding.resources?.some(
        (resource) =>
          resource.name?.toLowerCase()?.includes(SELF_MADE_SIGNATURE) ||
          resource.uid?.toLowerCase()?.includes(SELF_MADE_SIGNATURE)
      ) ||
      !!finding.riskDetails?.toLowerCase()?.includes(SELF_MADE_SIGNATURE) ||
      !!finding.statusDetail?.toLowerCase()?.includes(SELF_MADE_SIGNATURE)
    );
  }

  private mergeFindingsByStatusAndRiskDetails(
    findings: ScanFinding[]
  ): ScanFinding[] {
    const findingsByStatusAndRiskDetails = new Map<string, ScanFinding>();
    for (const finding of findings) {
      const key = `${finding.statusDetail}-${finding.riskDetails}`;
      const existingFinding = findingsByStatusAndRiskDetails.get(key);
      if (existingFinding) {
        if (!existingFinding.resources) {
          existingFinding.resources = finding.resources;
        } else {
          existingFinding.resources.concat(finding.resources || []);
        }
      } else {
        findingsByStatusAndRiskDetails.set(key, finding);
      }
    }
    return Array.from(findingsByStatusAndRiskDetails.values());
  }

  async getScannedFindings(): Promise<ScanFinding[]> {
    const findings = await this.fetchFindings();
    const filteredFindings = findings.filter(
      (finding) =>
        this.isFindingMatchingWorkflows(finding) &&
        !this.isSelfMadeFinding(finding)
    );
    const identifiedFindings = filteredFindings.map((finding, index) => ({
      ...finding,
      id: `${this.scanningTool}#${index + 1}`,
    }));
    const findingsWithoutNonWorkflowsResources =
      this.mapFindingsWithoutNonWorkflowsResources(identifiedFindings);
    return this.mergeFindingsByStatusAndRiskDetails(
      findingsWithoutNonWorkflowsResources
    );
  }
}

import type { Pillar, ScanFinding } from '@backend/models';

export class MapScanFindingsToBestPracticesUseCaseArgsMother {
  private data: {
    scanFindings: ScanFinding[];
    pillars: Pillar[];
  };

  constructor(data: { scanFindings: ScanFinding[]; pillars: Pillar[] }) {
    this.data = data;
  }

  public static basic(): MapScanFindingsToBestPracticesUseCaseArgsMother {
    return new MapScanFindingsToBestPracticesUseCaseArgsMother({
      scanFindings: [],
      pillars: [],
    });
  }

  public withScanFindings(
    scanFindings: ScanFinding[],
  ): MapScanFindingsToBestPracticesUseCaseArgsMother {
    this.data.scanFindings = scanFindings;
    return this;
  }

  public withPillars(
    pillars: Pillar[],
  ): MapScanFindingsToBestPracticesUseCaseArgsMother {
    this.data.pillars = pillars;
    return this;
  }

  public build(): { scanFindings: ScanFinding[]; pillars: Pillar[] } {
    return this.data;
  }
}

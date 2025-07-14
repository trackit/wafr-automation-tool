import { ScanFinding } from '@backend/models';
import { ScanProvider } from './ScanProvider';

export class CloudCustodianScanProvider extends ScanProvider {
  protected override async fetchFindings(): Promise<Omit<ScanFinding, 'id'>[]> {
    return [];
  }
}

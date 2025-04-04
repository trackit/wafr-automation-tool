from entities.scanning_tools import ScanningTool

from services.scanning_tools.cloud_custodian import CloudCustodianService
from services.scanning_tools.cloudsploit import CloudSploitService
from services.scanning_tools.prowler import ProwlerService

SCANNING_TOOL_SERVICES = {
    ScanningTool.PROWLER: ProwlerService,
    ScanningTool.CLOUD_CUSTODIAN: CloudCustodianService,
    ScanningTool.CLOUDSPLOIT: CloudSploitService,
}

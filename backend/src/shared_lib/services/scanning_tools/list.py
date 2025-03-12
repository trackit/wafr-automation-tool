from common.entities import ScanningTool

from services.scanning_tools import IScanningToolService
from services.scanning_tools.cloudsploit import CloudSploitService
from services.scanning_tools.prowler import ProwlerService

SCANNING_TOOL_SERVICES: dict[str, type[IScanningToolService]] = {
    ScanningTool.PROWLER: ProwlerService,
    ScanningTool.CLOUDSPLOIT: CloudSploitService,
}

from enum import StrEnum

from pydantic import BaseModel


class ScanningTool(StrEnum):
    _TEST = "test"
    PROWLER = "prowler"
    CLOUD_CUSTODIAN = "cloud-custodian"
    CLOUDSPLOIT = "cloudsploit"


class CloudSploitFinding(BaseModel):
    plugin: str
    category: str
    title: str
    description: str
    resource: str
    region: str
    status: str
    message: str


class CloudCustodianPolicy(StrEnum):
    EC2_STOPPED_INSTANCE = "ec2-stopped-instance"

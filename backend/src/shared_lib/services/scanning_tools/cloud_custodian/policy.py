from abc import ABC, abstractmethod

from entities.finding import FindingExtra, FindingID


class Policy(ABC):
    @abstractmethod
    def parse_finding(self, finding_id: FindingID, finding: dict) -> FindingExtra:
        raise NotImplementedError

    def parse(self, index_offset: int, finding: dict) -> list[FindingExtra]:
        findings: list[FindingExtra] = [
            self.parse_finding(str(i + index_offset), finding) for i, finding in enumerate(finding)
        ]
        return findings

import { Finding, SeverityType } from '@backend/models';
import { StyleSheet, Text } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  title: {
    fontSize: 14,
    marginTop: 20,
  },
  severityCritical: {
    color: '#8B0000',
    fontWeight: '700',
  },
  severityHigh: {
    color: '#D32F2F',
    fontWeight: '700',
  },
  severityMedium: {
    color: '#9C5A00',
    fontWeight: '700',
  },
  severityLow: {
    color: '#00796B',
    fontWeight: '700',
  },
});

function getFindingSeverityStyle(severity: SeverityType) {
  switch (severity) {
    case SeverityType.Critical:
      return styles.severityCritical;
    case SeverityType.High:
      return styles.severityHigh;
    case SeverityType.Medium:
      return styles.severityMedium;
    case SeverityType.Low:
    case SeverityType.Informational:
      return styles.severityLow;
    default:
      return styles.severityCritical;
  }
}

export function FindingTitle({
  finding,
}: {
  finding: Finding;
}): React.ReactElement {
  const severityStyle = getFindingSeverityStyle(finding.severity!);
  return (
    <Text style={styles.title}>
      <Text style={severityStyle}>[{finding.severity?.toString()}]</Text>{' '}
      {finding.riskDetails?.replace('\n', ' ')}
    </Text>
  );
}

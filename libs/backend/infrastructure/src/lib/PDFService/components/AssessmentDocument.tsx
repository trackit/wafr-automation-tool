import { Finding } from '@backend/models';
import { Document, DocumentProps, StyleSheet } from '@react-pdf/renderer';
import React from 'react';

import { CoverPage } from './CoverPage';
import { FindingsPage } from './FindingsPage';

type AssessmentDocumentProps = {
  assessmentName: string;
  versionName: string;
  findings: Finding[];
};

const styles = StyleSheet.create({
  document: {
    fontFamily: 'Inter',
  },
});

export function AssessmentDocument({
  assessmentName,
  versionName,
  findings,
}: AssessmentDocumentProps): React.ReactElement<DocumentProps> {
  return (
    <Document
      title={`Well Architected Review Program: ${assessmentName}`}
      style={styles.document}
    >
      <CoverPage assessmentName={assessmentName} versionName={versionName} />
      <FindingsPage assessmentName={assessmentName} findings={findings} />
    </Document>
  );
}

import { Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  page: {
    padding: 60,
    position: 'relative',
  },
  titleContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleLine: {
    fontSize: 32,
    textAlign: 'center',
    lineHeight: 1.7,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 60,
    left: 60,
    fontSize: 12,
    lineHeight: 1.5,
  },
});

interface CoverPageProps {
  assessmentName: string;
  versionName: string;
}

export function CoverPage({
  assessmentName,
  versionName,
}: CoverPageProps): React.ReactElement {
  const date = new Date();
  return (
    <Page size="RA4" style={styles.page}>
      <View style={styles.titleContainer}>
        <Text style={styles.titleLine}>Well Architected Review</Text>
        <Text style={styles.titleLine}>Program:</Text>
        <Text style={styles.titleLine}>{assessmentName}</Text>
      </View>
      <View style={styles.footerContainer}>
        <Text>
          {date.toLocaleDateString('en', { month: 'long', year: 'numeric' })}
        </Text>
        <Text>Report Version {versionName}</Text>
      </View>
    </Page>
  );
}

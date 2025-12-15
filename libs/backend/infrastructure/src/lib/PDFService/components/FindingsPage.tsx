import { Image, Page, StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

import { type Finding } from '@backend/models';

import { FindingDetail } from './FindingDetail';

interface FindingsPageProps {
  assessmentName: string;
  findings: Finding[];
}

const PAGE_PADDING = 60;
const ITEM_SPACING = 20;

const styles = StyleSheet.create({
  page: {
    fontSize: 11,
    padding: PAGE_PADDING,
    paddingTop: PAGE_PADDING + ITEM_SPACING,
    position: 'relative',
  },
  headerContainer: {
    position: 'absolute',
    top: ITEM_SPACING,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    fontSize: 10,
    color: '#333',
  },
  headerRightImage: {
    width: 45,
    height: 45,
    objectFit: 'contain',
  },
  title: {
    fontSize: 34,
    color: '#000',
  },
  logo: {
    width: 176,
    height: 48,
    marginTop: 8,
    objectFit: 'contain',
  },
  footerContainer: {
    position: 'absolute',
    bottom: ITEM_SPACING,
    left: PAGE_PADDING,
    right: PAGE_PADDING,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  footerLogo: {
    width: 120,
    height: 40,
    objectFit: 'contain',
  },
  pageNumber: {
    fontSize: 10,
    color: '#222',
  },
});

export function FindingsPage({
  assessmentName,
  findings,
}: FindingsPageProps): React.ReactElement {
  return (
    <Page size="RA4" style={styles.page}>
      <View style={styles.headerContainer} fixed>
        <Text style={styles.headerLeft}>
          Well Architected Review Program: {assessmentName}
        </Text>
        <Image
          src="./assets/AWS-Badge-Advanced-Services.png"
          style={styles.headerRightImage}
        />
      </View>

      <View>
        <Text style={styles.title}>{assessmentName} review</Text>
        <Image src="./assets/TrackItLogo.png" style={styles.logo} />
      </View>

      {findings.map((finding, i) => (
        <FindingDetail key={i} finding={finding} />
      ))}

      <View style={styles.footerContainer} fixed>
        <Image src="./assets/TrackItLogo.png" style={styles.footerLogo} />
        <Text
          style={styles.pageNumber}
          render={({ pageNumber }) => `${pageNumber - 1}`}
        />
      </View>
    </Page>
  );
}

import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

import { type Finding } from '@backend/models';

import { Bullet } from './Bullet';
import { FindingTitle } from './FindingTitle';
import { Reference } from './Reference';

const styles = StyleSheet.create({
  heading: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 10,
  },
  paragraph: {
    marginTop: 6,
    fontSize: 11,
    lineHeight: 1.3,
  },
});

export function FindingDetail({
  finding,
}: {
  finding: Finding;
}): React.ReactElement {
  return (
    <View>
      <FindingTitle finding={finding} />

      <View wrap={false}>
        <Text style={styles.heading}>Issue:</Text>
        <Text style={styles.paragraph}>{finding.statusDetail}</Text>
      </View>

      <View wrap={false}>
        <Text style={styles.heading}>Recommendations:</Text>
        <Text style={styles.paragraph}>{finding.remediation?.desc}</Text>
      </View>

      <Text style={styles.heading}>References:</Text>
      <View style={styles.paragraph}>
        {finding.remediation?.references?.map((reference, i) => (
          <Bullet key={i}>
            <Reference reference={reference} style={styles.paragraph} />
          </Bullet>
        ))}
      </View>
    </View>
  );
}

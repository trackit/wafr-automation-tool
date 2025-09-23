import { StyleSheet, Text, View } from '@react-pdf/renderer';
import React from 'react';

const styles = StyleSheet.create({
  bulletContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 20,
  },
  bullet: {
    width: 12,
    fontSize: 5,
  },
  bulletText: {
    flex: 1,
    fontSize: 11,
  },
});

export function Bullet({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <View style={styles.bulletContainer}>
      <Text style={styles.bullet}>{'\u25CF'}</Text>
      <Text style={styles.bulletText}>{children}</Text>
    </View>
  );
}

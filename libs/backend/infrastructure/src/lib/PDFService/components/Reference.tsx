import { Link, Styles, Text } from '@react-pdf/renderer';
import React from 'react';

export function Reference({
  style,
  reference,
}: {
  reference: string;
  style?: Styles[0];
}): React.ReactElement {
  if (reference.startsWith('http://') || reference.startsWith('https://')) {
    return (
      <Link href={reference} style={style}>
        {reference}
      </Link>
    );
  }
  return <Text style={style}>{reference}</Text>;
}

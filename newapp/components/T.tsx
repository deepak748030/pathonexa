// App-wide Text with the brand font. Maps fontWeight to the matching
// Plus Jakarta Sans family so native + web render identical weights.
import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { fontForWeight } from '../src/theme';

export function T({ style, children, ...rest }: TextProps) {
  const flat = StyleSheet.flatten(style as any) || {};
  const family = flat.fontFamily ?? fontForWeight(flat.fontWeight);
  return (
    <Text style={[{ fontFamily: family }, style as any]} {...rest}>
      {children}
    </Text>
  );
}

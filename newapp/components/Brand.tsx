import React from 'react';
import { Image, type ImageStyle, type StyleProp } from 'react-native';
import { R } from '../src/theme';

const iconSource = require('../assets/icon.png');
const logoSource = require('../assets/logo.png');

type BrandIconProps = {
  size?: number;
  circular?: boolean;
  style?: StyleProp<ImageStyle>;
};

export function BrandIcon({ size = 48, circular = false, style }: BrandIconProps) {
  return (
    <Image
      accessibilityLabel="PathoNexa app icon"
      source={iconSource}
      resizeMode="contain"
      style={[
        {
          width: size,
          height: size,
          borderRadius: circular ? size / 2 : R.field,
        },
        style,
      ]}
    />
  );
}

export function BrandLogo({ width = 180, style }: { width?: number; style?: StyleProp<ImageStyle> }) {
  return (
    <Image
      accessibilityLabel="PathoNexa logo"
      source={logoSource}
      resizeMode="contain"
      style={[{ width, height: width / 2, borderRadius: R.field }, style]}
    />
  );
}

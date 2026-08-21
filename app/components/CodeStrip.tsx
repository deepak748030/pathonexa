import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Path } from 'react-native-svg';
import { colors, fonts } from '@/lib/theme';
import { barcodeRects, qrMatrix } from '@/lib/qr';

/** Code 128 barcode (sample labels, patient cards, report footer). */
export function Barcode({
  value, width = 180, height = 40, color = colors.foreground, showValue = true,
}: {
  value: string; width?: number; height?: number; color?: string; showValue?: boolean;
}) {
  const { rects } = React.useMemo(() => barcodeRects(value || '0', width), [value, width]);
  return (
    <View style={{ alignItems: 'center' }}>
      <Svg width={width} height={height}>
        {rects.map((r, i) => (
          <Rect key={i} x={r.x} y={0} width={Math.max(r.width, 0.4)} height={height} fill={color} />
        ))}
      </Svg>
      {showValue ? <Text style={styles.caption}>{value}</Text> : null}
    </View>
  );
}

/** QR code rendered from our own encoder — no network, no native module. */
export function QRCode({
  value, size = 84, color = colors.foreground,
}: {
  value: string; size?: number; color?: string;
}) {
  const path = React.useMemo(() => {
    const { size: n, modules } = qrMatrix(value || ' ');
    let d = '';
    for (let r = 0; r < n; r += 1) {
      for (let c = 0; c < n; c += 1) if (modules[r][c]) d += `M${c} ${r}h1v1h-1z`;
    }
    return { d, n };
  }, [value]);

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${path.n} ${path.n}`}>
      <Rect width={path.n} height={path.n} fill="#FFFFFF" />
      <Path d={path.d} fill={color} />
    </Svg>
  );
}

/**
 * Footer strip used on the report preview and the patient card:
 * QR (verification payload) + barcode (scannable id).
 */
export default function CodeStrip({
  qrValue, barcodeValue, caption, compact,
}: {
  qrValue: string; barcodeValue: string; caption?: string; compact?: boolean;
}) {
  return (
    <View style={[styles.wrap, compact && { paddingVertical: 8 }]}>
      <QRCode value={qrValue} size={compact ? 58 : 78} />
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Barcode value={barcodeValue} width={compact ? 130 : 170} height={compact ? 30 : 38} />
      </View>
      {!!caption && <Text style={styles.caption}>{caption}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 12, paddingHorizontal: 12,
  },
  caption: {
    fontFamily: fonts.medium, fontSize: 9.5, color: colors.mutedForeground,
    marginTop: 3, letterSpacing: 0.4,
  },
});

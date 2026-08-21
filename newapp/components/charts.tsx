// SVG charts & report visuals for newapp (hand-built, react-native-svg)
import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Line, Text as SvgText, Defs, LinearGradient, Stop, Rect, G } from 'react-native-svg';
import { C } from '../src/theme';

/* ---------------- line / area chart ---------------- */

export function LineChart({ data }: { data: { d: string; v: number }[] }) {
  const [w, setW] = useState(0);
  const H = 170;
  const padL = 30;
  const padR = 14;
  const padT = 24;
  const padB = 26;
  const maxV = 60;

  const iw = Math.max(w, 260);
  const stepX = (iw - padL - padR) / (data.length - 1);
  const x = (i: number) => padL + i * stepX;
  const y = (v: number) => padT + (1 - v / maxV) * (H - padT - padB);

  const linePath = data.map((p, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(p.v)}`).join(' ');
  const areaPath =
    `M ${x(0)} ${y(data[0].v)} ` +
    data.map((p, i) => `L ${x(i)} ${y(p.v)}`).join(' ') +
    ` L ${x(data.length - 1)} ${H - padB} L ${x(0)} ${H - padB} Z`;

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      {w > 0 && (
        <Svg width={iw} height={H}>
          <Defs>
            <LinearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={C.primary} stopOpacity={0.22} />
              <Stop offset="1" stopColor={C.primary} stopOpacity={0.02} />
            </LinearGradient>
          </Defs>
          {[0, 20, 40, 60].map((t) => (
            <SvgText key={t} x={padL - 8} y={y(t) + 3} fontSize={9} fill={C.faint} textAnchor="end">
              {t}
            </SvgText>
          ))}
          <Path d={areaPath} fill="url(#areaFill)" />
          <Path d={linePath} fill="none" stroke={C.primary} strokeWidth={2} />
          {data.map((p, i) => (
            <G key={p.d}>
              <Circle cx={x(i)} cy={y(p.v)} r={3.5} fill="#fff" stroke={C.primary} strokeWidth={2} />
              <SvgText x={x(i)} y={y(p.v) - 9} fontSize={9.5} fill={p.v === 48 ? C.primary : C.text} fontWeight={p.v === 48 ? '700' : '500'} textAnchor="middle">
                {p.v}
              </SvgText>
              <SvgText x={x(i)} y={H - 8} fontSize={9} fill={C.faint} textAnchor="middle">
                {p.d}
              </SvgText>
            </G>
          ))}
        </Svg>
      )}
    </View>
  );
}

/* ---------------- donut chart ---------------- */

export function DonutChart({
  total,
  segments,
}: {
  total: string;
  segments: { label: string; value: number; color: string }[];
}) {
  const size = 132;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const sum = segments.reduce((a, s) => a + s.value, 0) || 1;
  let acc = 0;

  return (
    <View style={styles.donutWrap}>
      <View>
        <Svg width={size} height={size}>
          <G rotation={-90} origin={`${size / 2}, ${size / 2}`}>
            <Circle cx={size / 2} cy={size / 2} r={r} stroke="#EDF1F7" strokeWidth={stroke} fill="none" />
            {segments.map((s) => {
              const frac = s.value / sum;
              const el = (
                <Circle
                  key={s.label}
                  cx={size / 2}
                  cy={size / 2}
                  r={r}
                  stroke={s.color}
                  strokeWidth={stroke}
                  fill="none"
                  strokeDasharray={`${frac * circ} ${circ}`}
                  strokeDashoffset={-acc * circ}
                />
              );
              acc += frac;
              return el;
            })}
          </G>
        </Svg>
        <View style={styles.donutCenter}>
          <Text style={styles.donutTotal}>{total}</Text>
          <Text style={styles.donutTotalSub}>Total</Text>
        </View>
      </View>
      <View style={styles.donutLegend}>
        {segments.map((s) => (
          <View key={s.label} style={styles.legendRow}>
            <View style={[styles.legendDot, { backgroundColor: s.color }]} />
            <Text style={styles.legendLabel}>{s.label}</Text>
            <Text style={styles.legendValue}>{s.value}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/* ---------------- faux QR ---------------- */

export function QRBox({ size = 64 }: { size?: number }) {
  const n = 21;
  const cell = size / n;
  // deterministic pseudo-random pattern
  const cells: React.ReactNode[] = [];
  let seed = 42;
  const rnd = () => {
    seed = (seed * 1103515245 + 12345) % 2147483648;
    return seed / 2147483648;
  };
  const inFinder = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (inFinder(r, c)) continue;
      if (rnd() > 0.52) cells.push(<Rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111" />);
    }
  }
  const finder = (fx: number, fy: number) => (
    <G key={`${fx}${fy}`}>
      <Rect x={fx} y={fy} width={7 * cell} height={7 * cell} fill="#111" />
      <Rect x={fx + cell} y={fy + cell} width={5 * cell} height={5 * cell} fill="#fff" />
      <Rect x={fx + 2 * cell} y={fy + 2 * cell} width={3 * cell} height={3 * cell} fill="#111" />
    </G>
  );
  return (
    <Svg width={size} height={size}>
      <Rect x={0} y={0} width={size} height={size} fill="#fff" />
      {cells}
      {finder(0, 0)}
      {finder((n - 7) * cell, 0)}
      {finder(0, (n - 7) * cell)}
    </Svg>
  );
}

/* ---------------- signature squiggle ---------------- */

export function Signature({ color = '#233' }: { color?: string }) {
  return (
    <Svg width={90} height={30}>
      <Path
        d="M6 20 C 14 6, 20 26, 28 14 S 42 8, 48 16 S 62 24, 70 12 S 80 10, 86 16"
        fill="none"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

/* ---------------- round stamp ---------------- */

export function Stamp() {
  return (
    <Svg width={86} height={86}>
      <Circle cx={43} cy={43} r={40} fill="none" stroke="#3D55C9" strokeWidth={2} opacity={0.85} />
      <Circle cx={43} cy={43} r={30} fill="none" stroke="#3D55C9" strokeWidth={1} opacity={0.85} />
      <SvgText x={43} y={36} fontSize={7.2} fill="#3D55C9" textAnchor="middle" fontWeight="700">
        PATHONEXA
      </SvgText>
      <SvgText x={43} y={46} fontSize={6.4} fill="#3D55C9" textAnchor="middle" fontWeight="700">
        DIAGNOSTICS
      </SvgText>
      <SvgText x={43} y={56} fontSize={6} fill="#3D55C9" textAnchor="middle">
        LUCKNOW
      </SvgText>
    </Svg>
  );
}

const styles = StyleSheet.create({
  donutWrap: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 },
  donutCenter: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  donutTotal: { fontSize: 22, fontWeight: '800', color: C.text },
  donutTotalSub: { fontSize: 10, color: C.faint },
  donutLegend: { flex: 1, gap: 10 },
  legendRow: { flexDirection: 'row', alignItems: 'center' },
  legendDot: { width: 8, height: 8, borderRadius: 4, marginRight: 8 },
  legendLabel: { fontSize: 12, color: C.sub, flex: 1 },
  legendValue: { fontSize: 12, fontWeight: '700', color: C.text },
});

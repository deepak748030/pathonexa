export type ParamRow = {
  name: string;
  short?: string;
  value: string;
  unit: string;
  range: string;
  flag: '' | 'H' | 'L';
  group: string;
};

function flagFor(value: string, range: string): '' | 'H' | 'L' {
  if (!value) return '';
  const n = parseFloat(value);
  if (Number.isNaN(n)) return '';
  const m = String(range).match(/([\d.]+)\s*[-–]\s*([\d.]+)/);
  if (!m) return '';
  const lo = parseFloat(m[1]);
  const hi = parseFloat(m[2]);
  if (n < lo) return 'L';
  if (n > hi) return 'H';
  return '';
}

export function applyFlags(rows: ParamRow[]): ParamRow[] {
  return rows.map((r) => ({ ...r, flag: flagFor(r.value, r.range) }));
}

const cbc: ParamRow[] = [
  { group: 'White Blood Cell (WBC) Profile', name: 'WBC (Total)', value: '', unit: '10³/µL', range: '4.0 - 10.0', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'Lymphocyte %', value: '', unit: '%', range: '20.0 - 40.0', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'MID %', value: '', unit: '%', range: '1.0 - 15.0', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'Neutrophil %', value: '', unit: '%', range: '50.0 - 70.0', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'Lymphocyte #', value: '', unit: '10³/µL', range: '0.6 - 4.1', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'MID #', value: '', unit: '10³/µL', range: '0.1 - 1.8', flag: '' },
  { group: 'White Blood Cell (WBC) Profile', name: 'Neutrophil #', value: '', unit: '10³/µL', range: '2.0 - 7.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'RBC', value: '', unit: '10⁶/µL', range: '3.50 - 5.50', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'Hemoglobin', value: '', unit: 'g/dL', range: '11.0 - 16.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'Hematocrit (HCT)', value: '', unit: '%', range: '36.0 - 46.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'MCV', value: '', unit: 'fL', range: '80.0 - 99.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'MCH', value: '', unit: 'pg', range: '26.0 - 32.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'MCHC', value: '', unit: 'g/dL', range: '32.0 - 36.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'RDW-SD', value: '', unit: 'fL', range: '37.0 - 54.0', flag: '' },
  { group: 'Red Blood Cell (RBC) Profile', name: 'RDW-CV', value: '', unit: '%', range: '11.5 - 14.5', flag: '' },
  { group: 'Platelet Profile', name: 'Platelet Count', value: '', unit: '10³/µL', range: '150 - 450', flag: '' },
  { group: 'Platelet Profile', name: 'MPV', value: '', unit: 'fL', range: '7.4 - 10.4', flag: '' },
  { group: 'Platelet Profile', name: 'PDW', value: '', unit: '%', range: '10.0 - 17.0', flag: '' },
  { group: 'Platelet Profile', name: 'PCT', value: '', unit: '%', range: '0.10 - 0.28', flag: '' },
  { group: 'Platelet Profile', name: 'P-LCR', value: '', unit: '%', range: '13.0 - 43.0', flag: '' },
];

const lft: ParamRow[] = [
  { group: 'Liver Function', name: 'Bilirubin Total', value: '', unit: 'mg/dL', range: '0.2 - 1.2', flag: '' },
  { group: 'Liver Function', name: 'Bilirubin Direct', value: '', unit: 'mg/dL', range: '0.0 - 0.3', flag: '' },
  { group: 'Liver Function', name: 'SGOT (AST)', value: '', unit: 'U/L', range: '5 - 40', flag: '' },
  { group: 'Liver Function', name: 'SGPT (ALT)', value: '', unit: 'U/L', range: '5 - 41', flag: '' },
  { group: 'Liver Function', name: 'Alkaline Phosphatase', value: '', unit: 'U/L', range: '40 - 129', flag: '' },
  { group: 'Liver Function', name: 'Total Protein', value: '', unit: 'g/dL', range: '6.4 - 8.3', flag: '' },
  { group: 'Liver Function', name: 'Albumin', value: '', unit: 'g/dL', range: '3.5 - 5.2', flag: '' },
];

const kft: ParamRow[] = [
  { group: 'Kidney Function', name: 'Urea', value: '', unit: 'mg/dL', range: '15 - 40', flag: '' },
  { group: 'Kidney Function', name: 'Creatinine', value: '', unit: 'mg/dL', range: '0.6 - 1.3', flag: '' },
  { group: 'Kidney Function', name: 'Uric Acid', value: '', unit: 'mg/dL', range: '3.5 - 7.2', flag: '' },
  { group: 'Kidney Function', name: 'Sodium', value: '', unit: 'mmol/L', range: '136 - 145', flag: '' },
  { group: 'Kidney Function', name: 'Potassium', value: '', unit: 'mmol/L', range: '3.5 - 5.1', flag: '' },
  { group: 'Kidney Function', name: 'Chloride', value: '', unit: 'mmol/L', range: '98 - 107', flag: '' },
];

const thyroid: ParamRow[] = [
  { group: 'Thyroid Profile', name: 'T3', value: '', unit: 'ng/dL', range: '80 - 200', flag: '' },
  { group: 'Thyroid Profile', name: 'T4', value: '', unit: 'µg/dL', range: '5.1 - 14.1', flag: '' },
  { group: 'Thyroid Profile', name: 'TSH', value: '', unit: 'µIU/mL', range: '0.27 - 4.20', flag: '' },
];

const lipid: ParamRow[] = [
  { group: 'Lipid Profile', name: 'Total Cholesterol', value: '', unit: 'mg/dL', range: '0 - 200', flag: '' },
  { group: 'Lipid Profile', name: 'Triglycerides', value: '', unit: 'mg/dL', range: '0 - 150', flag: '' },
  { group: 'Lipid Profile', name: 'HDL Cholesterol', value: '', unit: 'mg/dL', range: '40 - 60', flag: '' },
  { group: 'Lipid Profile', name: 'LDL Cholesterol', value: '', unit: 'mg/dL', range: '0 - 100', flag: '' },
  { group: 'Lipid Profile', name: 'VLDL', value: '', unit: 'mg/dL', range: '5 - 40', flag: '' },
];

const sugar: ParamRow[] = [
  { group: 'Blood Sugar', name: 'Fasting Blood Sugar', value: '', unit: 'mg/dL', range: '70 - 100', flag: '' },
];

const DEMO_CBC: Record<string, string> = {
  'WBC (Total)': '5.7',
  'Lymphocyte %': '30.9',
  'MID %': '10.0',
  'Neutrophil %': '59.1',
  'Lymphocyte #': '1.8',
  'MID #': '0.6',
  'Neutrophil #': '3.3',
  RBC: '3.76',
  Hemoglobin: '15.5',
  'Hematocrit (HCT)': '35.2',
  MCV: '93.7',
  MCH: '41.2',
  MCHC: '44.0',
  'RDW-SD': '46.5',
  'RDW-CV': '12.6',
  'Platelet Count': '64',
  MPV: '12.9',
  PDW: '14.6',
  PCT: '0.05',
  'P-LCR': '60.8',
};

export function paramsForTest(testName: string, withDemo = false): ParamRow[] {
  const n = (testName || '').toLowerCase();
  let rows: ParamRow[] = cbc;
  if (n.includes('lft') || n.includes('liver')) rows = lft;
  else if (n.includes('kft') || n.includes('kidney')) rows = kft;
  else if (n.includes('thyroid')) rows = thyroid;
  else if (n.includes('lipid')) rows = lipid;
  else if (n.includes('sugar') || n.includes('glucose')) rows = sugar;
  else rows = cbc;

  const cloned = rows.map((r) => ({ ...r, value: withDemo && DEMO_CBC[r.name] ? DEMO_CBC[r.name] : r.value }));
  return applyFlags(cloned);
}

export function groupParams(rows: ParamRow[]): { group: string; rows: ParamRow[] }[] {
  const map = new Map<string, ParamRow[]>();
  rows.forEach((r) => {
    const list = map.get(r.group) || [];
    list.push(r);
    map.set(r.group, list);
  });
  return Array.from(map.entries()).map(([group, list]) => ({ group, rows: list }));
}

export function paramSummary(rows: ParamRow[]) {
  const filled = rows.filter((r) => r.value !== '');
  return {
    total: rows.length,
    filled: filled.length,
    normal: filled.filter((r) => !r.flag).length,
    high: filled.filter((r) => r.flag === 'H').length,
    low: filled.filter((r) => r.flag === 'L').length,
    complete: filled.length === rows.length && rows.length > 0,
  };
}

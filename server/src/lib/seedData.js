/**
 * Onboarding defaults — the only data seeded into a new lab account.
 *
 * Business records (patients, reports, doctors, payments, expenses, …) are
 * NEVER pre-filled: the app must open empty and only show the lab's own
 * data. The test master ships as account-owned clinical templates so the
 * report workflow works out of the box.
 *
 * The shapes here mirror the "Pathonexa structure" specification:
 * every test carries the full parameter definition (short name, unit, normal
 * range, critical high/low, gender/child ranges, decimals, print order, bold,
 * highlight) so the app can render and flag values without hard-coded tables.
 */

const cfg = require('../config/appConfig');

/* ------------------------------------------------------------------ */
/* Test master                                                         */
/* ------------------------------------------------------------------ */

const p = (order, name, short, unit, range, extra = {}) => ({
  order,
  name,
  short,
  unit,
  range,
  criticalLow: extra.criticalLow ?? '',
  criticalHigh: extra.criticalHigh ?? '',
  maleRange: extra.maleRange ?? '',
  femaleRange: extra.femaleRange ?? '',
  childRange: extra.childRange ?? '',
  decimals: extra.decimals ?? 1,
  bold: extra.bold ?? false,
  highlight: extra.highlight ?? false,
  group: extra.group || 'Results',
});

const WBC = 'White Blood Cell (WBC) Profile';
const RBC = 'Red Blood Cell (RBC) Profile';
const PLT = 'Platelet Profile';

const tests = [
  {
    id: 't1',
    name: 'Complete Blood Count (CBC)',
    short: 'CBC',
    group: 'Hematology',
    category: 'Hematology',
    department: 'Pathology',
    price: 250,
    template: 'CBC Standard',
    header: 'HEMATOLOGY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'WBC (Total)', 'WBC', '10³/µL', '4.0 - 10.0', { group: WBC, criticalLow: '2.0', criticalHigh: '30.0', childRange: '5.0 - 15.0', bold: true }),
      p(2, 'Lymphocyte %', 'LYM%', '%', '20.0 - 40.0', { group: WBC }),
      p(3, 'MID %', 'MID%', '%', '1.0 - 15.0', { group: WBC }),
      p(4, 'Neutrophil %', 'NEU%', '%', '50.0 - 70.0', { group: WBC }),
      p(5, 'Lymphocyte #', 'LYM#', '10³/µL', '0.6 - 4.1', { group: WBC }),
      p(6, 'MID #', 'MID#', '10³/µL', '0.1 - 1.8', { group: WBC }),
      p(7, 'Neutrophil #', 'NEU#', '10³/µL', '2.0 - 7.0', { group: WBC }),
      p(8, 'RBC', 'RBC', '10⁶/µL', '3.50 - 5.50', { group: RBC, decimals: 2, maleRange: '4.50 - 5.50', femaleRange: '3.80 - 4.80' }),
      p(9, 'Hemoglobin', 'HGB', 'g/dL', '11.0 - 16.0', { group: RBC, criticalLow: '7.0', criticalHigh: '20.0', maleRange: '13.0 - 17.0', femaleRange: '11.5 - 15.5', childRange: '11.0 - 14.0', bold: true, highlight: true }),
      p(10, 'Hematocrit (HCT)', 'HCT', '%', '36.0 - 46.0', { group: RBC, maleRange: '40.0 - 50.0', femaleRange: '36.0 - 46.0' }),
      p(11, 'MCV', 'MCV', 'fL', '80.0 - 99.0', { group: RBC }),
      p(12, 'MCH', 'MCH', 'pg', '26.0 - 32.0', { group: RBC }),
      p(13, 'MCHC', 'MCHC', 'g/dL', '32.0 - 36.0', { group: RBC }),
      p(14, 'RDW-SD', 'RDW-SD', 'fL', '37.0 - 54.0', { group: RBC }),
      p(15, 'RDW-CV', 'RDW-CV', '%', '11.5 - 14.5', { group: RBC }),
      p(16, 'Platelet Count', 'PLT', '10³/µL', '150 - 450', { group: PLT, criticalLow: '50', criticalHigh: '1000', decimals: 0, bold: true, highlight: true }),
      p(17, 'MPV', 'MPV', 'fL', '7.4 - 10.4', { group: PLT }),
      p(18, 'PDW', 'PDW', '%', '10.0 - 17.0', { group: PLT }),
      p(19, 'PCT', 'PCT', '%', '0.10 - 0.28', { group: PLT, decimals: 2 }),
      p(20, 'P-LCR', 'P-LCR', '%', '13.0 - 43.0', { group: PLT }),
    ],
  },
  {
    id: 't2',
    name: 'Liver Function Test (LFT)',
    short: 'LFT',
    group: 'Biochemistry',
    category: 'Biochemistry',
    department: 'Pathology',
    price: 450,
    template: 'LFT Standard',
    header: 'BIOCHEMISTRY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'Bilirubin Total', 'BIL-T', 'mg/dL', '0.2 - 1.2', { group: 'Liver Function', decimals: 2, criticalHigh: '15' }),
      p(2, 'Bilirubin Direct', 'BIL-D', 'mg/dL', '0.0 - 0.3', { group: 'Liver Function', decimals: 2 }),
      p(3, 'SGOT (AST)', 'AST', 'U/L', '5 - 40', { group: 'Liver Function', decimals: 0 }),
      p(4, 'SGPT (ALT)', 'ALT', 'U/L', '5 - 41', { group: 'Liver Function', decimals: 0, bold: true }),
      p(5, 'Alkaline Phosphatase', 'ALP', 'U/L', '40 - 129', { group: 'Liver Function', decimals: 0, childRange: '100 - 320' }),
      p(6, 'Total Protein', 'TP', 'g/dL', '6.4 - 8.3', { group: 'Liver Function', decimals: 1 }),
      p(7, 'Albumin', 'ALB', 'g/dL', '3.5 - 5.2', { group: 'Liver Function', decimals: 1 }),
      p(8, 'Globulin', 'GLB', 'g/dL', '2.0 - 3.5', { group: 'Liver Function', decimals: 1 }),
    ],
  },
  {
    id: 't3',
    name: 'Kidney Function Test (KFT)',
    short: 'KFT',
    group: 'Biochemistry',
    category: 'Biochemistry',
    department: 'Pathology',
    price: 450,
    template: 'KFT Standard',
    header: 'BIOCHEMISTRY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'Urea', 'UREA', 'mg/dL', '15 - 40', { group: 'Kidney Function', decimals: 0, criticalHigh: '150' }),
      p(2, 'Creatinine', 'CREA', 'mg/dL', '0.6 - 1.3', { group: 'Kidney Function', decimals: 2, maleRange: '0.7 - 1.3', femaleRange: '0.6 - 1.1', criticalHigh: '8', bold: true }),
      p(3, 'Uric Acid', 'UA', 'mg/dL', '3.5 - 7.2', { group: 'Kidney Function', maleRange: '3.5 - 7.2', femaleRange: '2.6 - 6.0' }),
      p(4, 'Sodium', 'Na', 'mmol/L', '136 - 145', { group: 'Electrolytes', decimals: 0, criticalLow: '120', criticalHigh: '160' }),
      p(5, 'Potassium', 'K', 'mmol/L', '3.5 - 5.1', { group: 'Electrolytes', decimals: 1, criticalLow: '2.5', criticalHigh: '6.5', highlight: true }),
      p(6, 'Chloride', 'Cl', 'mmol/L', '98 - 107', { group: 'Electrolytes', decimals: 0 }),
    ],
  },
  {
    id: 't4',
    name: 'Thyroid Profile (T3, T4, TSH)',
    short: 'TFT',
    group: 'Immunology',
    category: 'Immunology',
    department: 'Pathology',
    price: 500,
    template: 'Thyroid Standard',
    header: 'IMMUNOASSAY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'T3 (Triiodothyronine)', 'T3', 'ng/dL', '80 - 200', { group: 'Thyroid Profile', decimals: 0 }),
      p(2, 'T4 (Thyroxine)', 'T4', 'µg/dL', '5.1 - 14.1', { group: 'Thyroid Profile' }),
      p(3, 'TSH', 'TSH', 'µIU/mL', '0.27 - 4.20', { group: 'Thyroid Profile', decimals: 2, criticalHigh: '20', bold: true, highlight: true }),
    ],
  },
  {
    id: 't5',
    name: 'Lipid Profile',
    short: 'LIPID',
    group: 'Biochemistry',
    category: 'Biochemistry',
    department: 'Pathology',
    price: 400,
    template: 'Lipid Standard',
    header: 'BIOCHEMISTRY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'Total Cholesterol', 'CHOL', 'mg/dL', '0 - 200', { group: 'Lipid Profile', decimals: 0, criticalHigh: '300', bold: true }),
      p(2, 'Triglycerides', 'TG', 'mg/dL', '0 - 150', { group: 'Lipid Profile', decimals: 0 }),
      p(3, 'HDL Cholesterol', 'HDL', 'mg/dL', '40 - 60', { group: 'Lipid Profile', decimals: 0, maleRange: '40 - 60', femaleRange: '50 - 70' }),
      p(4, 'LDL Cholesterol', 'LDL', 'mg/dL', '0 - 100', { group: 'Lipid Profile', decimals: 0, highlight: true }),
      p(5, 'VLDL', 'VLDL', 'mg/dL', '5 - 40', { group: 'Lipid Profile', decimals: 0 }),
    ],
  },
  {
    id: 't6',
    name: 'Blood Sugar Fasting',
    short: 'FBS',
    group: 'Biochemistry',
    category: 'Biochemistry',
    department: 'Pathology',
    price: 150,
    template: 'Sugar Standard',
    header: 'BIOCHEMISTRY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'Fasting Blood Sugar', 'FBS', 'mg/dL', '70 - 100', { group: 'Blood Sugar', decimals: 0, criticalLow: '50', criticalHigh: '400', bold: true, highlight: true }),
    ],
  },
  {
    id: 't7',
    name: 'HbA1c (Glycated Hemoglobin)',
    short: 'HbA1c',
    group: 'Biochemistry',
    category: 'Diabetology',
    department: 'Pathology',
    price: 550,
    template: 'HbA1c Standard',
    header: 'BIOCHEMISTRY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'HbA1c', 'HbA1c', '%', '4.0 - 5.6', { group: 'Diabetes Profile', decimals: 1, criticalHigh: '10', bold: true }),
      p(2, 'Estimated Average Glucose', 'eAG', 'mg/dL', '70 - 126', { group: 'Diabetes Profile', decimals: 0 }),
    ],
  },
  {
    id: 't8',
    name: 'Urine Routine Examination',
    short: 'URINE-R',
    group: 'Clinical Pathology',
    category: 'Clinical Pathology',
    department: 'Pathology',
    price: 200,
    template: 'Urine Standard',
    header: 'CLINICAL PATHOLOGY REPORT',
    status: 'Active',
    parameters: [
      p(1, 'Colour', 'COL', '', 'Pale Yellow', { group: 'Physical Examination', decimals: 0 }),
      p(2, 'Appearance', 'APP', '', 'Clear', { group: 'Physical Examination', decimals: 0 }),
      p(3, 'pH', 'pH', '', '5.0 - 8.0', { group: 'Chemical Examination' }),
      p(4, 'Specific Gravity', 'SG', '', '1.005 - 1.030', { group: 'Chemical Examination', decimals: 3 }),
      p(5, 'Protein', 'PROT', '', 'Absent', { group: 'Chemical Examination', decimals: 0 }),
      p(6, 'Glucose', 'GLU', '', 'Absent', { group: 'Chemical Examination', decimals: 0 }),
      p(7, 'Pus Cells', 'PUS', '/hpf', '0 - 5', { group: 'Microscopic Examination', decimals: 0 }),
      p(8, 'Epithelial Cells', 'EPI', '/hpf', '0 - 5', { group: 'Microscopic Examination', decimals: 0 }),
      p(9, 'RBCs', 'RBC-U', '/hpf', '0 - 2', { group: 'Microscopic Examination', decimals: 0 }),
    ],
  },
  {
    id: 't9',
    name: 'Vitamin D (25-OH)',
    short: 'VIT-D',
    group: 'Immunology',
    category: 'Immunology',
    department: 'Pathology',
    price: 900,
    template: 'Vitamin Standard',
    header: 'IMMUNOASSAY REPORT',
    status: 'Active',
    parameters: [p(1, 'Vitamin D Total', 'VITD', 'ng/mL', '30 - 100', { group: 'Vitamin Profile', criticalLow: '10', bold: true })],
  },
  {
    id: 't10',
    name: 'Vitamin B12',
    short: 'VIT-B12',
    group: 'Immunology',
    category: 'Immunology',
    department: 'Pathology',
    price: 850,
    template: 'Vitamin Standard',
    header: 'IMMUNOASSAY REPORT',
    status: 'Active',
    parameters: [p(1, 'Vitamin B12', 'B12', 'pg/mL', '211 - 911', { group: 'Vitamin Profile', decimals: 0, bold: true })],
  },
];

/* ------------------------------------------------------------------ */
/* Expenses (spec categories)                                          */
/* ------------------------------------------------------------------ */

const EXPENSE_CATEGORIES = [
  'Electricity', 'Rent', 'Staff Salary', 'Chemical', 'Needle', 'Syringe',
  'Tube', 'Printer Ink', 'Internet', 'Other',
];

/* ------------------------------------------------------------------ */
/* Roles & permissions (spec: permission based access)                 */
/* ------------------------------------------------------------------ */

const PERMISSIONS = [
  'dashboard', 'patients', 'reports', 'reportValues', 'payments', 'expenses',
  'doctors', 'commissions', 'tests', 'staff', 'analytics', 'settings',
  'backup', 'subscription', 'labs',
];

const roles = [
  {
    id: 'r0', name: 'Super Admin', description: 'Manages all labs, subscriptions, templates and platform revenue.',
    permissions: PERMISSIONS,
  },
  {
    id: 'r1', name: 'Lab Owner', description: 'Full access to this lab.',
    permissions: PERMISSIONS.filter((x) => x !== 'labs'),
  },
  {
    id: 'r2', name: 'Manager', description: 'Everything except subscription and backup.',
    permissions: ['dashboard', 'patients', 'reports', 'reportValues', 'payments', 'expenses', 'doctors', 'commissions', 'tests', 'staff', 'analytics'],
  },
  {
    id: 'r3', name: 'Receptionist', description: 'Patient registration, payment entry and receipt print.',
    permissions: ['dashboard', 'patients', 'reports', 'payments'],
  },
  {
    id: 'r4', name: 'Technician', description: 'Fill report values, edit report, generate PDF.',
    permissions: ['dashboard', 'reports', 'reportValues'],
  },
];

/* ------------------------------------------------------------------ */
/* Subscription plans                                                  */
/* ------------------------------------------------------------------ */

// Plan pricing/durations come from `.env` (TRIAL_DAYS, MONTHLY_PLAN_PRICE, …)
// via appConfig, so the business can reprice without a code change.
const plans = [
  { id: 'trial', name: `${cfg.trialDays} Day Free Trial`, days: cfg.trialDays, price: 0, features: ['All modules', '1 lab', 'Email support'] },
  { id: 'monthly', name: 'Monthly Plan', days: cfg.monthlyPlanDays, price: cfg.monthlyPlanPrice, features: ['Unlimited reports', 'Cloud backup', 'WhatsApp share', 'Priority support'] },
  { id: 'yearly', name: 'Yearly Plan', days: cfg.yearlyPlanDays, price: cfg.yearlyPlanPrice, features: ['Everything in Monthly', '2 months free', 'Multi-user roles', 'Dedicated manager'] },
];


module.exports = {
  tests, roles, plans, EXPENSE_CATEGORIES, PERMISSIONS,
};

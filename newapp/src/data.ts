// Mock data — values transcribed 1:1 from "pathonexa App UI Demo" PDF screens.

export type Tone = 'blue' | 'green' | 'orange' | 'purple' | 'pink' | 'red';

export const lab = {
  name: 'PathoNexa Diagnostics Pvt. Ltd.',
  brand: 'PathoNexa',
  city: 'Lucknow, Uttar Pradesh',
  labId: 'LAB123456',
  address: '123, Health City, Medical Road,',
  address2: 'Lucknow – 226010 (UP)',
  phone: 'Ph: 0522-1234567',
  email: 'Email: info@pathonexa.com',
  tagline: 'Accurate Today. Healthy Tomorrow.',
};

export const user = { name: 'Amit Mishra', role: 'Lab Admin', initials: 'AM' };
export const greeting = { title: 'Good Morning, Ravi 👋', sub: 'Shri Radhe Pathology Lab' };

export interface Stat {
  icon: string;
  tone: Tone;
  label: string;
  value: string;
  foot: string;
}

export const dashStats: Stat[] = [
  { icon: 'clipboard-text-outline', tone: 'blue', label: "Today's Reports", value: '48', foot: 'Total Reports' },
  { icon: 'currency-rupee', tone: 'green', label: "Today's Revenue", value: '₹18,650', foot: 'Total Collection' },
  { icon: 'timer-sand', tone: 'orange', label: 'Pending Reports', value: '12', foot: 'Yet to Complete' },
  { icon: 'wallet-outline', tone: 'purple', label: 'Pending Amount', value: '₹7,340', foot: 'From 15 Patients' },
  { icon: 'doctor', tone: 'blue', label: 'Doctor Commission', value: '₹5,280', foot: 'Pending Payout' },
  { icon: 'receipt-text-outline', tone: 'pink', label: "Today's Expense", value: '₹2,140', foot: 'Total Expense' },
];

export const quickActions: { icon: string; label: string }[] = [
  { icon: 'account-plus-outline', label: 'New Patient' },
  { icon: 'flask-outline', label: 'New Report' },
  { icon: 'wallet-outline', label: 'Payment' },
  { icon: 'doctor', label: 'Add Doctor' },
  { icon: 'view-grid-outline', label: 'More' },
];

export const weekSeries = [
  { d: '21 Jul', v: 25 },
  { d: '22 Jul', v: 32 },
  { d: '23 Jul', v: 41 },
  { d: '24 Jul', v: 38 },
  { d: '25 Jul', v: 48 },
  { d: '26 Jul', v: 29 },
  { d: '27 Jul', v: 34 },
];

export const weekSummary = { reports: '247', revenue: '₹87,650', avg: '35' };

export interface Patient {
  id: string;
  name: string;
  initials: string;
  tone: Tone;
  pid: string;
  age: string;
  gender: string;
  blood: string;
  phone: string;
  lastTest: string;
  test: string;
  testTone: Tone;
}

export const patients: Patient[] = [
  { id: 'p1', name: 'Ramesh Kumar', initials: 'RK', tone: 'blue', pid: 'PT250727001', age: '32 Yrs', gender: 'Male', blood: 'B+', phone: '9876543210', lastTest: '27 Jul 2024', test: 'CBC', testTone: 'blue' },
  { id: 'p2', name: 'Sita Devi', initials: 'SD', tone: 'green', pid: 'PT250727002', age: '28 Yrs', gender: 'Female', blood: 'O+', phone: '9123456780', lastTest: '26 Jul 2024', test: 'LFT', testTone: 'green' },
  { id: 'p3', name: 'Mohit Sharma', initials: 'MS', tone: 'purple', pid: 'PT250727003', age: '45 Yrs', gender: 'Male', blood: 'A+', phone: '9988776655', lastTest: '25 Jul 2024', test: 'KFT', testTone: 'purple' },
  { id: 'p4', name: 'Pooja Kumari', initials: 'PK', tone: 'orange', pid: 'PT250727004', age: '30 Yrs', gender: 'Female', blood: 'AB+', phone: '8877665544', lastTest: '25 Jul 2024', test: 'Thyroid Profile', testTone: 'orange' },
  { id: 'p5', name: 'Arjun Singh', initials: 'AJ', tone: 'blue', pid: 'PT250727005', age: '36 Yrs', gender: 'Male', blood: 'B-', phone: '9638527410', lastTest: '24 Jul 2024', test: 'Lipid Profile', testTone: 'blue' },
  { id: 'p6', name: 'Vikash Patel', initials: 'VP', tone: 'pink', pid: 'PT250727006', age: '50 Yrs', gender: 'Male', blood: 'O-', phone: '8899001122', lastTest: '24 Jul 2024', test: 'Blood Sugar Fasting', testTone: 'red' },
];

export const patientStats = [
  { icon: 'account-multiple', tone: 'blue' as Tone, value: '1,248', label: 'Total Patients' },
  { icon: 'account-plus-outline', tone: 'green' as Tone, value: '28', label: 'New This Week' },
  { icon: 'clipboard-text-outline', tone: 'purple' as Tone, value: '387', label: 'Tests This Week' },
  { icon: 'currency-rupee', tone: 'orange' as Tone, value: '₹3,45,760', label: 'This Week Collection' },
];

export interface ReportRow {
  id: string;
  name: string;
  initials: string;
  tone: Tone;
  pid: string;
  meta: string;
  test: string;
  testTone: Tone;
  doctor: string;
  rid: string;
  date: string;
  time: string;
  amount: string;
  status: 'Completed' | 'Pending' | 'Paid' | 'Unpaid';
}

export const recentReports: ReportRow[] = [
  { id: 'r1', name: 'Ramesh Kumar', initials: 'RK', tone: 'blue', pid: 'PT250727001', meta: '', test: 'CBC', testTone: 'blue', doctor: 'Ref. Dr. Rakesh Kumar', rid: 'RP250726001', date: '26 Jul 2024', time: '09:21 AM', amount: '₹250', status: 'Paid' },
  { id: 'r2', name: 'Sita Devi', initials: 'SD', tone: 'green', pid: 'PT250727002', meta: '', test: 'LFT', testTone: 'green', doctor: 'Ref. Dr. Rakesh Kumar', rid: 'RP250726002', date: '26 Jul 2024', time: '09:05 AM', amount: '₹450', status: 'Paid' },
  { id: 'r3', name: 'Mohit Sharma', initials: 'MS', tone: 'purple', pid: 'PT250727003', meta: '', test: 'KFT', testTone: 'purple', doctor: 'Ref. Dr. Sunil Verma', rid: 'RP250726003', date: '26 Jul 2024', time: '08:45 AM', amount: '₹350', status: 'Unpaid' },
];

export const reportStats = [
  { icon: 'clipboard-text-outline', tone: 'blue' as Tone, value: '48', label: "Today's Reports" },
  { icon: 'timer-sand', tone: 'orange' as Tone, value: '12', label: 'Pending Reports' },
  { icon: 'check-circle-outline', tone: 'green' as Tone, value: '36', label: 'Completed' },
  { icon: 'currency-rupee', tone: 'purple' as Tone, value: '₹18,650', label: "Today's Collection" },
];

export const reportRows: ReportRow[] = [
  { id: 'r1', name: 'Ramesh Kumar', initials: 'RK', tone: 'blue', pid: 'PT250726001', meta: '32 Yrs | Male', test: 'CBC', testTone: 'blue', doctor: 'Ref. Dr. Rakesh Kumar', rid: 'RP250726001', date: '26 Jul 2024', time: '09:21 AM', amount: '₹250', status: 'Completed' },
  { id: 'r2', name: 'Sita Devi', initials: 'SD', tone: 'green', pid: 'PT250726002', meta: '28 Yrs | Female', test: 'LFT', testTone: 'green', doctor: 'Ref. Dr. Rakesh Kumar', rid: 'RP250726002', date: '26 Jul 2024', time: '09:05 AM', amount: '₹450', status: 'Completed' },
  { id: 'r3', name: 'Mohit Sharma', initials: 'MS', tone: 'purple', pid: 'PT250726003', meta: '45 Yrs | Male', test: 'KFT', testTone: 'purple', doctor: 'Ref. Dr. Sunil Verma', rid: 'RP250726003', date: '26 Jul 2024', time: '08:45 AM', amount: '₹350', status: 'Pending' },
  { id: 'r4', name: 'Pooja Kumari', initials: 'PK', tone: 'orange', pid: 'PT250726004', meta: '30 Yrs | Female', test: 'Thyroid Profile', testTone: 'orange', doctor: 'Ref. Dr. Anjali Gupta', rid: 'RP250726004', date: '26 Jul 2024', time: '08:30 AM', amount: '₹550', status: 'Pending' },
  { id: 'r5', name: 'Arjun Singh', initials: 'AJ', tone: 'blue', pid: 'PT250726005', meta: '36 Yrs | Male', test: 'Lipid Profile', testTone: 'blue', doctor: 'Ref. Dr. Rakesh Kumar', rid: 'RP250726005', date: '26 Jul 2024', time: '08:15 AM', amount: '₹400', status: 'Completed' },
  { id: 'r6', name: 'Vikash Patel', initials: 'VP', tone: 'pink', pid: 'PT250726006', meta: '50 Yrs | Male', test: 'Blood Sugar Fasting', testTone: 'red', doctor: 'Ref. Dr. Sunil Verma', rid: 'RP250726006', date: '26 Jul 2024', time: '07:50 AM', amount: '₹150', status: 'Pending' },
];

export const dateChips = [
  { t: 'Today', s: '26 Jul', active: true },
  { t: 'Yesterday', s: '25 Jul', active: false },
  { t: 'Last 7 Days', s: '19 - 26 Jul', active: false },
  { t: 'Last 30 Days', s: '27 Jun - 26 Jul', active: false },
];

export const testsCatalog = [
  { id: 't1', name: 'Complete Blood Count (CBC)', cat: 'Hematology', price: 250 },
  { id: 't2', name: 'Liver Function Test (LFT)', cat: 'Biochemistry', price: 450 },
  { id: 't3', name: 'Kidney Function Test (KFT)', cat: 'Biochemistry', price: 450 },
  { id: 't4', name: 'Thyroid Profile (T3, T4, TSH)', cat: 'Immunology', price: 500 },
  { id: 't5', name: 'Lipid Profile', cat: 'Biochemistry', price: 400 },
];

export const refDoctor = {
  name: 'Dr. Rakesh Kumar',
  quals: 'MBBS, MD (Pathology)',
  commission: 'Commission: 20%',
  phone: '9871122334',
  initials: 'DK',
};

export interface Param {
  name: string;
  value: string;
  unit: string;
  range: string;
  flag?: 'H' | 'L';
}
export interface ParamGroup {
  title: string;
  params: Param[];
}

export const cbcGroups: ParamGroup[] = [
  {
    title: 'White Blood Cell (WBC) Profile',
    params: [
      { name: 'WBC (Total)', value: '5.7', unit: '10^3/µL', range: '4.0 - 10.0' },
      { name: 'Lymphocyte %', value: '30.9', unit: '%', range: '20.0 - 40.0' },
      { name: 'MID %', value: '10.0', unit: '%', range: '1.0 - 15.0' },
      { name: 'Neutrophil %', value: '59.1', unit: '%', range: '50.0 - 70.0' },
      { name: 'Lymphocyte #', value: '1.8', unit: '10^3/µL', range: '0.6 - 4.1' },
      { name: 'MID #', value: '0.6', unit: '10^3/µL', range: '0.1 - 1.8' },
      { name: 'Neutrophil #', value: '3.3', unit: '10^3/µL', range: '2.0 - 7.0' },
    ],
  },
  {
    title: 'Red Blood Cell (RBC) Profile',
    params: [
      { name: 'RBC', value: '3.76', unit: '10^6/µL', range: '3.50 - 5.50' },
      { name: 'Hemoglobin', value: '15.5', unit: 'g/dL', range: '11.0 - 16.0' },
      { name: 'Hematocrit (HCT)', value: '35.2', unit: '%', range: '36.0 - 48.0', flag: 'L' },
      { name: 'MCV', value: '93.7', unit: 'fL', range: '80.0 - 99.0' },
      { name: 'MCH', value: '41.2', unit: 'pg', range: '26.0 - 32.0', flag: 'H' },
      { name: 'MCHC', value: '44.0', unit: 'g/dL', range: '32.0 - 36.0', flag: 'H' },
      { name: 'RDW-SD', value: '46.5', unit: 'fL', range: '37.0 - 54.0' },
      { name: 'RDW-CV', value: '12.6', unit: '%', range: '11.5 - 14.5' },
    ],
  },
  {
    title: 'Platelet Profile',
    params: [
      { name: 'Platelet Count', value: '64', unit: '10^3/µL', range: '150 - 450', flag: 'L' },
      { name: 'MPV', value: '12.9', unit: 'fL', range: '7.4 - 10.4', flag: 'H' },
      { name: 'PDW', value: '14.6', unit: '%', range: '10.0 - 17.0' },
      { name: 'PCT', value: '0.05', unit: '%', range: '0.10 - 0.28', flag: 'L' },
      { name: 'P-LCR', value: '60.8', unit: '%', range: '13.0 - 43.0', flag: 'H' },
    ],
  },
];

export const testSummary = { total: '20', normal: '16', high: '3', low: '1', remarks: 'No' };

export const moreSections: { title: string; items: { icon: string; label: string; sub: string }[] }[] = [
  {
    title: 'MANAGE',
    items: [
      { icon: 'doctor', label: 'Doctors', sub: 'Manage referring doctors' },
      { icon: 'test-tube', label: 'Tests & Packages', sub: 'Manage tests and packages' },
      { icon: 'account-multiple-outline', label: 'Patients', sub: 'Manage patient records' },
      { icon: 'account-badge-outline', label: 'Lab Employees', sub: 'Manage lab staff and roles' },
      { icon: 'home-outline', label: 'Sample Collection Center', sub: 'Manage collection centers' },
      { icon: 'percent-outline', label: 'Discount & Charges', sub: 'Manage discounts and extra charges' },
      { icon: 'credit-card-outline', label: 'Payment Methods', sub: 'Manage payment modes' },
    ],
  },
  {
    title: 'REPORTS & DATA',
    items: [
      { icon: 'file-document-outline', label: 'Report Templates', sub: 'Manage report templates' },
      { icon: 'cloud-upload-outline', label: 'Data Backup', sub: 'Backup and restore data' },
      { icon: 'trash-can-outline', label: 'Deleted Records', sub: 'View deleted patients & reports' },
    ],
  },
  {
    title: 'LAB & SUPPORT',
    items: [
      { icon: 'office-building-outline', label: 'Lab Profile', sub: 'View and edit lab details' },
      { icon: 'help-circle-outline', label: 'Help & Support', sub: 'Get help and contact support' },
      { icon: 'information-outline', label: 'About App', sub: 'App version and information' },
    ],
  },
];

export const drawerSections: { title: string; items: { icon: string; label: string; route?: string }[] }[] = [
  {
    title: 'MAIN',
    items: [
      { icon: 'home-outline', label: 'Dashboard', route: '/' },
      { icon: 'account-outline', label: 'Patients', route: '/patients' },
      { icon: 'clipboard-text-outline', label: 'Reports', route: '/reports' },
      { icon: 'file-plus-outline', label: 'Create Report', route: '/create-report' },
    ],
  },
  {
    title: 'MANAGE',
    items: [
      { icon: 'doctor', label: 'Doctors' },
      { icon: 'test-tube', label: 'Tests & Packages' },
      { icon: 'account-badge-outline', label: 'Lab Employees' },
      { icon: 'home-outline', label: 'Sample Collection Center' },
      { icon: 'percent-outline', label: 'Discount & Charges' },
      { icon: 'credit-card-outline', label: 'Payment Methods' },
    ],
  },
  {
    title: 'DATA & BACKUP',
    items: [
      { icon: 'file-document-outline', label: 'Report Templates' },
      { icon: 'cloud-upload-outline', label: 'Data Backup' },
      { icon: 'trash-can-outline', label: 'Deleted Records' },
    ],
  },
  {
    title: 'SETTINGS & SUPPORT',
    items: [
      { icon: 'office-building-outline', label: 'Lab Profile' },
      { icon: 'cog-outline', label: 'Settings' },
      { icon: 'account-group-outline', label: 'Users & Roles' },
      { icon: 'help-circle-outline', label: 'Help & Support' },
      { icon: 'information-outline', label: 'About App' },
    ],
  },
];

export const toneColor: Record<Tone, { fg: string; bg: string }> = {
  blue: { fg: '#1467E8', bg: '#E8F0FE' },
  green: { fg: '#16A34A', bg: '#E6F6EC' },
  orange: { fg: '#F59E0B', bg: '#FEF3E0' },
  purple: { fg: '#7C3AED', bg: '#F1E9FE' },
  pink: { fg: '#EC4899', bg: '#FDE9F1' },
  red: { fg: '#EF4444', bg: '#FDEBEC' },
};

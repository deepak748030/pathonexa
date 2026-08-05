export type Patient = {
  id: string;
  pid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female';
  blood: string;
  mobile: string;
  lastTest: string;
  lastTestDate: string;
  color: string;
};

export type Report = {
  id: string;
  reportId: string;
  patient: string;
  pid: string;
  age: number;
  gender: 'Male' | 'Female';
  test: string;
  doctor: string;
  date: string;
  time: string;
  amount: number;
  status: 'Completed' | 'Pending' | 'Cancelled';
  paid: boolean;
  color: string;
};

export type TestItem = { id: string; name: string; group: string; price: number };
export type Doctor = { id: string; name: string; degree: string; mobile: string; commission: number };

export const lab = {
  name: 'PathoNexa Diagnostics Pvt. Ltd.',
  shortName: 'PathoNexa Diagnostics',
  city: 'Lucknow, Uttar Pradesh',
  labId: 'LAB123456',
  admin: 'Amit Mishra',
  role: 'Lab Admin',
  address: '12, Vikas Nagar, Hazratganj, Lucknow, UP - 226001',
  phone: '+91 98765 43210',
  email: 'care@pathonexa.in',
  pathologist: 'Dr. Rakesh Kumar, MD (Pathology)',
};

export const dashboardStats = [
  { key: 'reports', label: "Today's Reports", value: '48', sub: 'Total Reports', tone: 'primary' as const },
  { key: 'revenue', label: "Today's Revenue", value: '₹18,650', sub: 'Total Collection', tone: 'green' as const },
  { key: 'pending', label: 'Pending Reports', value: '12', sub: 'Yet to Complete', tone: 'orange' as const },
  { key: 'amount', label: 'Pending Amount', value: '₹7,340', sub: 'From 15 Patients', tone: 'purple' as const },
  { key: 'commission', label: 'Doctor Commission', value: '₹5,280', sub: 'Pending Payout', tone: 'primary' as const },
  { key: 'expense', label: "Today's Expense", value: '₹2,140', sub: 'Total Expense', tone: 'red' as const },
];

export const patientStats = [
  { label: 'Total Patients', value: '1,248', tone: 'primary' as const },
  { label: 'New This Week', value: '28', tone: 'green' as const },
  { label: 'Tests This Week', value: '387', tone: 'purple' as const },
  { label: 'This Week Collection', value: '₹3,45,760', tone: 'orange' as const },
];

export const reportStats = [
  { label: "Today's Reports", value: '48', tone: 'primary' as const },
  { label: 'Pending Reports', value: '12', tone: 'orange' as const },
  { label: 'Completed', value: '36', tone: 'green' as const },
  { label: "Today's Collection", value: '₹18,650', tone: 'purple' as const },
];

export const chart = {
  labels: ['21 Jul', '22 Jul', '23 Jul', '24 Jul', '25 Jul', '26 Jul', '27 Jul'],
  values: [25, 32, 41, 38, 48, 29, 34],
  totalReports: '247',
  totalRevenue: '₹87,650',
  avgPerDay: '35',
};

export const patients: Patient[] = [
  { id: '1', pid: 'PT250727001', name: 'Ramesh Kumar', age: 32, gender: 'Male', blood: 'B+', mobile: '9876543210', lastTest: 'CBC', lastTestDate: '27 Jul 2024', color: '#DBEAFE' },
  { id: '2', pid: 'PT250727002', name: 'Sita Devi', age: 28, gender: 'Female', blood: 'O+', mobile: '9123456780', lastTest: 'LFT', lastTestDate: '26 Jul 2024', color: '#DCFCE7' },
  { id: '3', pid: 'PT250727003', name: 'Mohit Sharma', age: 45, gender: 'Male', blood: 'A+', mobile: '9988776655', lastTest: 'KFT', lastTestDate: '25 Jul 2024', color: '#EDE9FE' },
  { id: '4', pid: 'PT250727004', name: 'Pooja Kumari', age: 30, gender: 'Female', blood: 'AB+', mobile: '8877665544', lastTest: 'Thyroid Profile', lastTestDate: '25 Jul 2024', color: '#FEF3C7' },
  { id: '5', pid: 'PT250727005', name: 'Arjun Singh', age: 36, gender: 'Male', blood: 'B-', mobile: '9638527410', lastTest: 'Lipid Profile', lastTestDate: '24 Jul 2024', color: '#E0F2FE' },
  { id: '6', pid: 'PT250727006', name: 'Vikash Patel', age: 50, gender: 'Male', blood: 'O-', mobile: '8899001122', lastTest: 'Blood Sugar Fasting', lastTestDate: '24 Jul 2024', color: '#FEE2E2' },
];

export const reports: Report[] = [
  { id: '1', reportId: 'RP250726001', patient: 'Ramesh Kumar', pid: 'PT250726001', age: 32, gender: 'Male', test: 'CBC', doctor: 'Dr. Rakesh Kumar', date: '26 Jul 2024', time: '09:21 AM', amount: 250, status: 'Completed', paid: true, color: '#DBEAFE' },
  { id: '2', reportId: 'RP250726002', patient: 'Sita Devi', pid: 'PT250726002', age: 28, gender: 'Female', test: 'LFT', doctor: 'Dr. Rakesh Kumar', date: '26 Jul 2024', time: '09:05 AM', amount: 450, status: 'Completed', paid: true, color: '#DCFCE7' },
  { id: '3', reportId: 'RP250726003', patient: 'Mohit Sharma', pid: 'PT250726003', age: 45, gender: 'Male', test: 'KFT', doctor: 'Dr. Sunil Verma', date: '26 Jul 2024', time: '08:45 AM', amount: 350, status: 'Pending', paid: false, color: '#EDE9FE' },
  { id: '4', reportId: 'RP250726004', patient: 'Pooja Kumari', pid: 'PT250726004', age: 30, gender: 'Female', test: 'Thyroid Profile', doctor: 'Dr. Anjali Gupta', date: '26 Jul 2024', time: '08:30 AM', amount: 550, status: 'Pending', paid: false, color: '#FEF3C7' },
  { id: '5', reportId: 'RP250726005', patient: 'Arjun Singh', pid: 'PT250726005', age: 36, gender: 'Male', test: 'Lipid Profile', doctor: 'Dr. Rakesh Kumar', date: '26 Jul 2024', time: '08:15 AM', amount: 400, status: 'Completed', paid: true, color: '#E0F2FE' },
  { id: '6', reportId: 'RP250726006', patient: 'Vikash Patel', pid: 'PT250726006', age: 50, gender: 'Male', test: 'Blood Sugar Fasting', doctor: 'Dr. Sunil Verma', date: '26 Jul 2024', time: '07:50 AM', amount: 150, status: 'Pending', paid: false, color: '#FEE2E2' },
];

export const tests: TestItem[] = [
  { id: 't1', name: 'Complete Blood Count (CBC)', group: 'Hematology', price: 250 },
  { id: 't2', name: 'Liver Function Test (LFT)', group: 'Biochemistry', price: 450 },
  { id: 't3', name: 'Kidney Function Test (KFT)', group: 'Biochemistry', price: 450 },
  { id: 't4', name: 'Thyroid Profile (T3, T4, TSH)', group: 'Immunology', price: 500 },
  { id: 't5', name: 'Lipid Profile', group: 'Biochemistry', price: 400 },
];

export const doctors: Doctor[] = [
  { id: 'd1', name: 'Dr. Rakesh Kumar', degree: 'MBBS, MD (Pathology)', mobile: '9871122334', commission: 20 },
  { id: 'd2', name: 'Dr. Sunil Verma', degree: 'MBBS, MD (Medicine)', mobile: '9812233445', commission: 15 },
  { id: 'd3', name: 'Dr. Anjali Gupta', degree: 'MBBS, DGO', mobile: '9823344556', commission: 18 },
];

export const cbcParameters = [
  { group: 'White Blood Cell (WBC) Profile', rows: [
    { name: 'WBC (Total)', value: '5.7', unit: '10^3/µL', range: '4.0 - 10.0', flag: '' },
    { name: 'Lymphocyte %', value: '30.9', unit: '%', range: '20.0 - 40.0', flag: '' },
    { name: 'MID %', value: '10.0', unit: '%', range: '1.0 - 15.0', flag: '' },
    { name: 'Neutrophil %', value: '59.1', unit: '%', range: '50.0 - 70.0', flag: '' },
    { name: 'Lymphocyte #', value: '1.8', unit: '10^3/µL', range: '0.6 - 4.1', flag: '' },
    { name: 'MID #', value: '0.6', unit: '10^3/µL', range: '0.1 - 1.8', flag: '' },
    { name: 'Neutrophil #', value: '3.3', unit: '10^3/µL', range: '2.0 - 7.0', flag: '' },
  ]},
  { group: 'Red Blood Cell (RBC) Profile', rows: [
    { name: 'RBC', value: '3.76', unit: '10^6/µL', range: '3.50 - 5.50', flag: '' },
    { name: 'Hemoglobin', value: '15.5', unit: 'g/dL', range: '11.0 - 16.0', flag: '' },
    { name: 'Hematocrit (HCT)', value: '35.2', unit: '%', range: '36.0 - 46.0', flag: 'L' },
    { name: 'MCV', value: '93.7', unit: 'fL', range: '80.0 - 99.0', flag: '' },
    { name: 'MCH', value: '41.2', unit: 'pg', range: '26.0 - 32.0', flag: 'H' },
    { name: 'MCHC', value: '44.0', unit: 'g/dL', range: '32.0 - 36.0', flag: 'H' },
    { name: 'RDW-SD', value: '46.5', unit: 'fL', range: '37.0 - 54.0', flag: '' },
    { name: 'RDW-CV', value: '12.6', unit: '%', range: '11.5 - 14.5', flag: '' },
  ]},
  { group: 'Platelet Profile', rows: [
    { name: 'Platelet Count', value: '64', unit: '10^3/µL', range: '150 - 450', flag: 'L' },
    { name: 'MPV', value: '12.9', unit: 'fL', range: '7.4 - 10.4', flag: 'H' },
    { name: 'PDW', value: '14.6', unit: '%', range: '10.0 - 17.0', flag: '' },
    { name: 'PCT', value: '0.05', unit: '%', range: '0.10 - 0.28', flag: 'L' },
    { name: 'P-LCR', value: '60.8', unit: '%', range: '13.0 - 43.0', flag: 'H' },
  ]},
];

export const cbcParams = cbcParameters.flatMap((g) => g.rows);

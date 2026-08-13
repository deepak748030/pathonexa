/**
 * Demo seed data used to populate the database (MongoDB or in-memory store)
 * the first time the server starts, so the app never opens empty.
 * Seeding is idempotent: it only runs when the store has no patients.
 */

const tests = [
  { name: 'Complete Blood Count (CBC)', group: 'Hematology', price: 250 },
  { name: 'Liver Function Test (LFT)', group: 'Biochemistry', price: 450 },
  { name: 'Kidney Function Test (KFT)', group: 'Biochemistry', price: 450 },
  { name: 'Thyroid Profile (T3, T4, TSH)', group: 'Immunology', price: 500 },
  { name: 'Lipid Profile', group: 'Biochemistry', price: 400 },
  { name: 'Blood Sugar Fasting', group: 'Biochemistry', price: 150 },
];

const doctors = [
  { name: 'Dr. Rakesh Kumar', degree: 'MBBS, MD (Pathology)', mobile: '9871122334', commission: 20 },
  { name: 'Dr. Sunil Verma', degree: 'MBBS, MD (Medicine)', mobile: '9812233445', commission: 15 },
  { name: 'Dr. Anjali Gupta', degree: 'MBBS, DGO', mobile: '9823344556', commission: 18 },
];

const patients = [
  { name: 'Ramesh Kumar', age: 32, gender: 'Male', blood: 'B+', mobile: '9876543210', address: '12 Vikas Nagar, Lucknow', color: '#DBEAFE', lastTest: 'CBC', lastTestDate: '26 Jul 2026' },
  { name: 'Sita Devi', age: 28, gender: 'Female', blood: 'O+', mobile: '9123456780', address: 'Aliganj, Lucknow', color: '#DCFCE7', lastTest: 'LFT', lastTestDate: '26 Jul 2026' },
  { name: 'Mohit Sharma', age: 45, gender: 'Male', blood: 'A+', mobile: '9988776655', address: 'Gomti Nagar, Lucknow', color: '#EDE9FE', lastTest: 'KFT', lastTestDate: '25 Jul 2026' },
  { name: 'Pooja Kumari', age: 30, gender: 'Female', blood: 'AB+', mobile: '8877665544', address: 'Indira Nagar, Lucknow', color: '#FEF3C7', lastTest: 'Thyroid Profile', lastTestDate: '25 Jul 2026' },
  { name: 'Arjun Singh', age: 36, gender: 'Male', blood: 'B-', mobile: '9638527410', address: 'Chowk, Lucknow', color: '#E0F2FE', lastTest: 'Lipid Profile', lastTestDate: '24 Jul 2026' },
  { name: 'Vikash Patel', age: 50, gender: 'Male', blood: 'O-', mobile: '8899001122', address: 'Mahanagar, Lucknow', color: '#FEE2E2', lastTest: 'Blood Sugar Fasting', lastTestDate: '24 Jul 2026' },
];

// patientIndex refers to the position in `patients` above.
const reports = [
  { reportId: 'RP260726001', patientIndex: 0, test: 'Complete Blood Count (CBC)', doctor: 'Dr. Rakesh Kumar', date: '26 Jul 2026', time: '09:21 AM', amount: 250, status: 'Completed', paid: true },
  { reportId: 'RP260726002', patientIndex: 1, test: 'Liver Function Test (LFT)', doctor: 'Dr. Rakesh Kumar', date: '26 Jul 2026', time: '09:05 AM', amount: 450, status: 'Completed', paid: true },
  { reportId: 'RP260726003', patientIndex: 2, test: 'Kidney Function Test (KFT)', doctor: 'Dr. Sunil Verma', date: '25 Jul 2026', time: '08:45 AM', amount: 350, status: 'Pending', paid: false },
  { reportId: 'RP260726004', patientIndex: 3, test: 'Thyroid Profile (T3, T4, TSH)', doctor: 'Dr. Anjali Gupta', date: '25 Jul 2026', time: '08:30 AM', amount: 500, status: 'Pending', paid: false },
  { reportId: 'RP260726005', patientIndex: 4, test: 'Lipid Profile', doctor: 'Dr. Rakesh Kumar', date: '24 Jul 2026', time: '08:15 AM', amount: 400, status: 'Completed', paid: true },
  { reportId: 'RP260726006', patientIndex: 5, test: 'Blood Sugar Fasting', doctor: 'Dr. Sunil Verma', date: '24 Jul 2026', time: '07:50 AM', amount: 150, status: 'Pending', paid: false },
];

module.exports = { tests, doctors, patients, reports, employees, centers, payments, discounts, templates };

import type { CrudModuleConfig } from '../components/CrudModuleScreen';

export const moreModuleConfigs: Record<string, CrudModuleConfig> = {
  doctors: {
    key: 'doctors',
    title: 'Doctors',
    subtitle: 'Referrals and commission details',
    singular: 'Doctor',
    icon: 'doctor',
    fields: [
      { key: 'name', label: 'Doctor name', placeholder: 'e.g. Dr. Anjali Sharma', required: true },
      { key: 'specialization', label: 'Specialization', placeholder: 'e.g. General Physician' },
      { key: 'mobile', label: 'Mobile number', placeholder: '10-digit mobile number', kind: 'phone' },
      { key: 'commission', label: 'Commission (%)', placeholder: 'e.g. 10', kind: 'number', max: 100 },
      { key: 'address', label: 'Clinic / address', placeholder: 'Enter clinic or address', kind: 'multiline' },
    ],
    secondaryKeys: ['specialization', 'mobile', 'commission'],
  },
  employees: {
    key: 'employees',
    title: 'Lab Employees',
    subtitle: 'Staff details and assigned roles',
    singular: 'Employee',
    icon: 'account-badge-outline',
    fields: [
      { key: 'name', label: 'Employee name', placeholder: 'Enter full name', required: true },
      { key: 'role', label: 'Role', placeholder: 'Select role', required: true, kind: 'select', options: ['Technician', 'Receptionist', 'Phlebotomist', 'Pathologist', 'Manager'] },
      { key: 'mobile', label: 'Mobile number', placeholder: '10-digit mobile number', kind: 'phone' },
      { key: 'email', label: 'Email address', placeholder: 'name@example.com', kind: 'email' },
      { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
    ],
    defaultValues: { status: 'Active', role: 'Technician' },
    secondaryKeys: ['role', 'mobile', 'status'],
  },
  centers: {
    key: 'centers',
    title: 'Collection Centers',
    subtitle: 'Sample collection locations',
    singular: 'Collection center',
    icon: 'home-outline',
    fields: [
      { key: 'name', label: 'Center name', placeholder: 'Enter center name', required: true },
      { key: 'contactPerson', label: 'Contact person', placeholder: 'Enter contact name' },
      { key: 'mobile', label: 'Mobile number', placeholder: '10-digit mobile number', kind: 'phone' },
      { key: 'city', label: 'City', placeholder: 'Enter city' },
      { key: 'address', label: 'Full address', placeholder: 'Enter collection center address', kind: 'multiline' },
      { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
    ],
    defaultValues: { status: 'Active' },
    secondaryKeys: ['city', 'contactPerson', 'mobile', 'status'],
  },
  discounts: {
    key: 'discounts',
    title: 'Discount & Charges',
    subtitle: 'Billing adjustments and extra fees',
    singular: 'Billing adjustment',
    icon: 'percent-outline',
    fields: [
      { key: 'name', label: 'Name', placeholder: 'e.g. Senior Citizen Discount', required: true },
      { key: 'type', label: 'Adjustment type', placeholder: 'Select type', required: true, kind: 'select', options: ['Discount', 'Charge'] },
      { key: 'mode', label: 'Calculation', placeholder: 'Select calculation', required: true, kind: 'select', options: ['Percentage', 'Fixed'] },
      { key: 'value', label: 'Value', placeholder: 'Enter amount or percentage', required: true, kind: 'number' },
      { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
    ],
    defaultValues: { type: 'Discount', mode: 'Percentage', status: 'Active' },
    secondaryKeys: ['type', 'mode', 'value', 'status'],
    validate: (values) => (
      values.mode === 'Percentage' && Number(values.value) > 100
        ? 'Percentage adjustments cannot be more than 100.'
        : null
    ),
  },
  payments: {
    key: 'payments',
    title: 'UPI Payment Apps',
    subtitle: 'Accepted UPI apps for online payment',
    singular: 'Payment app',
    icon: 'credit-card-outline',
    fields: [
      { key: 'name', label: 'App name', placeholder: 'e.g. PhonePe', required: true },
      { key: 'details', label: 'Details', placeholder: 'e.g. UPI ID or collection reference', kind: 'multiline' },
      { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
    ],
    defaultValues: { status: 'Active' },
    secondaryKeys: ['details', 'status'],
  },
};

export const testConfig: CrudModuleConfig = {
  key: 'tests',
  title: 'Tests',
  subtitle: 'Individual lab test catalogue',
  singular: 'Test',
  icon: 'test-tube',
  fields: [
    { key: 'name', label: 'Test name', placeholder: 'e.g. Complete Blood Count', required: true },
    { key: 'short', label: 'Short name', placeholder: 'e.g. CBC' },
    { key: 'category', label: 'Category', placeholder: 'e.g. Haematology' },
    { key: 'sampleType', label: 'Sample type', placeholder: 'e.g. EDTA Blood' },
    { key: 'price', label: 'Price (₹)', placeholder: 'Enter test price', required: true, kind: 'number' },
    { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
  ],
  defaultValues: { status: 'Active' },
  secondaryKeys: ['short', 'category', 'price', 'status'],
};

export const packageConfig: CrudModuleConfig = {
  key: 'packages',
  title: 'Packages',
  subtitle: 'Bundled test packages',
  singular: 'Package',
  icon: 'package-variant-closed',
  fields: [
    { key: 'name', label: 'Package name', placeholder: 'e.g. Full Body Checkup', required: true },
    { key: 'description', label: 'Included tests / description', placeholder: 'Describe tests included in the package', kind: 'multiline' },
    { key: 'price', label: 'Package price (₹)', placeholder: 'Enter package price', required: true, kind: 'number' },
    { key: 'status', label: 'Status', placeholder: 'Select status', kind: 'select', options: ['Active', 'Inactive'] },
  ],
  defaultValues: { status: 'Active' },
  secondaryKeys: ['description', 'price', 'status'],
};

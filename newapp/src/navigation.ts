export type NavigationItem = { icon: string; label: string; sub?: string; route?: string };
export type NavigationSection = { title: string; items: NavigationItem[] };

/** Static navigation metadata only; account/business records always come from the API. */
export const moreSections: NavigationSection[] = [
  {
    title: 'MANAGE',
    items: [
      { icon: 'doctor', label: 'Doctors', sub: 'Manage referring doctors', route: '/manage/doctors' },
      { icon: 'test-tube', label: 'Tests & Packages', sub: 'Manage tests and packages', route: '/tests-packages' },
      { icon: 'account-multiple-outline', label: 'Patients', sub: 'Manage patient records', route: '/patients' },
      { icon: 'account-badge-outline', label: 'Lab Employees', sub: 'Manage lab staff and roles', route: '/manage/employees' },
      { icon: 'home-outline', label: 'Sample Collection Center', sub: 'Manage collection centers', route: '/manage/centers' },
      { icon: 'percent-outline', label: 'Discount & Charges', sub: 'Manage discounts and extra charges', route: '/manage/discounts' },
      { icon: 'credit-card-outline', label: 'Payment Methods', sub: 'Manage payment modes', route: '/manage/payments' },
    ],
  },
  {
    title: 'REPORTS & DATA',
    items: [
      { icon: 'file-document-outline', label: 'Report Templates', sub: 'Manage report templates', route: '/manage/templates' },
      { icon: 'cloud-upload-outline', label: 'Data Backup', sub: 'Backup and restore data', route: '/data-backup' },
      { icon: 'trash-can-outline', label: 'Deleted Records', sub: 'View deleted patients & reports', route: '/deleted-records' },
    ],
  },
  {
    title: 'LAB & SUPPORT',
    items: [
      { icon: 'office-building-outline', label: 'Lab Profile', sub: 'View and edit lab details', route: '/lab-profile' },
      { icon: 'help-circle-outline', label: 'Help & Support', sub: 'Get help and contact support', route: '/help-support' },
      { icon: 'information-outline', label: 'About App', sub: 'App version and information', route: '/about-app' },
    ],
  },
];

export const drawerSections: NavigationSection[] = [
  {
    title: 'MAIN',
    items: [
      { icon: 'home-outline', label: 'Dashboard', route: '/' },
      { icon: 'account-outline', label: 'Patients', route: '/patients' },
      { icon: 'clipboard-text-outline', label: 'Reports', route: '/reports' },
      { icon: 'file-plus-outline', label: 'Create Report', route: '/create-report' },
    ],
  },
  { title: 'MANAGE', items: moreSections[0].items },
  { title: 'DATA & BACKUP', items: moreSections[1].items },
  { title: 'SUPPORT', items: moreSections[2].items },
];

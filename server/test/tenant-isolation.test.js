const test = require('node:test');
const assert = require('node:assert/strict');

process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = '';
process.env.ALLOW_IN_MEMORY = 'true';
process.env.JWT_SECRET = 'test-only-pathonexa-jwt-secret-at-least-32-characters';
process.env.INTERNAL_OTP = '123456';

const app = require('../src/index');
let server;
let base;

async function api(path, { token, method = 'GET', body } = {}) {
  const response = await fetch(`${base}/api${path}`, {
    method,
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json();
  return { status: response.status, data };
}

async function signIn(mobile) {
  const login = await api('/auth/login', { method: 'POST', body: { mobile } });
  assert.equal(login.status, 200);
  assert.equal(JSON.stringify(login.data).includes('123456'), false, 'OTP must never be returned by the API');
  const verify = await api('/auth/verify', { method: 'POST', body: { mobile, otp: '123456' } });
  assert.equal(verify.status, 200);
  assert.ok(verify.data.token);
  return verify.data;
}

test.before(async () => {
  await require('../src/config/db').whenReady();
  server = app.listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

test.after(async () => {
  await new Promise((resolve) => server.close(resolve));
});

test('all business APIs require a verified bearer token', async () => {
  for (const path of ['/patients', '/reports', '/dashboard/stats', '/doctors', '/settings', '/notifications', '/backup/export', '/config']) {
    const response = await api(path);
    assert.equal(response.status, 401, path);
    assert.equal(response.data.message, 'Authentication required');
  }
  const invalid = await api('/patients', { token: 'invalid.jwt.value' });
  assert.equal(invalid.status, 401);
});

test('OTP challenges reject invalid mobiles, throttle resend, limit attempts, and cannot be reused', async () => {
  const invalidMobile = await api('/auth/login', { method: 'POST', body: { mobile: '+919876543210' } });
  assert.equal(invalidMobile.status, 400);

  const lockedMobile = '9345678901';
  assert.equal((await api('/auth/login', { method: 'POST', body: { mobile: lockedMobile } })).status, 200);
  assert.equal((await api('/auth/login', { method: 'POST', body: { mobile: lockedMobile } })).status, 429);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.equal((await api('/auth/verify', { method: 'POST', body: { mobile: lockedMobile, otp: '000000' } })).status, 400);
  }
  assert.equal((await api('/auth/verify', { method: 'POST', body: { mobile: lockedMobile, otp: '123456' } })).status, 400);

  const oneTimeMobile = '9456789012';
  assert.equal((await api('/auth/login', { method: 'POST', body: { mobile: oneTimeMobile } })).status, 200);
  assert.equal((await api('/auth/verify', { method: 'POST', body: { mobile: oneTimeMobile, otp: '123456' } })).status, 200);
  assert.equal((await api('/auth/verify', { method: 'POST', body: { mobile: oneTimeMobile, otp: '123456' } })).status, 400);
});

test('two mobile accounts cannot list, fetch, mutate, delete, infer, export, or restore each other data', async () => {
  const accountA = await signIn('9876543210');
  const accountB = await signIn('9123456780');
  const a = accountA.token;
  const b = accountB.token;
  assert.notEqual(accountA.user.id, accountB.user.id);

  const aMe = await api('/auth/me', { token: a });
  assert.equal(aMe.status, 200);
  assert.equal(aMe.data.user.mobile, '9876543210');

  const patientA = await api('/patients', {
    token: a, method: 'POST',
    body: { name: 'Account A Patient', age: 31, gender: 'Male', mobile: '9988776655', blood: 'B+' },
  });
  assert.equal(patientA.status, 201);
  const patientB = await api('/patients', {
    token: b, method: 'POST',
    body: { name: 'Account B Patient', age: 28, gender: 'Female', mobile: '8877665544', blood: 'O+' },
  });
  assert.equal(patientB.status, 201);
  assert.equal(patientA.data.pid, patientB.data.pid, 'human-readable sequences must be account scoped');

  const listA = await api('/patients?page=1&limit=10', { token: a });
  const listB = await api('/patients?page=1&limit=10', { token: b });
  assert.deepEqual(listA.data.items.map((item) => item.name), ['Account A Patient']);
  assert.deepEqual(listB.data.items.map((item) => item.name), ['Account B Patient']);
  assert.equal(listA.data.pagination.total, 1);
  assert.equal(listB.data.pagination.total, 1);

  const patientAId = patientA.data._id;
  for (const request of [
    () => api(`/patients/${patientAId}`, { token: b }),
    () => api(`/patients/${patientAId}`, { token: b, method: 'PATCH', body: { name: 'Stolen' } }),
    () => api(`/patients/${patientAId}`, { token: b, method: 'DELETE' }),
  ]) {
    const response = await request();
    assert.equal(response.status, 404);
    assert.equal(response.data.message, 'Patient not found');
  }

  const crossReference = await api('/reports', {
    token: b, method: 'POST',
    body: { patient: patientAId, test: 'CBC', amount: 250, status: 'Pending' },
  });
  assert.equal(crossReference.status, 404);
  assert.equal(crossReference.data.message, 'Patient not found');

  const reportA = await api('/reports', {
    token: a, method: 'POST',
    body: { patient: patientAId, test: 'Complete Blood Count (CBC)', amount: 250, paidAmount: 100, pendingAmount: 150, status: 'Pending' },
  });
  assert.equal(reportA.status, 201);
  const reportAId = reportA.data._id;

  const reportsB = await api('/reports?page=1&limit=10', { token: b });
  assert.equal(reportsB.data.pagination.total, 0);

  const accountANotifications = await api('/notifications?page=1&limit=20', { token: a });
  const paymentNotification = accountANotifications.data.items.find((item) => item.id.startsWith('pay-'));
  assert.ok(paymentNotification);
  const crossNotificationRead = await api(`/notifications/${encodeURIComponent(paymentNotification.id)}/read`, { token: b, method: 'POST' });
  assert.equal(crossNotificationRead.status, 404);

  const crossCollection = await api('/transactions/collect', {
    token: b, method: 'POST', body: { reportId: reportAId, amount: 50, mode: 'Cash' },
  });
  assert.equal(crossCollection.status, 404);
  assert.equal(crossCollection.data.message, 'Report not found');

  for (const request of [
    () => api(`/reports/${reportAId}`, { token: b }),
    () => api(`/reports/${reportAId}`, { token: b, method: 'PATCH', body: { status: 'Completed' } }),
    () => api(`/reports/${reportAId}/verify`, { token: b, method: 'POST', body: {} }),
    () => api(`/reports/${reportAId}/duplicate`, { token: b, method: 'POST', body: {} }),
    () => api(`/reports/${reportAId}`, { token: b, method: 'DELETE' }),
  ]) {
    const response = await request();
    assert.equal(response.status, 404);
    assert.equal(response.data.message, 'Report not found');
  }

  const doctorA = await api('/doctors', { token: a, method: 'POST', body: { name: 'Dr Account A', mobile: '9000000001' } });
  assert.equal(doctorA.status, 201);
  const doctorsB = await api('/doctors', { token: b });
  assert.equal(doctorsB.status, 200);
  assert.equal(doctorsB.data.some((doctor) => doctor.name === 'Dr Account A'), false);
  const crossDoctorLedger = await api(`/doctors/${doctorA.data._id}/ledger`, { token: b });
  assert.equal(crossDoctorLedger.status, 404);
  const crossCommission = await api('/commissions/pay', {
    token: b, method: 'POST', body: { doctorId: doctorA.data._id, amount: 100, mode: 'Cash' },
  });
  assert.equal(crossCommission.status, 404);
  for (const method of ['GET', 'PATCH', 'PUT', 'DELETE']) {
    const response = await api(`/doctors/${doctorA.data._id}`, { token: b, method, body: ['PATCH', 'PUT'].includes(method) ? { name: 'Stolen' } : undefined });
    assert.equal(response.status, 404);
  }

  await api('/settings', { token: a, method: 'PATCH', body: { name: 'Account A Lab', city: 'Indore' } });
  const settingsB = await api('/settings', { token: b });
  assert.equal(settingsB.data.name, 'My Pathology Lab');
  assert.notEqual(settingsB.data.city, 'Indore');

  const transactionsB = await api('/transactions/summary', { token: b });
  assert.equal(transactionsB.data.transactions, 0);
  assert.equal(transactionsB.data.totalCollection, 0);
  const analyticsB = await api('/analytics', { token: b });
  assert.equal(analyticsB.data.totalReports, 0);
  assert.equal(analyticsB.data.revenue.total, 0);
  const dashboardB = await api('/dashboard/stats', { token: b });
  assert.equal(dashboardB.data[0].value, '0');

  const subscriptionA = await api('/subscription/subscribe', { token: a, method: 'POST', body: { planId: 'monthly' } });
  assert.equal(subscriptionA.status, 200);
  const subscriptionB = await api('/subscription', { token: b });
  assert.equal(subscriptionB.data.planId, 'trial');

  const exportA = await api('/backup/export', { token: a });
  const exportB = await api('/backup/export', { token: b });
  assert.equal(exportA.status, 200);
  assert.equal(exportB.status, 200);
  assert.equal(exportA.data.meta.version, 3);
  assert.match(exportA.data.meta.signature, /^[a-f\d]{64}$/);
  assert.notEqual(exportA.data.meta.owner, exportB.data.meta.owner);
  assert.deepEqual(exportA.data.patients.map((item) => item.name), ['Account A Patient']);
  assert.deepEqual(exportB.data.patients.map((item) => item.name), ['Account B Patient']);
  assert.equal(JSON.stringify(exportB.data).includes('Account A'), false);

  const crossRestore = await api('/backup/restore', { token: b, method: 'POST', body: exportA.data });
  assert.equal(crossRestore.status, 403);
  assert.equal(crossRestore.data.message, 'This backup belongs to a different account');

  // Replacing the visible owner proof with this account's own proof must not
  // turn another account's snapshot into an accepted backup.
  const forgedOwner = structuredClone(exportA.data);
  forgedOwner.meta.owner = exportB.data.meta.owner;
  const forgedRestore = await api('/backup/restore', { token: b, method: 'POST', body: forgedOwner });
  assert.equal(forgedRestore.status, 400);
  assert.equal(forgedRestore.data.message, 'Backup integrity check failed');

  const tamperedSelf = structuredClone(exportA.data);
  tamperedSelf.patients[0].name = 'Tampered Patient';
  const tamperedRestore = await api('/backup/restore', { token: a, method: 'POST', body: tamperedSelf });
  assert.equal(tamperedRestore.status, 400);
  assert.equal(tamperedRestore.data.message, 'Backup integrity check failed');
  assert.deepEqual((await api('/patients', { token: a })).data.map((item) => item.name), ['Account A Patient']);

  const selfRestore = await api('/backup/restore', { token: a, method: 'POST', body: exportA.data });
  assert.equal(selfRestore.status, 200);
  const afterRestoreB = await api('/patients', { token: b });
  assert.deepEqual(afterRestoreB.data.map((item) => item.name), ['Account B Patient']);

  const deleteA = await api(`/reports/${(await api('/reports', { token: a })).data[0]._id}`, { token: a, method: 'DELETE' });
  assert.equal(deleteA.status, 200);
  const deletedA = await api('/deleted', { token: a });
  assert.equal(deletedA.status, 200);
  assert.ok(deletedA.data.length > 0);
  const crossDeletedRestore = await api(`/deleted/${deletedA.data[0]._id}/restore`, { token: b, method: 'POST' });
  assert.equal(crossDeletedRestore.status, 404);
  const deletedB = await api('/deleted', { token: b });
  assert.equal(deletedB.data.length, 0);

  // Deleted-record history is part of a full backup and must survive restore.
  const backupWithDeleted = await api('/backup/export', { token: a });
  assert.equal(backupWithDeleted.data.deleted.length, 1);
  assert.equal((await api(`/deleted/${deletedA.data[0]._id}/restore`, { token: a, method: 'POST' })).status, 200);
  assert.equal((await api('/deleted', { token: a })).data.length, 0);
  assert.equal((await api('/backup/restore', { token: a, method: 'POST', body: backupWithDeleted.data })).status, 200);
  assert.equal((await api('/deleted', { token: a })).data.length, 1);
});

test('More management modules support tenant-safe CRUD, restore, lab profile, and backup workflows', async () => {
  const accountA = await signIn('9765432108');
  const accountB = await signIn('9865432107');
  const modules = [
    ['tests', { name: 'More Screen Test', price: 175, category: 'Biochemistry', status: 'Active' }],
    ['doctors', { name: 'Dr More Screen', mobile: '9876500001', commission: 8 }],
    ['employees', { name: 'More Employee', role: 'Technician', mobile: '9876500002', status: 'Active' }],
    ['centers', { name: 'More Collection Center', city: 'Indore', status: 'Active' }],
    ['discounts', { name: 'More Discount', type: 'Discount', mode: 'Percentage', value: 5, status: 'Active' }],
    ['payments', { name: 'More UPI', details: 'lab@upi', status: 'Active' }],
    ['templates', { name: 'More Standard Template', footer: 'Verified report', status: 'Active' }],
    ['packages', { name: 'More Health Package', description: 'CBC and LFT', price: 499, status: 'Active' }],
  ];

  const created = [];
  for (const [key, payload] of modules) { // eslint-disable-line no-restricted-syntax
    const response = await api(`/${key}`, { token: accountA.token, method: 'POST', body: payload }); // eslint-disable-line no-await-in-loop
    assert.equal(response.status, 201, `${key} create should succeed`);
    created.push([key, response.data]);

    const ownList = await api(`/${key}`, { token: accountA.token }); // eslint-disable-line no-await-in-loop
    assert.ok(ownList.data.some((item) => item._id === response.data._id));
    const otherList = await api(`/${key}`, { token: accountB.token }); // eslint-disable-line no-await-in-loop
    assert.equal(otherList.data.some((item) => item.name === payload.name), false);
    const crossRead = await api(`/${key}/${response.data._id}`, { token: accountB.token }); // eslint-disable-line no-await-in-loop
    assert.equal(crossRead.status, 404);

    const update = await api(`/${key}/${response.data._id}`, { // eslint-disable-line no-await-in-loop
      token: accountA.token, method: 'PATCH',
      body: { status: 'Inactive', _id: 'forged-id', ownerId: accountB.user.id, kind: 'deleted' },
    });
    assert.equal(update.status, 200);
    assert.equal(update.data.status, 'Inactive');
    assert.equal(update.data._id, response.data._id);
    assert.notEqual(update.data.kind, 'deleted');
  }

  const invalidPercentage = await api('/discounts', {
    token: accountA.token, method: 'POST',
    body: { name: 'Invalid Percentage', type: 'Discount', mode: 'Percentage', value: 101 },
  });
  assert.equal(invalidPercentage.status, 400);

  const profileUpdate = await api('/lab', {
    token: accountA.token, method: 'PATCH',
    body: { name: 'More Screen Lab', city: 'Indore', email: 'lab@example.com', autoBackup: false },
  });
  assert.equal(profileUpdate.status, 200);
  const ownProfile = await api('/lab', { token: accountA.token });
  const otherProfile = await api('/lab', { token: accountB.token });
  assert.equal(ownProfile.data.name, 'More Screen Lab');
  assert.equal(ownProfile.data.city, 'Indore');
  assert.equal(otherProfile.data.name, 'My Pathology Lab');
  assert.equal(otherProfile.data.city, '');

  const initialBackupStatus = await api('/backup/status', { token: accountA.token });
  assert.equal(initialBackupStatus.status, 200);
  assert.equal(initialBackupStatus.data.autoBackup, false);
  assert.ok(initialBackupStatus.data.totalRecords >= modules.length);
  const runBackup = await api('/backup/run', { token: accountA.token, method: 'POST' });
  assert.equal(runBackup.status, 200);
  assert.equal(runBackup.data.ok, true);
  const completedBackupStatus = await api('/backup/status', { token: accountA.token });
  assert.ok(completedBackupStatus.data.lastBackupAt);

  for (const [key, record] of created) { // eslint-disable-line no-restricted-syntax
    const removed = await api(`/${key}/${record._id}`, { token: accountA.token, method: 'DELETE' }); // eslint-disable-line no-await-in-loop
    assert.equal(removed.status, 200, `${key} delete should succeed`);
  }
  const deletedA = await api('/deleted', { token: accountA.token });
  const deletedB = await api('/deleted', { token: accountB.token });
  assert.equal(deletedA.data.length, modules.length);
  assert.equal(deletedB.data.length, 0);

  for (const record of deletedA.data) { // eslint-disable-line no-restricted-syntax
    const crossRestore = await api(`/deleted/${record._id}/restore`, { token: accountB.token, method: 'POST' }); // eslint-disable-line no-await-in-loop
    assert.equal(crossRestore.status, 404);
    const ownRestore = await api(`/deleted/${record._id}/restore`, { token: accountA.token, method: 'POST' }); // eslint-disable-line no-await-in-loop
    assert.equal(ownRestore.status, 200);
  }
  assert.equal((await api('/deleted', { token: accountA.token })).data.length, 0);
  for (const [key, payload] of modules) { // eslint-disable-line no-restricted-syntax
    const list = await api(`/${key}`, { token: accountA.token }); // eslint-disable-line no-await-in-loop
    assert.ok(list.data.some((item) => item.name === payload.name), `${key} record should be restored`);
  }
});

test('patient, report, and payment validation keeps balances and ledgers consistent', async () => {
  const { token } = await signIn('9654321098');
  const patient = await api('/patients', {
    token, method: 'POST',
    body: { name: 'Infant Patient', age: 0, gender: 'Other', mobile: '8765400001', ownerId: '507f191e810c19729de860ea' },
  });
  assert.equal(patient.status, 201);
  assert.equal(patient.data.age, 0);
  assert.equal(patient.data.ownerId, undefined);

  const invalidPatient = await api(`/patients/${patient.data._id}`, {
    token, method: 'PATCH', body: { mobile: '123', age: 500 },
  });
  assert.equal(invalidPatient.status, 400);
  const unchangedPatient = await api(`/patients/${patient.data._id}`, { token });
  assert.equal(unchangedPatient.data.mobile, '8765400001');
  assert.equal(unchangedPatient.data.age, 0);

  const duplicatePatients = await Promise.all([
    api('/patients', {
      token, method: 'POST',
      body: { name: 'Duplicate One', age: 20, gender: 'Male', mobile: '8765400002' },
    }),
    api('/patients', {
      token, method: 'POST',
      body: { name: 'Duplicate Two', age: 21, gender: 'Female', mobile: '8765400002' },
    }),
  ]);
  assert.deepEqual(duplicatePatients.map((response) => response.status).sort(), [201, 400]);

  const negativeReport = await api('/reports', {
    token, method: 'POST', body: { patient: patient.data._id, test: 'CBC', amount: -1 },
  });
  assert.equal(negativeReport.status, 400);
  const inconsistentReport = await api('/reports', {
    token, method: 'POST',
    body: { patient: patient.data._id, test: 'CBC', amount: 100, paidAmount: 20, pendingAmount: 10 },
  });
  assert.equal(inconsistentReport.status, 400);

  const duplicateReports = await Promise.all([
    api('/reports', {
      token, method: 'POST',
      body: {
        reportId: 'RPT-RACE-001', patient: patient.data._id, test: 'Duplicate CBC',
        amount: 40, paidAmount: 10, pendingAmount: 30,
      },
    }),
    api('/reports', {
      token, method: 'POST',
      body: {
        reportId: 'RPT-RACE-001', patient: patient.data._id, test: 'Duplicate CBC',
        amount: 40, paidAmount: 10, pendingAmount: 30,
      },
    }),
  ]);
  assert.deepEqual(duplicateReports.map((response) => response.status).sort(), [201, 400]);
  const duplicateReportLedger = await api('/transactions?reportId=RPT-RACE-001', { token });
  assert.equal(duplicateReportLedger.data.length, 1);
  assert.equal(duplicateReportLedger.data[0].amount, 10);

  const directNegativeExpense = await api('/expenses', {
    token, method: 'POST', body: { name: 'Invalid expense', amount: -1 },
  });
  assert.equal(directNegativeExpense.status, 400);
  const expense = await api('/expenses', {
    token, method: 'POST', body: { name: 'Protected expense', amount: 25 },
  });
  assert.equal(expense.status, 201);
  const crossCollectionPatch = await api(`/doctors/${expense.data._id}`, {
    token, method: 'PATCH', body: { name: 'Wrong collection' },
  });
  assert.equal(crossCollectionPatch.status, 404);
  const crossCollectionDelete = await api(`/doctors/${expense.data._id}`, {
    token, method: 'DELETE',
  });
  assert.equal(crossCollectionDelete.status, 404);
  assert.equal((await api(`/expenses/${expense.data._id}`, { token })).data.amount, 25);

  const forgedTransaction = await api('/transactions', {
    token, method: 'POST', body: { amount: 999, type: 'Collection', txnId: 'FORGED' },
  });
  assert.equal(forgedTransaction.status, 405);

  const initiallyPaidReport = await api('/reports', {
    token, method: 'POST',
    body: {
      patient: patient.data._id,
      test: 'LFT',
      amount: 50,
      paidAmount: 20,
      pendingAmount: 30,
      transactionId: 'FORGED-TRANSACTION-ID',
    },
  });
  assert.equal(initiallyPaidReport.status, 201);
  assert.equal(initiallyPaidReport.data.transactionId, undefined);
  const initialLedger = await api(`/transactions?reportId=${encodeURIComponent(initiallyPaidReport.data.reportId)}`, { token });
  assert.equal(initialLedger.data.reduce((sum, item) => sum + item.amount, 0), 20);
  assert.notEqual(initialLedger.data[0].txnId, 'FORGED-TRANSACTION-ID');
  const ledgerRewrite = await api(`/transactions/${initialLedger.data[0]._id}`, {
    token, method: 'PATCH', body: { amount: 999 },
  });
  assert.equal(ledgerRewrite.status, 405);
  assert.equal((await api(`/transactions?reportId=${encodeURIComponent(initiallyPaidReport.data.reportId)}`, { token })).data[0].amount, 20);

  const report = await api('/reports', {
    token, method: 'POST', body: { patient: patient.data._id, test: 'CBC', amount: 100, status: 'Pending' },
  });
  assert.equal(report.status, 201);
  assert.equal(report.data.paidAmount, 0);
  assert.equal(report.data.pendingAmount, 100);
  assert.equal(report.data.paid, false);

  const directBalanceEdit = await api(`/reports/${report.data._id}`, {
    token, method: 'PATCH', body: { paidAmount: 99, pendingAmount: 1 },
  });
  assert.equal(directBalanceEdit.status, 400);
  for (const patch of [
    { amount: 1 },
    { discount: 1 },
    { paymentMode: 'UPI' },
    { transactionId: 'FORGED' },
    { doctor: 'Reassigned Doctor' },
    { verified: true, verifiedBy: 'Forged Verifier' },
  ]) {
    const immutableBillingEdit = await api(`/reports/${report.data._id}`, {
      token, method: 'PATCH', body: patch,
    });
    assert.equal(immutableBillingEdit.status, 400);
  }
  const unchangedBilling = await api(`/reports/${report.data._id}`, { token });
  assert.equal(unchangedBilling.data.amount, 100);
  assert.equal(unchangedBilling.data.discount || 0, 0);
  assert.equal(unchangedBilling.data.verified, false);

  const verifiedReport = await api(`/reports/${report.data._id}/verify`, {
    token, method: 'POST', body: { by: 'Forged Verifier' },
  });
  assert.equal(verifiedReport.status, 200);
  assert.equal(verifiedReport.data.verified, true);
  assert.equal(verifiedReport.data.verifiedBy, 'Lab Owner');
  assert.equal(verifiedReport.data.status, 'Completed');

  const negativePayment = await api('/transactions/collect', {
    token, method: 'POST', body: { reportId: report.data._id, amount: -10 },
  });
  assert.equal(negativePayment.status, 400);

  const collections = await Promise.all([
    api('/transactions/collect', { token, method: 'POST', body: { reportId: report.data._id, amount: 80, mode: 'Cash' } }),
    api('/transactions/collect', { token, method: 'POST', body: { reportId: report.data._id, amount: 80, mode: 'UPI' } }),
  ]);
  collections.forEach((response) => assert.equal(response.status, 201));
  assert.equal(collections.reduce((sum, response) => sum + response.data.transaction.amount, 0), 100);
  const paidReport = await api(`/reports/${report.data._id}`, { token });
  assert.equal(paidReport.data.paidAmount, 100);
  assert.equal(paidReport.data.pendingAmount, 0);
  assert.equal(paidReport.data.paid, true);
  const ledger = await api(`/transactions?reportId=${encodeURIComponent(report.data.reportId)}`, { token });
  assert.equal(ledger.data.reduce((sum, item) => sum + item.amount, 0), 100);

  const doctor = await api('/doctors', {
    token, method: 'POST', body: { name: 'Commission Doctor', commission: 10 },
  });
  assert.equal(doctor.status, 201);
  const duplicateDoctor = await api('/doctors', {
    token, method: 'POST', body: { name: ' commission doctor ', commission: 15 },
  });
  assert.equal(duplicateDoctor.status, 400);
  const referredReport = await api('/reports', {
    token, method: 'POST',
    body: { patient: patient.data._id, doctor: doctor.data.name, test: 'KFT', amount: 100 },
  });
  assert.equal(referredReport.status, 201);
  assert.equal(referredReport.data.commission, 10);
  assert.equal(referredReport.data.commissionPaid, false);

  const racingPayouts = await Promise.all([
    api('/commissions/pay', { token, method: 'POST', body: { doctorId: doctor.data._id, amount: 8 } }),
    api('/commissions/pay', { token, method: 'POST', body: { doctorId: doctor.data._id, amount: 8 } }),
  ]);
  assert.deepEqual(racingPayouts.map((response) => response.status).sort(), [201, 400]);
  const remainingPayout = await api('/commissions', {
    token, method: 'POST', body: { doctorId: doctor.data._id, amount: 2 },
  });
  assert.equal(remainingPayout.status, 201);
  const payouts = await api('/commissions', { token });
  assert.equal(payouts.data.filter((item) => item.doctor === doctor.data.name).reduce((sum, item) => sum + item.amount, 0), 10);
  const payoutRewrite = await api(`/commissions/${remainingPayout.data._id}`, {
    token, method: 'DELETE',
  });
  assert.equal(payoutRewrite.status, 405);

  const renamedDoctor = await api(`/doctors/${doctor.data._id}`, {
    token, method: 'PATCH', body: { name: 'Renamed Commission Doctor' },
  });
  assert.equal(renamedDoctor.status, 200);
  const renamedLedger = await api(`/doctors/${doctor.data._id}/ledger`, { token });
  assert.equal(renamedLedger.status, 200);
  assert.equal(renamedLedger.data.totalReports, 1);
  assert.equal(renamedLedger.data.totalCommission, 10);
  assert.equal(renamedLedger.data.paidCommission, 10);
  const protectedDoctorDelete = await api(`/doctors/${doctor.data._id}`, {
    token, method: 'DELETE',
  });
  assert.equal(protectedDoctorDelete.status, 409);

  const subscriptionBefore = await api('/subscription', { token });
  const previousExpiry = new Date(subscriptionBefore.data.expiresAt).getTime();
  const activations = await Promise.all([
    api('/subscription/subscribe', { token, method: 'POST', body: { planId: 'monthly' } }),
    api('/subscription/subscribe', { token, method: 'POST', body: { planId: 'monthly' } }),
  ]);
  activations.forEach((response) => assert.equal(response.status, 200));
  const subscriptionAfter = await api('/subscription', { token });
  const extendedByDays = (new Date(subscriptionAfter.data.expiresAt).getTime() - previousExpiry) / 86_400_000;
  assert.ok(extendedByDays >= 59.99 && extendedByDays <= 60.01);
  assert.equal(subscriptionAfter.data.history.length, subscriptionBefore.data.history.length + 2);
  assert.equal(new Set(subscriptionAfter.data.history.slice(-2).map((item) => item.invoice)).size, 2);
  const subscriptionLedger = await api('/transactions?type=Subscription', { token });
  assert.equal(subscriptionLedger.data.length, 2);
  assert.equal(new Set(subscriptionLedger.data.map((item) => item.txnId)).size, 2);

  const patientWithReportsDelete = await api(`/patients/${patient.data._id}`, {
    token, method: 'DELETE',
  });
  assert.equal(patientWithReportsDelete.status, 409);
  assert.equal((await api(`/patients/${patient.data._id}`, { token })).status, 200);
});

test('backup restore remaps stable doctor history and commission references', async () => {
  const { token } = await signIn('9665432109');
  const patient = await api('/patients', {
    token, method: 'POST',
    body: { name: 'Doctor History Patient', age: 34, gender: 'Female', mobile: '8765499991' },
  });
  const doctor = await api('/doctors', {
    token, method: 'POST', body: { name: 'Backup Doctor', commission: 10 },
  });
  const report = await api('/reports', {
    token, method: 'POST',
    body: { patient: patient.data._id, doctor: doctor.data.name, test: 'CBC', amount: 100 },
  });
  assert.equal(report.status, 201);
  assert.equal(report.data.doctorId, doctor.data._id);
  assert.equal((await api('/commissions/pay', {
    token, method: 'POST', body: { doctorId: doctor.data._id, amount: 4 },
  })).status, 201);

  const exported = await api('/backup/export', { token });
  assert.equal(exported.status, 200);
  const restored = await api('/backup/restore', { token, method: 'POST', body: exported.data });
  assert.equal(restored.status, 200);

  const restoredDoctor = (await api('/doctors', { token })).data
    .find((item) => item.name === 'Backup Doctor');
  const restoredReport = (await api('/reports', { token })).data
    .find((item) => item.reportId === report.data.reportId);
  assert.ok(restoredDoctor);
  assert.ok(restoredReport);
  assert.notEqual(restoredDoctor._id, doctor.data._id);
  assert.equal(restoredReport.doctorId, restoredDoctor._id);
  const ledger = await api(`/doctors/${restoredDoctor._id}/ledger`, { token });
  assert.equal(ledger.status, 200);
  assert.equal(ledger.data.totalReports, 1);
  assert.equal(ledger.data.totalCommission, 10);
  assert.equal(ledger.data.paidCommission, 4);
});

test('concurrent settings and notification mutations preserve account state', async () => {
  const { token } = await signIn('9675432109');
  const settingsWrites = await Promise.all([
    api('/settings', { token, method: 'PATCH', body: { labName: 'Concurrent Lab' } }),
    api('/settings', { token, method: 'PATCH', body: { whatsappNumber: '9876543210' } }),
  ]);
  settingsWrites.forEach((response) => assert.equal(response.status, 200));
  const currentSettings = await api('/settings', { token });
  assert.equal(currentSettings.data.labName, 'Concurrent Lab');
  assert.equal(currentSettings.data.whatsappNumber, '9876543210');

  const patient = await api('/patients', {
    token, method: 'POST',
    body: { name: 'Notification Patient', age: 29, gender: 'Male', mobile: '8765499992' },
  });
  const report = await api('/reports', {
    token, method: 'POST',
    body: { patient: patient.data._id, test: 'Pending CBC', amount: 80 },
  });
  assert.equal(report.status, 201);
  const before = await api('/notifications', { token });
  const pending = before.data.find((item) => item.id === `pay-${report.data._id}`);
  assert.ok(pending);
  const notificationWrites = await Promise.all([
    api(`/notifications/${encodeURIComponent(pending.id)}/read`, { token, method: 'POST' }),
    api('/notifications/read-all', { token, method: 'POST' }),
  ]);
  notificationWrites.forEach((response) => assert.equal(response.status, 200));
  assert.equal((await api('/notifications/count', { token })).data.unread, 0);
});

test('parallel creates and backup restore preserve unique account-scoped sequences', async () => {
  const { token } = await signIn('9765432109');
  const patientResponses = await Promise.all(Array.from({ length: 16 }, (_, index) => api('/patients', {
    token,
    method: 'POST',
    body: {
      name: `Concurrent Patient ${index + 1}`,
      age: 20 + index,
      gender: index % 2 ? 'Female' : 'Male',
      mobile: `87654${String(32000 + index).padStart(5, '0')}`,
    },
  })));
  patientResponses.forEach((response) => assert.equal(response.status, 201));
  const patientIds = patientResponses.map((response) => response.data.pid);
  assert.equal(new Set(patientIds).size, patientIds.length);

  const reportResponses = await Promise.all(patientResponses.map((patient, index) => api('/reports', {
    token,
    method: 'POST',
    body: { patient: patient.data._id, test: `Test ${index + 1}`, amount: 100 + index, status: 'Pending' },
  })));
  reportResponses.forEach((response) => assert.equal(response.status, 201));
  const reportIds = reportResponses.map((response) => response.data.reportId);
  assert.equal(new Set(reportIds).size, reportIds.length);

  // Delete the highest allocated identifiers before export. Sequence state in
  // the backup must still prevent those identifiers from ever being reused.
  const removedReport = reportResponses.at(-1);
  const removedPatient = patientResponses.at(-1);
  assert.equal((await api(`/reports/${removedReport.data._id}`, { token, method: 'DELETE' })).status, 200);
  assert.equal((await api(`/patients/${removedPatient.data._id}`, { token, method: 'DELETE' })).status, 200);

  const exported = await api('/backup/export', { token });
  assert.equal(exported.status, 200);
  assert.ok(exported.data.sequences.patient >= 16);
  assert.ok(exported.data.sequences.report >= 16);
  assert.equal(exported.data.patients.some((item) => item.pid === removedPatient.data.pid), false);
  assert.equal(exported.data.reports.some((item) => item.reportId === removedReport.data.reportId), false);
  const restored = await api('/backup/restore', { token, method: 'POST', body: exported.data });
  assert.equal(restored.status, 200);

  const nextPatient = await api('/patients', {
    token,
    method: 'POST',
    body: { name: 'After Restore', age: 40, gender: 'Other', mobile: '8765499999' },
  });
  assert.equal(nextPatient.status, 201);
  assert.equal(patientIds.includes(nextPatient.data.pid), false);
  const nextReport = await api('/reports', {
    token,
    method: 'POST',
    body: { patient: nextPatient.data._id, test: 'After Restore Test', amount: 200, status: 'Pending' },
  });
  assert.equal(nextReport.status, 201);
  assert.equal(reportIds.includes(nextReport.data.reportId), false);
});

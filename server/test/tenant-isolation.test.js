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
  assert.notEqual(exportA.data.meta.owner, exportB.data.meta.owner);
  assert.deepEqual(exportA.data.patients.map((item) => item.name), ['Account A Patient']);
  assert.deepEqual(exportB.data.patients.map((item) => item.name), ['Account B Patient']);
  assert.equal(JSON.stringify(exportB.data).includes('Account A'), false);

  const crossRestore = await api('/backup/restore', { token: b, method: 'POST', body: exportA.data });
  assert.equal(crossRestore.status, 403);
  assert.equal(crossRestore.data.message, 'This backup belongs to a different account');
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

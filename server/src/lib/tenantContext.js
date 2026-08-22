const { AsyncLocalStorage } = require('async_hooks');

const storage = new AsyncLocalStorage();

function runWithTenant(auth, callback) {
  if (!auth?.id) throw Object.assign(new Error('Authenticated user context is required'), { status: 401 });
  return storage.run({
    id: String(auth.id),
    mobile: auth.mobile ? String(auth.mobile) : '',
    name: auth.name ? String(auth.name) : '',
    role: auth.role ? String(auth.role) : '',
  }, callback);
}

function currentTenant() {
  return storage.getStore() || null;
}

function requireTenantId() {
  const tenant = currentTenant();
  if (!tenant?.id) throw Object.assign(new Error('Authenticated user context is required'), { status: 401 });
  return tenant.id;
}

module.exports = { runWithTenant, currentTenant, requireTenantId };

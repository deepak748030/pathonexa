const mongoose = require('mongoose');
const { requireTenantId } = require('./tenantContext');

function tenantObjectId() {
  const id = requireTenantId();
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error('Invalid authenticated user context'), { status: 401 });
  }
  return new mongoose.Types.ObjectId(id);
}

/**
 * Mandatory row-level ownership for all tenant models.
 *
 * Route code cannot opt out of this scope: supplied ownerId filters are
 * overwritten with the authenticated owner, direct-id queries are scoped,
 * populations inherit the same request context, and aggregates are prefixed
 * with an owner match. This is defense in depth in addition to store-level
 * ownership checks used by the in-memory development adapter.
 */
function tenantPlugin(schema) {
  schema.add({
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      immutable: true,
      index: true,
      select: false,
    },
  });

  const queryHooks = [
    'count', 'countDocuments', 'deleteMany', 'deleteOne', 'find', 'findOne',
    'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate', 'replaceOne',
    'updateMany', 'updateOne',
  ];

  queryHooks.forEach((hook) => {
    schema.pre(hook, function scopeQuery(next) {
      try {
        this.setQuery({ ...this.getQuery(), ownerId: tenantObjectId() });
        next();
      } catch (error) {
        next(error);
      }
    });
  });

  schema.pre('aggregate', function scopeAggregate(next) {
    try {
      this.pipeline().unshift({ $match: { ownerId: tenantObjectId() } });
      next();
    } catch (error) {
      next(error);
    }
  });

  schema.pre('validate', function assignOwner(next) {
    try {
      this.ownerId = tenantObjectId();
      next();
    } catch (error) {
      next(error);
    }
  });

  schema.pre('insertMany', function assignOwners(next, docs) {
    try {
      const ownerId = tenantObjectId();
      docs.forEach((doc) => { doc.ownerId = ownerId; });
      next();
    } catch (error) {
      next(error);
    }
  });
}

module.exports = tenantPlugin;

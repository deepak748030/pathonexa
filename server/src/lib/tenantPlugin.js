const mongoose = require('mongoose');
const { requireTenantId } = require('./tenantContext');

function tenantObjectId() {
  const id = requireTenantId();
  if (!mongoose.isValidObjectId(id)) {
    throw Object.assign(new Error('Invalid authenticated user context'), { status: 401 });
  }
  return new mongoose.Types.ObjectId(id);
}

const SAFE_AGGREGATION_STAGES = new Set([
  '$addFields', '$bucket', '$bucketAuto', '$count', '$densify', '$facet', '$fill',
  '$geoNear', '$group', '$limit', '$match', '$project', '$redact', '$replaceRoot',
  '$replaceWith', '$sample', '$set', '$setWindowFields', '$skip', '$sort',
  '$sortByCount', '$unset', '$unwind',
]);

function assertSafePipeline(pipeline, allowGeoNear = true) {
  if (!Array.isArray(pipeline)) throw new Error('Invalid tenant aggregation pipeline');
  pipeline.forEach((stage, index) => {
    const names = stage && typeof stage === 'object' && !Array.isArray(stage) ? Object.keys(stage) : [];
    const name = names[0];
    if (names.length !== 1 || !SAFE_AGGREGATION_STAGES.has(name) || (name === '$geoNear' && (!allowGeoNear || index !== 0))) {
      throw Object.assign(new Error('Unsafe tenant aggregation stage is not allowed'), { status: 400 });
    }
    if (name === '$facet') {
      const facets = stage.$facet;
      if (!facets || typeof facets !== 'object' || Array.isArray(facets)) {
        throw Object.assign(new Error('Unsafe tenant aggregation stage is not allowed'), { status: 400 });
      }
      Object.values(facets).forEach((nestedPipeline) => assertSafePipeline(nestedPipeline, false));
    }
  });
}

function isOwnerPath(value) {
  return value === 'ownerId' || String(value).startsWith('ownerId.');
}

function scopeUpdate(update, ownerId, replacement = false) {
  if (Array.isArray(update)) return [...update, { $set: { ownerId } }];
  if (!update || typeof update !== 'object') return update;
  if (replacement) return { ...update, ownerId };

  const scoped = {};
  const directSet = {};
  Object.entries(update).forEach(([operator, value]) => {
    if (!operator.startsWith('$')) {
      if (!isOwnerPath(operator)) directSet[operator] = value;
      return;
    }
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      scoped[operator] = value;
      return;
    }
    const sanitized = {};
    Object.entries(value).forEach(([path, operand]) => {
      if (isOwnerPath(path)) return;
      if (operator === '$rename' && isOwnerPath(operand)) return;
      sanitized[path] = operand;
    });
    if (Object.keys(sanitized).length) scoped[operator] = sanitized;
  });
  scoped.$set = { ...directSet, ...(scoped.$set || {}), ownerId };
  return scoped;
}

/**
 * Mandatory row-level ownership for all tenant models.
 *
 * Route code cannot opt out of this scope: supplied ownerId filters are
 * overwritten with the authenticated owner, direct-id queries are scoped,
 * populations inherit the same request context, and safe aggregates are
 * owner-scoped before tenant records can be returned. This is defense in depth
 * in addition to store-level ownership checks used by the in-memory adapter.
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
    'count', 'countDocuments', 'deleteMany', 'deleteOne', 'distinct', 'find', 'findOne',
    'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate', 'replaceOne',
    'updateMany', 'updateOne',
  ];

  queryHooks.forEach((hook) => {
    schema.pre(hook, function scopeQuery(next) {
      try {
        const ownerId = tenantObjectId();
        this.setQuery({ ...this.getQuery(), ownerId });
        if (typeof this.getUpdate === 'function' && this.getUpdate()) {
          const replacement = hook === 'replaceOne' || hook === 'findOneAndReplace';
          this.setUpdate(scopeUpdate(this.getUpdate(), ownerId, replacement));
          // ownerId is immutable to ordinary callers. This controlled override
          // lets the plugin retain the authenticated owner after Mongoose casts
          // replacements and modifier updates.
          this.setOptions({ overwriteImmutable: true });
        }
        next();
      } catch (error) {
        next(error);
      }
    });
  });

  schema.pre('estimatedDocumentCount', function rejectUnscopedCount(next) {
    next(Object.assign(new Error('Unscoped tenant count is not allowed'), { status: 400 }));
  });

  schema.pre('aggregate', function scopeAggregate(next) {
    try {
      const pipeline = this.pipeline();
      const ownerId = tenantObjectId();
      // Use an allowlist rather than trying to enumerate every dangerous
      // MongoDB stage. Unknown future stages therefore fail closed instead of
      // gaining cross-collection, write, search-metadata, or system access.
      assertSafePipeline(pipeline);

      // MongoDB requires $geoNear to remain first, so scope it inside the
      // stage. All ordinary pipelines are owner-filtered before processing.
      if (pipeline[0]?.$geoNear) {
        pipeline[0].$geoNear.query = { ...(pipeline[0].$geoNear.query || {}), ownerId };
      } else {
        pipeline.unshift({ $match: { ownerId } });
      }
      next();
    } catch (error) {
      next(error);
    }
  });

  schema.pre('bulkWrite', function scopeBulkWrite(next, operations) {
    try {
      const ownerId = tenantObjectId();
      operations.forEach((operation) => {
        if (operation.insertOne?.document) operation.insertOne.document.ownerId = ownerId;
        if (operation.replaceOne) {
          operation.replaceOne.filter = { ...(operation.replaceOne.filter || {}), ownerId };
          operation.replaceOne.replacement = scopeUpdate(operation.replaceOne.replacement, ownerId, true);
        }
        ['updateOne', 'updateMany', 'deleteOne', 'deleteMany'].forEach((name) => {
          if (!operation[name]) return;
          operation[name].filter = { ...(operation[name].filter || {}), ownerId };
          if (operation[name].update) {
            operation[name].update = scopeUpdate(operation[name].update, ownerId);
            operation[name].overwriteImmutable = true;
          }
        });
      });
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

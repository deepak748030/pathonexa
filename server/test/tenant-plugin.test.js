const assert = require('node:assert/strict');
const test = require('node:test');
const mongoose = require('mongoose');

process.env.NODE_ENV = 'test';
process.env.ALLOW_IN_MEMORY = 'true';

const Patient = require('../src/models/Patient');
const User = require('../src/models/User');
const OtpChallenge = require('../src/models/OtpChallenge');
const tenantPlugin = require('../src/lib/tenantPlugin');
const { runWithTenant } = require('../src/lib/tenantContext');

const OWNER_A = '507f1f77bcf86cd799439011';
const OWNER_B = '507f191e810c19729de860ea';
const middlewareOnlySchema = new mongoose.Schema({ ownerId: mongoose.Schema.Types.ObjectId });
middlewareOnlySchema.plugin(tenantPlugin);

function runPre(schemaOrModel, hook, context, args = []) {
  const schema = schemaOrModel.schema || schemaOrModel;
  return new Promise((resolve, reject) => {
    schema.s.hooks.execPre(hook, context, args, (error) => (error ? reject(error) : resolve()));
  });
}

function asTenant(id, callback) {
  return runWithTenant({ id, mobile: '9876543210', role: 'Lab Owner' }, callback);
}

function assertOwner(value, expected = OWNER_A) {
  assert.ok(value instanceof mongoose.Types.ObjectId);
  assert.equal(String(value), expected);
}

function hasIndex(model, key, option, expected) {
  return model.schema.indexes().some(([keys, options]) => keys[key] === 1 && options[option] === expected);
}

test('authentication models declare unique account/challenge and expiring challenge indexes', () => {
  assert.equal(hasIndex(User, 'mobile', 'unique', true), true);
  assert.equal(hasIndex(OtpChallenge, 'mobile', 'unique', true), true);
  assert.equal(hasIndex(OtpChallenge, 'expiresAt', 'expireAfterSeconds', 0), true);
});

test('tenant query middleware overwrites caller-supplied ownership on every query family', async () => {
  await asTenant(OWNER_A, async () => {
    const queryHooks = [
      'count', 'countDocuments', 'deleteMany', 'deleteOne', 'distinct', 'find', 'findOne',
      'findOneAndDelete', 'findOneAndReplace', 'findOneAndUpdate', 'replaceOne',
      'updateMany', 'updateOne',
    ];

    for (const hook of queryHooks) {
      let filter = { ownerId: OWNER_B, name: 'Patient' };
      const query = {
        getQuery: () => filter,
        setQuery: (nextFilter) => { filter = nextFilter; },
      };
      await runPre(middlewareOnlySchema, hook, query);
      assertOwner(filter.ownerId);
      assert.equal(filter.name, 'Patient');
    }
  });
});

test('tenant update middleware prevents ownership changes in modifiers, replacements, and pipelines', async () => {
  await asTenant(OWNER_A, async () => {
    let update = {
      ownerId: OWNER_B,
      name: 'Changed',
      $set: { ownerId: OWNER_B, city: 'Indore' },
      $unset: { ownerId: 1, mobile: 1 },
      $rename: { name: 'ownerId', age: 'years' },
    };
    let filter = { ownerId: OWNER_B };
    const modifierQuery = {
      getQuery: () => filter,
      setQuery: (next) => { filter = next; },
      getUpdate: () => update,
      setUpdate: (next) => { update = next; },
      setOptions: (next) => { modifierQuery.options = { ...(modifierQuery.options || {}), ...next }; },
    };
    await runPre(middlewareOnlySchema, 'updateOne', modifierQuery);
    assertOwner(filter.ownerId);
    assertOwner(update.$set.ownerId);
    assert.equal(update.$set.name, 'Changed');
    assert.equal(update.$set.city, 'Indore');
    assert.equal(update.$unset.ownerId, undefined);
    assert.equal(update.$unset.mobile, 1);
    assert.equal(update.$rename.name, undefined);
    assert.equal(update.$rename.age, 'years');
    assert.equal(update.ownerId, undefined);
    assert.equal(modifierQuery.options.overwriteImmutable, true);

    // Exercise Mongoose's real casting step after the tenant middleware. This
    // guards against immutable-path stripping reintroducing an ownership hole.
    const castModifierQuery = Patient.updateOne({}, update).setOptions(modifierQuery.options);
    const castModifier = castModifierQuery._castUpdate(update);
    assertOwner(castModifier.$set.ownerId);
    assert.equal(castModifier.$unset.ownerId, undefined);
    assert.equal(castModifier.$unset.mobile, 1);

    update = [{ $replaceWith: { ownerId: OWNER_B, name: 'Changed' } }];
    await runPre(middlewareOnlySchema, 'findOneAndUpdate', modifierQuery);
    assert.equal(update.length, 2);
    assertOwner(update[1].$set.ownerId);

    update = { ownerId: OWNER_B, name: 'Replacement' };
    await runPre(middlewareOnlySchema, 'replaceOne', modifierQuery);
    assertOwner(update.ownerId);
    assert.equal(update.name, 'Replacement');
    const castReplacementQuery = Patient.replaceOne({}, update).setOptions(modifierQuery.options);
    const castReplacement = castReplacementQuery._castUpdate(update);
    assertOwner(castReplacement.$set.ownerId);
  });

  await assert.rejects(
    runPre(middlewareOnlySchema, 'estimatedDocumentCount', {}),
    /Unscoped tenant count is not allowed/,
  );
});

test('tenant document, insertMany, and bulkWrite middleware force authenticated ownership', async () => {
  await asTenant(OWNER_A, async () => {
    const patient = new Patient({
      ownerId: OWNER_B,
      pid: 'PT260822001',
      name: 'Patient',
      age: 30,
      gender: 'Male',
      mobile: '9876543210',
    });
    await patient.validate();
    assertOwner(patient.ownerId);

    const inserted = [{ ownerId: OWNER_B, pid: 'PT260822002' }];
    await runPre(Patient, 'insertMany', Patient, [inserted]);
    assertOwner(inserted[0].ownerId);

    const operations = [
      { insertOne: { document: { ownerId: OWNER_B, pid: 'PT260822003' } } },
      { updateOne: { filter: { ownerId: OWNER_B }, update: { $set: { ownerId: OWNER_B, name: 'Changed' } } } },
      { updateMany: { filter: { ownerId: OWNER_B }, update: [{ $unset: 'ownerId' }] } },
      { deleteOne: { filter: { ownerId: OWNER_B } } },
      { deleteMany: { filter: { ownerId: OWNER_B } } },
      { replaceOne: { filter: { ownerId: OWNER_B }, replacement: { ownerId: OWNER_B, pid: 'PT260822004' } } },
    ];
    await runPre(Patient, 'bulkWrite', Patient, [operations]);

    assertOwner(operations[0].insertOne.document.ownerId);
    for (const operation of operations.slice(1)) {
      const details = Object.values(operation)[0];
      assertOwner(details.filter.ownerId);
      if (details.replacement) assertOwner(details.replacement.ownerId);
      if (details.update) {
        const ownerSet = Array.isArray(details.update)
          ? details.update.at(-1).$set.ownerId
          : details.update.$set.ownerId;
        assertOwner(ownerSet);
        assert.equal(details.overwriteImmutable, true);
      }
    }
  });
});

test('tenant aggregation scopes safe pipelines and rejects cross-collection stages', async () => {
  await asTenant(OWNER_A, async () => {
    const ordinary = Patient.aggregate([{ $match: { ownerId: OWNER_B, city: 'Indore' } }, { $count: 'total' }]);
    await runPre(Patient, 'aggregate', ordinary);
    assertOwner(ordinary.pipeline()[0].$match.ownerId);

    const geo = Patient.aggregate([{ $geoNear: { near: { type: 'Point', coordinates: [0, 0] }, distanceField: 'distance', query: { ownerId: OWNER_B } } }]);
    await runPre(Patient, 'aggregate', geo);
    assertOwner(geo.pipeline()[0].$geoNear.query.ownerId);

    const facet = Patient.aggregate([{ $facet: { rows: [{ $sort: { name: 1 } }], totals: [{ $count: 'total' }] } }]);
    await runPre(Patient, 'aggregate', facet);
    assertOwner(facet.pipeline()[0].$match.ownerId);

    const unsafePipelines = [
      [{ $search: { text: { path: 'name', query: 'Patient' } } }, { $limit: 5 }],
      [{ $lookup: { from: 'patients', pipeline: [], as: 'others' } }],
      [{ $unionWith: { coll: 'patients' } }],
      [{ $facet: { rows: [{ $lookup: { from: 'patients', pipeline: [], as: 'others' } }] } }],
      [{ $facet: { rows: [{ $listSearchIndexes: {} }] } }],
      [{ $listSearchIndexes: {} }],
      [{ $merge: { into: 'patients' } }],
    ];
    for (const pipeline of unsafePipelines) {
      const aggregate = Patient.aggregate(pipeline);
      await assert.rejects(runPre(Patient, 'aggregate', aggregate), /Unsafe tenant aggregation stage/);
    }
  });
});

test('tenant middleware fails closed without authenticated request context', async () => {
  const query = Patient.find({ name: 'Patient' });
  await assert.rejects(runPre(Patient, 'find', query), /Authenticated user context is required/);

  const patient = new Patient({ pid: 'PT260822005', name: 'Patient', age: 30, gender: 'Male', mobile: '9876543210' });
  await assert.rejects(patient.validate(), /Authenticated user context is required/);
});

'use strict';

const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const express = require('express');
const JWT = require('jsonwebtoken');
const { generateKeyPairSync } = require('node:crypto');
const { MongoMemoryReplSet } = require('mongodb-memory-server');
const User = require('../src/models/user.model');
const Shop = require('../src/models/shop.model');
const { keyTokenUserModel: KeyToken } = require('../src/models/keytokenuser.model');

let database, server, base, admin, buyer;
let counter = 0;
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});
async function account(roles = ['USER']) {
  const user = await User.create({ name: `Person ${++counter}`, email: `person${counter}@example.test`, password: 'NEVER_RETURN_THIS', roles });
  const accessToken = JWT.sign({ userId: String(user._id), email: user.email }, privateKey, { algorithm: 'RS256', expiresIn: '1h' });
  await KeyToken.create({ userId: user._id, publicKey, privateKey, accessToken, refreshToken: `test-${counter}` });
  return { user, headers: { 'x-client-id': String(user._id), authorization: accessToken } };
}
async function application(name = 'Demo store') {
  const owner = await account();
  const shop = await Shop.create({ ownerId: owner.user._id, name, slug: `shop-${++counter}` });
  return { owner, shop };
}
async function request(path, { actor = admin, method = 'GET', body } = {}) {
  const response = await fetch(`${base}${path}`, { method, headers: { ...actor?.headers, 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
  return { status: response.status, data: await response.json() };
}
before(async () => {
  database = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await mongoose.connect(database.getUri());
  await Promise.all([User.init(), Shop.init(), KeyToken.init()]);
  const app = express(); app.use(express.json());
  app.use('/admin', require('../src/routes/admin'));
  app.use('/shop', require('../src/routes/shop'));
  app.use((error, req, res, next) => res.status(error.status || 500).json({ message: error.message }));
  server = app.listen(0, '127.0.0.1'); await new Promise((resolve) => server.once('listening', resolve));
  base = `http://127.0.0.1:${server.address().port}`;
  admin = await account(['USER', 'ADMIN']); buyer = await account();
}, { timeout: 180000 });
after(async () => {
  if (server) { server.closeAllConnections(); await new Promise((resolve) => server.close(resolve)); }
  await mongoose.disconnect(); if (database) await database.stop();
});

test('admin endpoints require valid authentication and database ADMIN role', async () => {
  const id = new mongoose.Types.ObjectId();
  for (const [path, method] of [['/admin/me', 'GET'], ['/admin/shops', 'GET'], ['/admin/shops/summary', 'GET'],
    [`/admin/shops/${id}`, 'GET'], [`/admin/shops/${id}/approve`, 'PATCH'], [`/admin/shops/${id}/reject`, 'PATCH']]) {
    assert.equal((await request(path, { actor: null, method })).status, 401);
    assert.equal((await request(path, { actor: buyer, method })).status, 403);
  }
  const me = await request('/admin/me'); assert.equal(me.status, 200);
  assert.equal(me.data.metadata.email, admin.user.email);
  assert.equal(JSON.stringify(me.data).includes('NEVER_RETURN_THIS'), false);
  await User.updateOne({ _id: admin.user._id }, { $pull: { roles: 'ADMIN' } });
  assert.equal((await request('/admin/me')).status, 403);
  await User.updateOne({ _id: admin.user._id }, { $addToSet: { roles: 'ADMIN' } });
});
test('literal search, status filtering, pagination, summary and safe populated details', async () => {
  const { shop } = await application('Literal .* shop'); await application('Other shop');
  const found = await request('/admin/shops?q=.*&status=pending&limit=1');
  assert.equal(found.status, 200); assert.equal(found.data.metadata.total, 1);
  assert.equal(found.data.metadata.items[0]._id, String(shop._id));
  assert.deepEqual(Object.keys(found.data.metadata.items[0].ownerId).sort(), ['_id', 'email', 'name']);
  const detail = await request(`/admin/shops/${shop._id}`); assert.equal(detail.status, 200);
  assert.equal(detail.data.metadata.name, shop.name);
  assert.equal(/password|accessToken|refreshToken|privateKey|publicKey/.test(JSON.stringify(detail.data)), false);
  assert.equal((await request('/admin/shops?limit=500')).data.metadata.limit, 100);
  const page = await request('/admin/shops?status=all&limit=1&page=2'); assert.equal(page.data.metadata.items.length, 1);
  assert.equal((await request('/admin/shops/summary')).data.metadata.pending, await Shop.countDocuments({ status: 'pending' }));
  assert.equal((await request('/admin/shops?status=bad')).status, 400);
  for (const query of ['page[]=1', 'limit[]=20', 'page[toString]=1', 'limit[toString]=20', 'q[x]=test', 'status[]=pending', 'page=9007199254740991&limit=100']) {
    assert.equal((await request(`/admin/shops?${query}`)).status, 400);
  }
  assert.equal((await request('/admin/shops/nope')).status, 400);
  assert.equal((await request(`/admin/shops/${new mongoose.Types.ObjectId()}`)).status, 404);
});
test('approval grants SHOP and only pending shops can be reviewed', async () => {
  const { owner, shop } = await application();
  assert.equal((await request(`/admin/shops/${shop._id}/approve`, { actor: buyer, method: 'PATCH' })).status, 403);
  assert.equal((await request(`/admin/shops/${shop._id}/approve`, { method: 'PATCH' })).status, 200);
  assert.ok((await User.findById(owner.user._id)).roles.includes('SHOP'));
  const updated = await Shop.findById(shop._id);
  assert.equal(updated.status, 'active'); assert.equal(String(updated.reviewedBy), String(admin.user._id)); assert.ok(updated.reviewedAt);
  assert.equal((await request(`/admin/shops/${shop._id}/reject`, { method: 'PATCH', body: { reason: 'No' } })).status, 409);
});
test('rejection validates reason and exposes it to the owner without granting SHOP', async () => {
  const { owner, shop } = await application();
  const path = `/admin/shops/${shop._id}/reject`;
  for (const reason of [undefined, null, {}, 123, '  ', 'x'.repeat(501)]) {
    assert.equal((await request(path, { method: 'PATCH', body: { reason } })).status, 400);
  }
  assert.equal((await request(path, { method: 'PATCH', body: { reason: '  Missing details  ' } })).status, 200);
  assert.equal((await request('/shop/me', { actor: owner })).data.metadata.rejectionReason, 'Missing details');
  assert.equal((await User.findById(owner.user._id)).roles.includes('SHOP'), false);
  const detail = (await request(`/admin/shops/${shop._id}`)).data.metadata;
  assert.deepEqual(Object.keys(detail.reviewedBy).sort(), ['_id', 'email', 'name']);
  assert.equal(detail.reviewedBy._id, String(admin.user._id));
  assert.ok(detail.reviewedAt);
});

test('old reviews without a reason remain readable and invalid review IDs use 400 or 404', async () => {
  const { shop } = await application('Legacy review');
  await Shop.collection.updateOne({ _id: shop._id }, { $set: { status: 'rejected' }, $unset: { rejectionReason: '' } });
  const legacy = await request(`/admin/shops/${shop._id}`);
  assert.equal(legacy.status, 200); assert.equal(legacy.data.metadata.rejectionReason, undefined);
  for (const action of ['approve', 'reject']) {
    assert.equal((await request(`/admin/shops/invalid/${action}`, { method: 'PATCH', body: { reason: 'No' } })).status, 400);
    assert.equal((await request(`/admin/shops/${new mongoose.Types.ObjectId()}/${action}`, { method: 'PATCH', body: { reason: 'No' } })).status, 404);
  }
});
test('a failed owner save rolls back the shop approval transaction', async () => {
  const { owner, shop } = await application();
  // Simulate pre-existing invalid account data: owner.save must fail validation after shop.save.
  await User.collection.updateOne({ _id: owner.user._id }, { $unset: { password: '' } });
  assert.equal((await request(`/admin/shops/${shop._id}/approve`, { method: 'PATCH' })).status, 500);
  const unchanged = await Shop.findById(shop._id);
  assert.equal(unchanged.status, 'pending'); assert.equal(unchanged.reviewedAt, null);
  assert.equal((await User.findById(owner.user._id)).roles.includes('SHOP'), false);
});
test('two simultaneous reviewers yield one success and one conflict', async () => {
  const { owner, shop } = await application();
  const otherAdmin = await account(['ADMIN']);
  const results = await Promise.all([
    request(`/admin/shops/${shop._id}/approve`, { method: 'PATCH' }),
    request(`/admin/shops/${shop._id}/reject`, { actor: otherAdmin, method: 'PATCH', body: { reason: 'Declined' } }),
  ]);
  assert.deepEqual(results.map((result) => result.status).sort(), [200, 409]);
  const current = await Shop.findById(shop._id);
  assert.equal((await User.findById(owner.user._id)).roles.includes('SHOP'), current.status === 'active');
});

'use strict';

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const userModel = require('../models/user.model');
const { mergeRoles } = require('../auth/roles');

const run = async () => {
  const { ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME = 'Administrator', MONGODB_URI } = process.env;
  if (!ADMIN_EMAIL || !ADMIN_PASSWORD || !MONGODB_URI) throw new Error('ADMIN_EMAIL, ADMIN_PASSWORD, and MONGODB_URI are required');
  await mongoose.connect(MONGODB_URI);
  const existing = await userModel.findOne({ email: ADMIN_EMAIL });
  if (existing) {
    existing.roles = mergeRoles(existing.roles, 'ADMIN');
    await existing.save();
  } else {
    await userModel.create({ name: ADMIN_NAME, email: ADMIN_EMAIL, password: await bcrypt.hash(ADMIN_PASSWORD, 10), roles: ['USER', 'ADMIN'] });
  }
  await mongoose.disconnect();
};

run().catch(async (error) => { console.error(error.message); await mongoose.disconnect(); process.exitCode = 1; });

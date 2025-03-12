"use strict";

const { Types, isValidObjectId, Schema } = require("mongoose");
const keytokenuserModel = require("../models/keytokenuser.model");

class KeyTokenService {
  static createKeyToken = async ({
    userId,
    publicKey,
    refreshToken,
  }) => {
    try {
      const filter = { userId },
        update = {
          publicKey,
          refreshTokenUsed: [],
          refreshToken,
        },
        options = { upsert: true, new: true };

      const tokens = await keytokenuserModel.findOneAndUpdate(
        filter,
        update,
        options
      );
      return tokens ? tokens.publicKey : null;
    } catch (err) {
      return err;
    }
  };

  static findByUserId = async (userId) => {
    return await keytokenuserModel.findOne({userId: new Types.ObjectId(`${userId}`)}).lean();
  };
  // {userId: Types.ObjectId.createFromHexString(id)}
  static removeKeyById = async (id) => {
    return await keytokenuserModel.findByIdAndDelete(id);
  };

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keytokenuserModel.findOne({refreshTokenUsed: refreshToken}).lean();
  };

  static findByRefreshToken = async (refreshToken ) => {
    return await keytokenuserModel.findOne({refreshToken}).lean();
  };

  static deleteKeyByUserId = async (userId) => {
    return await keytokenuserModel.findOneAndDelete({userId: new Types.ObjectId(`${userId}`)});
  }
}
module.exports = KeyTokenService;

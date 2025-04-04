"use strict";

const { Types } = require("mongoose");
const {keyTokenUserModel} = require("../models/keytokenuser.model");

class KeyTokenService {
  static createKeyToken = async ({
    accessToken,
    privateKey,
    userId,
    publicKey,
    refreshToken,
  }) => {
    try {      
      const filter = { userId },
        update = {
          accessToken,
          privateKey,
          publicKey,
          refreshTokenUsed: [],
          refreshToken,
        },
        options = { upsert: true, new: true };

      const tokens = await keyTokenUserModel.findOneAndUpdate(
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
    return await keyTokenUserModel.findOne({userId: new Types.ObjectId(`${userId}`)}).lean();
  };
  static removeKeyById = async (id) => {
    return await keyTokenUserModel.findByIdAndDelete(id);
  };

  static findByRefreshTokenUsed = async (refreshToken) => {
    return await keyTokenUserModel.findOne({refreshTokenUsed: refreshToken}).lean();
  };

  static findByRefreshToken = async (refreshToken ) => {
    return await keyTokenUserModel.findOne({refreshToken});
  };

  static deleteKeyByUserId = async (userId) => {
    return await keyTokenUserModel.findOneAndDelete({userId: new Types.ObjectId(`${userId}`)});
  }
}
module.exports = KeyTokenService;

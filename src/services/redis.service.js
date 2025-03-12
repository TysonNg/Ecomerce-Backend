"use strict";

const redis = require('redis');
const {
  reservationInventory,
} = require("../models/repositories/iventory.repo");
const { BadRequestError } = require("../core/error.responese");
const {promisify} = require ('util')

const redisClient = redis.createClient();

redisClient.on("error", (err) => new BadRequestError("Error", err));


const pexpire = promisify(redisClient.pexpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setnx).bind(redisClient)

const accquireLock = async ({ productId, quantity, cartId }) => {
  const key = `lock_v2025_${productId}`;
  const retryTimes = 10;
  const expireTime = 3000; //3 seconds tam lock

  for (let i = 0; i < retryTimes; i++) {
    //create 1 key
    const result = await setnxAsync(key, expireTime);
    console.log(`result::`, result);
    if (result === true) {
      const isReversation = await reservationInventory({
        productId,
        quantity,
        cartId,
      });
      if (isReversation.modifiedCount) {
        await pexpire(key, expireTime);
        return key;
      }
      return null;
    } else {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }
};

const releaseLock = async (keyLock) => {
  const delAsyncKey = redisClient.del();
  return await delAsyncKey(keyLock);
};

module.exports = {
  accquireLock,
  releaseLock,
};

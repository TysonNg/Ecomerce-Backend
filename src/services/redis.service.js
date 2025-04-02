"use strict";
const redis = require('redis');
const {
  reservationInventory,
} = require("../models/repositories/iventory.repo");
const { BadRequestError } = require("../core/error.responese");
const {promisify} = require ('util')

const redisClient = redis.createClient({
  host: "127.0.0.1",
  port: 6379
});
redisClient.on("connect", () => console.log("Connected to redis successfully!"));

redisClient.on("error", (err) => console.log(err));
;


const pexpire = promisify(redisClient.pexpire).bind(redisClient)
const setnxAsync = promisify(redisClient.setnx).bind(redisClient)

const accquireLock = async ( productId, quantity, cartId ) => {
  const key = `lock_v2025_${productId}`;
  
  const retryTimes = 10;
  const expireTime = 3000; //3 seconds tam lock

  for (let i = 0; i < retryTimes; i++) {
    //create 1 key
    console.log('i', i);
    
    const result = await setnxAsync(key, 'locked');
    console.log(`result::`, result);
    if (result === 1) {
      await pexpire(key,expireTime)
      const isReversation = await reservationInventory({
        productId,
        quantity,
        cartId,
      });
      // console.log('reversation', isReversation);
      
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
  console.log('key ne', keyLock);
  try {
    return await redisClient.del(keyLock)
  } catch (error) {
    console.log("error when delete Key", error);
    
  }
};

module.exports = {
  accquireLock,
  releaseLock,
};

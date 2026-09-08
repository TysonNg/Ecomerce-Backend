"use strict";

require('dotenv').config();
const {
  reservationInventory,
} = require("../models/repositories/iventory.repo");
const Redis = require('ioredis');

let redisClient = null;

try {
  if (process.env.REDIS_URL) {
    redisClient = new Redis(process.env.REDIS_URL, {
      connectTimeout: 2000,
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      retryStrategy: (times) => {
        if (times > 3) return null; // stop retry if server is down
        return Math.min(times * 200, 1000);
      },
    });

    redisClient.on("connect", () =>
      console.log("Connected to redis successfully!")
    );

    redisClient.on("error", (err) =>
      console.log("Redis warning (falling back gracefully):", err.message)
    );
  }
} catch (error) {
  console.log("Redis client init failed:", error.message);
}

const accquireLock = async (productId, quantity, cartId) => {
  const key = `lock_v2025_${productId}`;
  const expireTime = 3000; // 3 seconds lock
  const retryTimes = 10;

  // 1. If Redis is online and ready, try to acquire distributed lock
  if (redisClient && redisClient.status === "ready") {
    for (let i = 0; i < retryTimes; i++) {
      try {
        const result = await redisClient.set(key, "locked", "PX", expireTime, "NX");
        if (result === "OK") {
          const isReservation = await reservationInventory({
            productId,
            quantity,
            cartId,
          });

          if (isReservation && isReservation.modifiedCount) {
            return key;
          }
          await redisClient.del(key);
          return null;
        }
      } catch (err) {
        console.log("Redis lock error:", err.message);
        break; // Break and fall back to database reservation
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  // 2. Graceful Fallback: Directly reserve inventory in MongoDB if Redis is offline/unreachable
  try {
    const isReservation = await reservationInventory({
      productId,
      quantity,
      cartId,
    });

    if (isReservation && isReservation.modifiedCount) {
      return `db_lock_${productId}`;
    }
  } catch (err) {
    console.error("reservationInventory error:", err.message);
  }

  return null;
};

const releaseLock = async (keyLock) => {
  if (!keyLock || keyLock.startsWith("db_lock_")) return;
  try {
    if (redisClient && redisClient.status === "ready") {
      return await redisClient.del(keyLock);
    }
  } catch (error) {
    console.log("Error releasing Redis key:", error.message);
  }
};

module.exports = {
  accquireLock,
  releaseLock,
};

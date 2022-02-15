// import IORedis, { Redis, RedisOptions } from 'ioredis';
//
// import * as config from '../config/config';
// import { logger } from './logger';

/*
 * Check whether the maxmemory-policy config is set to noeviction
 *
 * BullMQ requires this setting in redis
 * For details, see: https://docs.bullmq.io/guide/connections
 */

// export const isMaxMemoryPolicyNoEviction = async (): Promise<boolean> => {
//   let redis: Redis | undefined;
//
//   try {
//     redis = new IORedis(redisOptions as RedisOptions);
//
//     const maxmemoryPolicyConfig = await (redis as Redis).config('GET', 'maxmemory-policy');
//
//     if (
//       maxmemoryPolicyConfig.length == 2 &&
//       'maxmemory-policy' === maxmemoryPolicyConfig[0] &&
//       'noeviction' === maxmemoryPolicyConfig[1]
//     ) {
//       return true;
//     }
//   } finally {
//     if (redis != undefined) {
//       redis.disconnect();
//     }
//   }
//
//   return false;
// };

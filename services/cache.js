const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');

const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);
const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function (options = {}) {
  this.useCache = true;
  this.cacheKey = JSON.stringify(options.key || '');
  return this;
};

mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });
  let cachedValue = await client.hget(this.cachedKey, key);
  cachedValue = JSON.parse(cachedValue);

  if (cachedValue) {
    return Array.isArray(cachedValue)
      ? cachedValue.map((d) => new this.model(d))
      : new this.model(cachedValue);
  }

  const result = await exec.apply(this, arguments);
  client.hset(this.cacheKey, key, JSON.stringify(result));
  return result;
};

module.exports = {
  clearCache(cacheKey) {
    client.del(JSON.stringify(cacheKey));
  },
};

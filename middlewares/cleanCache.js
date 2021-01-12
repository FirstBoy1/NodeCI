const { clearCache } = require('../services/cache');

module.exports = {
  async cleanCache(req, res, next) {
    await next();
    clearCache(req.user.id);
  },
};

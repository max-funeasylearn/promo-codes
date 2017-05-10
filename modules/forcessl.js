'user strict';

module.exports = function() {
  return function forceSSL(req, res, next) {
    var FORCE_HTTPS = process.env.FORCE_HTTPS || false;
    if (req.headers['x-forwarded-proto'] !== 'https' && FORCE_HTTPS) {
      console.log('redirecting to HTTPS: '+['https://', req.get('Host'), req.url].join(''));
      return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
  };
};

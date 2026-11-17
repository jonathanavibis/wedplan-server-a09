const jwt = require('jsonwebtoken');

const signToken = (payload, expiresIn = '7d') => {
  return jwt.sign(payload, process.env.JWT_SECRET || 'wedplan_jwt_secret_key', {
    expiresIn,
  });
};

const verifyTokenPayload = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET || 'wedplan_jwt_secret_key');
};

module.exports = {
  signToken,
  verifyTokenPayload,
};

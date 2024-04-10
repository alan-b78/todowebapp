// bcryptUtils.js
const bcrypt = require('bcrypt');

const saltRounds = 10;

function hashPassword(password) {
  return bcrypt.hashSync(password, saltRounds);
}

function comparePasswords(password, hashedPassword) {
  return bcrypt.compareSync(password, hashedPassword);
}

module.exports = {
  hashPassword,
  comparePasswords,
};
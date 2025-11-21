// Root-level DB re-export so tests requiring '../../db' from Back/tests resolve correctly
module.exports = require('./Back/db');

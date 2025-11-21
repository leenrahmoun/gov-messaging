// Root-level server re-export for Jest test resolution
// This file keeps tests that `require('../../server')` working without changing tests.
module.exports = require('./Back/server');

/**
 * =====================================================================
 * database.schema.js
 * Direct connection & schema loader for XAMPP MySQL database 'library_portal'
 * =====================================================================
 */

module.exports = require('./db');

if (require.main === module) {
  require('./db');
}

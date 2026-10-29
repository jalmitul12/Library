/**
 * Library Book Lending Management System - Server
 * College Practical Examination
 *
 * Technology: Pure Node.js (http module) + MySQL2 (prepared statements)
 * Express.js and external routing frameworks are strictly NOT used.
 *
 * Reference documentation:
 * Node.js: https://nodejs.org/docs/latest/api/
 * HTTP module: https://nodejs.org/docs/latest/api/http.html
 * File system: https://nodejs.org/docs/latest/api/fs.html
 * Path module: https://nodejs.org/docs/latest/api/path.html
 * MySQL2: https://sidorares.github.io/node-mysql2/
 * MySQL prepared statements:
 * https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

/*
 * DATABASE CONNECTION POOL
 *
 * References:
 * MySQL2 connection pools:
 * https://sidorares.github.io/node-mysql2/docs
 *
 * MySQL CREATE DATABASE:
 * https://dev.mysql.com/doc/refman/8.4/en/create-database.html
 *
 * Node.js environment variables:
 * https://nodejs.org/docs/latest/api/environment_variables.html
 */

// Database connection pool & XAMPP MySQL configuration (from db.js / database.schema)
const { pool, dbConfig, testConnection } = require('./db');

// Allowed Categories and Statuses
const VALID_CATEGORIES = ['Fiction', 'Science', 'Technology', 'History', 'Other'];
const VALID_STATUSES = ['Available', 'Issued'];

/*
 * CANONICAL BOOK DATA
 *
 * Reference:
 * JavaScript arrays:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
 */

// Canonical 6 books dataset
const CANONICAL_BOOKS = [
  ['Clean Code: A Handbook of Agile Software Craftsmanship', 'Robert C. Martin', 'TECH-101', 'Technology', 2008, 'Available', 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/'],
  ['Computer Networks: A Systems Approach', 'Larry L. Peterson', 'TECH-104', 'Technology', 2011, 'Issued', 'https://www.goonebook.in/wp-content/uploads/2021/09/Computer-Networks.jpg'],
  ['To Kill a Mockingbird', 'Harper Lee', 'FIC-201', 'Fiction', 1960, 'Available', 'https://images.isbndb.com/covers/30/23/9780061120084.jpg'],
  ['1984', 'George Orwell', 'FIC-202', 'Fiction', 1949, 'Issued', 'https://images.isbndb.com/covers/37/08/9780451524935.jpg'],
  ['Cosmos', 'Carl Sagan', 'SCI-302', 'Science', 1980, 'Available', 'https://images.isbndb.com/covers/71/61/9780345539436.jpg'],
  ['Sapiens: A Brief History of Humankind', 'Yuval Noah Harari', 'HIST-401', 'History', 2014, 'Issued', 'https://images.isbndb.com/covers/16/91/9780062316096.jpg']
];

/*
 * SYNCHRONIZE CANONICAL BOOKS
 *
 * References:
 * MySQL INSERT:
 * https://dev.mysql.com/doc/refman/8.4/en/insert.html
 *
 * MySQL ON DUPLICATE KEY UPDATE:
 * https://dev.mysql.com/doc/refman/8.4/en/insert-on-duplicate.html
 *
 * MySQL DELETE:
 * https://dev.mysql.com/doc/refman/8.4/en/delete.html
 *
 * Async functions:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
 */

async function syncCanonicalBooks() {
  try {
    const [rows] = await pool.query('SELECT COUNT(*) AS count FROM books');
    const count = Number(rows[0] ? rows[0].count : 0);
    if (count !== 6) {
      const allowedCodes = CANONICAL_BOOKS.map(b => b[2]);
      await pool.query('DELETE FROM books WHERE book_code NOT IN (?, ?, ?, ?, ?, ?)', allowedCodes);

      for (const b of CANONICAL_BOOKS) {
        try {
          await pool.execute(
            `INSERT INTO books (title, author, book_code, category, publication_year, status, image_url)
             VALUES (?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE 
               title = VALUES(title),
               author = VALUES(author),
               category = VALUES(category),
               publication_year = VALUES(publication_year),
               status = VALUES(status),
               image_url = VALUES(image_url)`,
            b
          );
        } catch (colErr) {
          if (colErr.code === 'ER_BAD_FIELD_ERROR') {
            await pool.execute(
              `INSERT INTO books (title, author, book_code, category, publication_year, status)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE 
                 title = VALUES(title),
                 author = VALUES(author),
                 category = VALUES(category),
                 publication_year = VALUES(publication_year),
                 status = VALUES(status)`,
              b.slice(0, 6)
            );
          }
        }
      }
    }
  } catch (err) {
    // Database offline or pending creation
  }
}

/*
 * JSON RESPONSE HELPER
 *
 * References:
 * Node.js HTTP response:
 * https://nodejs.org/docs/latest/api/http.html#class-httpserverresponse
 *
 * JSON.stringify():
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
 *
 * HTTP status codes:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status
 *
 * CORS:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS
 */

/**
 * Helper to send JSON response with CORS headers
 */
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

/*
 * REQUEST BODY PARSER
 *
 * References:
 * Node.js request events:
 * https://nodejs.org/docs/latest/api/http.html#class-httpincomingmessage
 *
 * Promises:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise
 *
 * JSON.parse():
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
 */

/**
 * Helper to parse request body safely (max 1MB)
 */
function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    const maxLimit = 1024 * 1024; // 1MB

    req.on('data', chunk => {
      body += chunk;
      if (body.length > maxLimit) {
        reject(new Error('Payload too large'));
        req.destroy();
      }
    });

    req.on('end', () => {
      if (!body.trim()) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        reject(new Error('Invalid JSON format'));
      }
    });

    req.on('error', err => reject(err));
  });
}

/*
 * INPUT VALIDATION
 *
 * References:
 * JavaScript regular expressions:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
 *
 * Array.includes():
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/includes
 *
 * Number.isInteger():
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isInteger
 *
 * Input validation overview:
 * https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Forms/Form_validation
 */

/**
 * Validate book payload fields
 */
function validateBookPayload(data, isPartial = false) {
  const errors = [];
  const currentYear = new Date().getFullYear();

  if (!isPartial || data.title !== undefined) {
    if (!data.title || typeof data.title !== 'string' || !data.title.trim()) {
      errors.push('Title is required and must not be empty.');
    } else if (data.title.trim().length > 150) {
      errors.push('Title must not exceed 150 characters.');
    }
  }

  if (!isPartial || data.author !== undefined) {
    if (!data.author || typeof data.author !== 'string' || !data.author.trim()) {
      errors.push('Author is required and must not be empty.');
    } else if (data.author.trim().length > 100) {
      errors.push('Author must not exceed 100 characters.');
    }
  }

  if (!isPartial || data.book_code !== undefined) {
    if (!data.book_code || typeof data.book_code !== 'string' || !data.book_code.trim()) {
      errors.push('Book code / ISBN is required.');
    } else if (!/^[A-Za-z0-9-]+$/.test(data.book_code.trim())) {
      errors.push('Book code must contain only alphanumeric characters and hyphens.');
    } else if (data.book_code.trim().length > 30) {
      errors.push('Book code must not exceed 30 characters.');
    }
  }

  if (!isPartial || data.category !== undefined) {
    if (!data.category || !VALID_CATEGORIES.includes(data.category)) {
      errors.push(`Category must be one of: ${VALID_CATEGORIES.join(', ')}.`);
    }
  }

  if (!isPartial || data.publication_year !== undefined) {
    if (data.publication_year !== null && data.publication_year !== '' && data.publication_year !== undefined) {
      const year = Number(data.publication_year);
      if (!Number.isInteger(year) || year < 1000 || year > currentYear + 1) {
        errors.push(`Publication year must be a valid 4-digit year between 1000 and ${currentYear + 1}.`);
      }
    }
  }

  if (!isPartial || data.status !== undefined) {
    if (data.status && !VALID_STATUSES.includes(data.status)) {
      errors.push(`Status must be either 'Available' or 'Issued'.`);
    }
  }

  return errors;
}

/*
 * STATIC FILE SERVER
 *
 * References:
 * Node.js path module:
 * https://nodejs.org/docs/latest/api/path.html
 *
 * Node.js file system:
 * https://nodejs.org/docs/latest/api/fs.html
 *
 * MIME types:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/MIME_types
 *
 * HTTP content types:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Content-Type
 */

/**
 * Serve static assets from public/ folder with secure path traversal prevention
 */
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\//, '');
  const filePath = path.normalize(path.join(PUBLIC_DIR, relativePath));

  // Security check: ensure file path is inside PUBLIC_DIR
  if (!filePath.startsWith(PUBLIC_DIR)) {
    sendJson(res, 403, { success: false, message: 'Forbidden' });
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      sendJson(res, 404, { success: false, message: 'Resource not found' });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      '.html': 'text/html; charset=utf-8',
      '.css': 'text/css; charset=utf-8',
      '.js': 'text/javascript; charset=utf-8',
      '.json': 'application/json; charset=utf-8',
      '.png': 'image/png',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.svg': 'image/svg+xml',
      '.ico': 'image/x-icon'
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    fs.createReadStream(filePath).pipe(res);
  });
}

/*
 * MAIN HTTP SERVER
 *
 * References:
 * Node.js HTTP server:
 * https://nodejs.org/docs/latest/api/http.html#httpcreateserveroptions-requestlistener
 *
 * URL and URLSearchParams:
 * https://developer.mozilla.org/en-US/docs/Web/API/URL
 * https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
 *
 * HTTP request methods:
 * https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods
 */

/**
 * Main HTTP Server Request Listener
 */
const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    res.end();
    return;
  }

  const reqUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = reqUrl.pathname;
  const method = req.method.toUpperCase();

  try {
    // -------------------------------------------------------------
    // Route: GET /api/health
    //
    // Reference:
    // MySQL SELECT:
    // https://dev.mysql.com/doc/refman/8.4/en/select.html
    // -------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/health') {
      try {
        const [dbCheck] = await pool.query('SELECT 1 AS ok');
        return sendJson(res, 200, {
          success: true,
          status: 'UP',
          server: 'Node.js Native HTTP',
          database: 'MySQL Connected',
          database_name: dbConfig.database,
          timestamp: new Date().toISOString()
        });
      } catch (dbErr) {
        return sendJson(res, 503, {
          success: false,
          status: 'DEGRADED',
          server: 'Node.js Native HTTP',
          database: 'Database connection failed',
          error: dbErr.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    // -------------------------------------------------------------
    // Route: GET /api/books
    // List, Search, Filter, Sort, Paginate, Stats
    //
    // References:
    // SQL SELECT:
    // https://dev.mysql.com/doc/refman/8.4/en/select.html
    //
    // SQL LIKE:
    // https://dev.mysql.com/doc/refman/8.4/en/string-comparison-functions.html
    //
    // LIMIT and OFFSET:
    // https://dev.mysql.com/doc/refman/8.4/en/select.html
    //
    // MySQL2 prepared statements:
    // https://sidorares.github.io/node-mysql2/docs/documentation/prepared-statements
    // -------------------------------------------------------------
    if (method === 'GET' && pathname === '/api/books') {
      const search = (reqUrl.searchParams.get('search') || '').trim();
      const category = (reqUrl.searchParams.get('category') || '').trim();
      const status = (reqUrl.searchParams.get('status') || '').trim();
      const sortBy = (reqUrl.searchParams.get('sortBy') || 'book_id').toLowerCase();
      const sortOrder = (reqUrl.searchParams.get('sortOrder') || 'DESC').toUpperCase();
      const page = Math.max(1, parseInt(reqUrl.searchParams.get('page'), 10) || 1);
      const limit = Math.max(1, Math.min(50, parseInt(reqUrl.searchParams.get('limit'), 10) || 6));
      const offset = (page - 1) * limit;

      // Safe column whitelist for ORDER BY
      const allowedSortColumns = {
        'book_id': 'book_id',
        'title': 'title',
        'author': 'author',
        'book_code': 'book_code',
        'category': 'category',
        'publication_year': 'publication_year',
        'status': 'status'
      };
      const orderColumn = allowedSortColumns[sortBy] || 'book_id';
      const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';

      // Build WHERE conditions
      const whereClauses = [];
      const queryParams = [];

      if (search) {
        whereClauses.push('(title LIKE ? OR author LIKE ? OR book_code LIKE ?)');
        const searchPattern = `%${search}%`;
        queryParams.push(searchPattern, searchPattern, searchPattern);
      }

      if (category && category !== 'All' && VALID_CATEGORIES.includes(category)) {
        whereClauses.push('category = ?');
        queryParams.push(category);
      }

      if (status && status !== 'All' && VALID_STATUSES.includes(status)) {
        whereClauses.push('status = ?');
        queryParams.push(status);
      }

      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      // 1. Fetch overall counts / statistics for dashboard
      const [statsResult] = await pool.query(
        `SELECT 
           COUNT(*) AS total,
           COALESCE(SUM(CASE WHEN status = 'Available' THEN 1 ELSE 0 END), 0) AS available,
           COALESCE(SUM(CASE WHEN status = 'Issued' THEN 1 ELSE 0 END), 0) AS issued
         FROM books`
      );
      const overallStats = {
        total: Number(statsResult[0].total) || 0,
        available: Number(statsResult[0].available) || 0,
        issued: Number(statsResult[0].issued) || 0
      };

      // 2. Count matching filtered rows for pagination
      const countSql = `SELECT COUNT(*) AS count FROM books ${whereSql}`;
      const [countResult] = await pool.execute(countSql, queryParams);
      const totalFiltered = Number(countResult[0].count) || 0;
      const totalPages = Math.ceil(totalFiltered / limit) || 1;

      // 3. Fetch paginated records using prepared query
      const dataSql = `SELECT * FROM books ${whereSql} ORDER BY ${orderColumn} ${orderDirection} LIMIT ? OFFSET ?`;
      const [rows] = await pool.query(dataSql, [...queryParams, limit, offset]);

      return sendJson(res, 200, {
        success: true,
        data: rows,
        pagination: {
          total: totalFiltered,
          page,
          limit,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        },
        stats: overallStats
      });
    }

    // -------------------------------------------------------------
    // Route: POST /api/books
    // Add a new book
    //
    // References:
    // SQL INSERT:
    // https://dev.mysql.com/doc/refman/8.4/en/insert.html
    //
    // HTTP 201 Created:
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/201
    // -------------------------------------------------------------
    if (method === 'POST' && pathname === '/api/books') {
      const payload = await parseRequestBody(req);
      const validationErrors = validateBookPayload(payload);

      if (validationErrors.length > 0) {
        return sendJson(res, 400, {
          success: false,
          message: 'Validation failed',
          errors: validationErrors
        });
      }

      const title = payload.title.trim();
      const author = payload.author.trim();
      const book_code = payload.book_code.trim().toUpperCase();
      const category = payload.category;
      const publication_year = payload.publication_year ? Number(payload.publication_year) : null;
      const status = payload.status || 'Available';
      const image_url = payload.image_url ? payload.image_url.trim() : null;

      try {
        let result;
        try {
          const sql = `INSERT INTO books (title, author, book_code, category, publication_year, status, image_url) VALUES (?, ?, ?, ?, ?, ?, ?)`;
          [result] = await pool.execute(sql, [title, author, book_code, category, publication_year, status, image_url]);
        } catch (colErr) {
          if (colErr.code === 'ER_BAD_FIELD_ERROR') {
            const sql = `INSERT INTO books (title, author, book_code, category, publication_year, status) VALUES (?, ?, ?, ?, ?, ?)`;
            [result] = await pool.execute(sql, [title, author, book_code, category, publication_year, status]);
          } else {
            throw colErr;
          }
        }

        return sendJson(res, 201, {
          success: true,
          message: 'Book registered successfully',
          book_id: result.insertId
        });
      } catch (dbErr) {
        if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
          return sendJson(res, 409, {
            success: false,
            message: `A book with code '${book_code}' already exists. Please choose a unique book code.`
          });
        }
        throw dbErr;
      }
    }

    // -------------------------------------------------------------
    // ROUTE MATCHING: /api/books/:id
    //
    // Reference:
    // JavaScript regular expressions:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions
    // -------------------------------------------------------------
    const bookIdMatch = pathname.match(/^\/api\/books\/(\d+)$/);

    if (bookIdMatch) {
      const bookId = parseInt(bookIdMatch[1], 10);

      // GET /api/books/:id
      // Retrieve single book details
      //
      // Reference:
      // SQL SELECT:
      // https://dev.mysql.com/doc/refman/8.4/en/select.html
      if (method === 'GET') {
        const [rows] = await pool.execute('SELECT * FROM books WHERE book_id = ?', [bookId]);
        if (rows.length === 0) {
          return sendJson(res, 404, { success: false, message: 'Book not found' });
        }
        return sendJson(res, 200, { success: true, data: rows[0] });
      }

      // PUT /api/books/:id
      // Update entire book
      //
      // Reference:
      // SQL UPDATE:
      // https://dev.mysql.com/doc/refman/8.4/en/update.html
      if (method === 'PUT') {
        const payload = await parseRequestBody(req);
        const validationErrors = validateBookPayload(payload);

        if (validationErrors.length > 0) {
          return sendJson(res, 400, {
            success: false,
            message: 'Validation failed',
            errors: validationErrors
          });
        }

        const title = payload.title.trim();
        const author = payload.author.trim();
        const book_code = payload.book_code.trim().toUpperCase();
        const category = payload.category;
        const publication_year = payload.publication_year ? Number(payload.publication_year) : null;
        const status = payload.status || 'Available';
        const image_url = payload.image_url ? payload.image_url.trim() : null;

        try {
          let result;
          try {
            const sql = `UPDATE books SET title = ?, author = ?, book_code = ?, category = ?, publication_year = ?, status = ?, image_url = ? WHERE book_id = ?`;
            [result] = await pool.execute(sql, [title, author, book_code, category, publication_year, status, image_url, bookId]);
          } catch (colErr) {
            if (colErr.code === 'ER_BAD_FIELD_ERROR') {
              const sql = `UPDATE books SET title = ?, author = ?, book_code = ?, category = ?, publication_year = ?, status = ? WHERE book_id = ?`;
              [result] = await pool.execute(sql, [title, author, book_code, category, publication_year, status, bookId]);
            } else {
              throw colErr;
            }
          }

          if (result.affectedRows === 0) {
            return sendJson(res, 404, { success: false, message: 'Book not found' });
          }

          return sendJson(res, 200, {
            success: true,
            message: 'Book details updated successfully',
            book_id: bookId
          });
        } catch (dbErr) {
          if (dbErr.code === 'ER_DUP_ENTRY' || dbErr.errno === 1062) {
            return sendJson(res, 409, {
              success: false,
              message: `Another book with code '${book_code}' already exists.`
            });
          }
          throw dbErr;
        }
      }

      // PATCH /api/books/:id
      // Update status specifically for Drag-and-Drop or Toggle
      //
      // Reference:
      // SQL UPDATE:
      // https://dev.mysql.com/doc/refman/8.4/en/update.html
      if (method === 'PATCH') {
        const payload = await parseRequestBody(req);

        if (!payload.status || !VALID_STATUSES.includes(payload.status)) {
          return sendJson(res, 400, {
            success: false,
            message: `Invalid status. Must be either 'Available' or 'Issued'.`
          });
        }

        const [result] = await pool.execute('UPDATE books SET status = ? WHERE book_id = ?', [payload.status, bookId]);

        if (result.affectedRows === 0) {
          return sendJson(res, 404, { success: false, message: 'Book not found' });
        }

        return sendJson(res, 200, {
          success: true,
          message: `Book status changed to '${payload.status}' successfully`,
          book_id: bookId,
          status: payload.status
        });
      }

      // DELETE /api/books/:id
      // Remove book
      //
      // Reference:
      // SQL DELETE:
      // https://dev.mysql.com/doc/refman/8.4/en/delete.html
      if (method === 'DELETE') {
        const [result] = await pool.execute('DELETE FROM books WHERE book_id = ?', [bookId]);

        if (result.affectedRows === 0) {
          return sendJson(res, 404, { success: false, message: 'Book not found' });
        }

        return sendJson(res, 200, {
          success: true,
          message: 'Book deleted successfully',
          book_id: bookId
        });
      }
    }

    // -------------------------------------------------------------
    // SERVE STATIC FRONTEND ASSETS
    // Files: public/index.html, style.css, app.js
    //
    // Reference:
    // Node.js file system:
    // https://nodejs.org/docs/latest/api/fs.html
    // -------------------------------------------------------------
    if (method === 'GET') {
      serveStaticFile(req, res, pathname);
      return;
    }

    // Unmatched API endpoint or method
    return sendJson(res, 404, { success: false, message: 'Endpoint not found' });

  } catch (error) {
    console.error('Server Internal Error:', error);
    if (error.message === 'Invalid JSON format' || error.message === 'Payload too large') {
      return sendJson(res, 400, { success: false, message: error.message });
    }
    return sendJson(res, 500, {
      success: false,
      message: 'Internal server error occurred',
      error: error.message
    });
  }
});

/*
 * START THE SERVER
 *
 * Reference:
 * Node.js server.listen():
 * https://nodejs.org/docs/latest/api/net.html#serverlisten
 */

 // Start the HTTP Server
server.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  await testConnection();
  await syncCanonicalBooks();
});
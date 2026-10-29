/**
 * =====================================================================
 * Library Book Lending Management System
 * Database Connection & Schema Management Module
 * =====================================================================
 * Database   : library_portal
 * Table      : books
 * Environment: MySQL running via XAMPP Control Panel (phpMyAdmin)
 * Driver     : mysql2/promise
 * =====================================================================
 */

const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

// Default XAMPP MySQL Configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_portal',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true
};

// Canonical 6 books dataset matching phpMyAdmin records
const SEED_BOOKS = [
  {
    book_id: 1,
    title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
    author: 'Robert C. Martin',
    book_code: 'TECH-101',
    category: 'Technology',
    publication_year: 2008,
    status: 'Issued',
    image_url: 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/'
  },
  {
    book_id: 4,
    title: 'Computer Networks: A Systems Approach',
    author: 'Larry L. Peterson',
    book_code: 'TECH-104',
    category: 'Technology',
    publication_year: 2011,
    status: 'Issued',
    image_url: 'https://www.goonebook.in/wp-content/uploads/2021/09/Computer-Networks.jpg'
  },
  {
    book_id: 5,
    title: 'To Kill a Mockingbird',
    author: 'Harper Lee',
    book_code: 'FIC-201',
    category: 'Fiction',
    publication_year: 1960,
    status: 'Available',
    image_url: 'https://images.isbndb.com/covers/30/23/9780061120084.jpg'
  },
  {
    book_id: 6,
    title: '1984',
    author: 'George Orwell',
    book_code: 'FIC-202',
    category: 'Fiction',
    publication_year: 1949,
    status: 'Available',
    image_url: 'https://images.isbndb.com/covers/37/08/9780451524935.jpg'
  },
  {
    book_id: 9,
    title: 'Cosmos',
    author: 'Carl Sagan',
    book_code: 'SCI-302',
    category: 'Science',
    publication_year: 1980,
    status: 'Available',
    image_url: 'https://images.isbndb.com/covers/71/61/9780345539436.jpg'
  },
  {
    book_id: 11,
    title: 'Sapiens: A Brief History of Humankind',
    author: 'Yuval Noah Harari',
    book_code: 'HIST-401',
    category: 'History',
    publication_year: 2014,
    status: 'Issued',
    image_url: 'https://images.isbndb.com/covers/16/91/9780062316096.jpg'
  }
];

// Connection pool targeting `library_portal`
const pool = mysql.createPool(dbConfig);

/**
 * Automatically creates database `library_portal` and table `books`
 * if they do not exist yet in XAMPP MySQL.
 */
async function autoInitDatabase() {
  let serverConn = null;
  try {
    // Step 1: Connect to MySQL server without selecting database
    serverConn = await mysql.createConnection({
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      password: dbConfig.password,
      multipleStatements: true
    });

    // Step 2: Ensure database exists
    await serverConn.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`
    );
    await serverConn.query(`USE \`${dbConfig.database}\`;`);

    // Step 3: Ensure table `books` exists
    await serverConn.query(`
      CREATE TABLE IF NOT EXISTS \`books\` (
        \`book_id\` INT NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`author\` VARCHAR(150) NOT NULL,
        \`book_code\` VARCHAR(50) NOT NULL UNIQUE,
        \`category\` VARCHAR(50) NOT NULL,
        \`publication_year\` INT NULL,
        \`status\` VARCHAR(20) NOT NULL DEFAULT 'Available',
        \`image_url\` VARCHAR(255) NULL,
        \`created_at\` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`book_id\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Step 4: Seed records if table is empty
    const [rows] = await serverConn.query('SELECT COUNT(*) AS total FROM `books`');
    if (rows[0].total === 0) {
      for (const b of SEED_BOOKS) {
        await serverConn.query(
          `INSERT INTO \`books\` (\`book_id\`, \`title\`, \`author\`, \`book_code\`, \`category\`, \`publication_year\`, \`status\`, \`image_url\`)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE \`status\` = VALUES(\`status\`)`,
          [b.book_id, b.title, b.author, b.book_code, b.category, b.publication_year, b.status, b.image_url]
        );
      }
    }
  } catch (err) {
    console.error('Database initialization error:', err.message);
    throw err;
  } finally {
    if (serverConn) await serverConn.end();
  }
}

/**
 * Tests direct connection to MySQL
 */
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('Connected to MySQL database');
    conn.release();
    return true;
  } catch (err) {
    if (err.code === 'ER_BAD_DB_ERROR') {
      await autoInitDatabase();
      return testConnection();
    }
    console.error('Database connection failed:', err.message);
    return false;
  }
}

/**
 * Helper: Query books from table `books`
 */
async function getAllBooks() {
  const [rows] = await pool.query('SELECT * FROM books ORDER BY book_id ASC');
  return rows;
}

/**
 * Helper: Query single book by ID
 */
async function getBookById(id) {
  const [rows] = await pool.execute('SELECT * FROM books WHERE book_id = ?', [id]);
  return rows[0] || null;
}

/**
 * Helper: Update book status (e.g. for Lending/Return Desk)
 */
async function updateBookStatus(id, status) {
  const [result] = await pool.execute('UPDATE books SET status = ? WHERE book_id = ?', [status, id]);
  return result.affectedRows > 0;
}

module.exports = {
  dbConfig,
  pool,
  autoInitDatabase,
  testConnection,
  getAllBooks,
  getBookById,
  updateBookStatus,
  SEED_BOOKS
};

// If run directly via: node db.js
if (require.main === module) {
  (async () => {
    try {
      const ok = await testConnection();
      if (ok) {
        const books = await getAllBooks();
        console.log(`Total books: ${books.length}`);
      }
    } catch (e) {
      console.error(e.message);
    } finally {
      await pool.end();
    }
  })();
}

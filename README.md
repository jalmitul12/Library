# Library Book Lending Management System

A complete, production-ready, responsive **Library Book Lending Management System** engineered specifically for college practical examinations.

This project demonstrates core full-stack competencies using **native technologies only**, strictly avoiding heavy external abstractions (no Express.js, no frontend frameworks like React/Angular, no ORMs).

---

## 1. Technology Stack

- **Frontend**: HTML5 semantic markup, CSS3, Bootstrap 5.3 (via CDN), Bootstrap Icons, Vanilla JavaScript (ES6+), Fetch API.
- **Drag-and-Drop**: Native HTML5 Drag and Drop API (`dragstart`, `dragend`, `dragover`, `dragleave`, `drop`).
- **Backend**: Node.js built-in `http`, `fs`, `path`, and `url` modules.
- **Database**: MySQL (via XAMPP) using the official `mysql2` client library with prepared statements (`?` placeholders).
- **Prohibited Libraries Respected**: Zero Express.js, React, Next.js, Angular, Vue, Tailwind CSS, MongoDB, Firebase, Supabase, Prisma, or Sequelize.

---

## 2. Project Structure

```text
Library_Book_Lending/
├── package.json        # Node manifest declaring mysql2 dependency and scripts
├── database.sql        # Database initialization & seed data script
├── server.js           # Native Node.js HTTP server and REST API handler
├── README.md           # Setup, architecture, API docs, testing, and viva guide
├── REFERENCES.md       # 5 verified official documentation references
└── public/             # Static web assets served by server.js
    ├── index.html      # Responsive UI with semantic HTML5 & Bootstrap 5
    ├── style.css       # Custom styles, transitions, and drag-and-drop visuals
    └── app.js          # Client-side state, Fetch API, and drag-and-drop logic
```

---

## 3. System Architecture & Features

### A. Dynamic Dashboard Counters
- Three real-time KPI indicator cards: **Total Books**, **Available for Lending**, and **Currently Issued**.
- Aggregated via SQL `COUNT` and conditional sums (`SUM(CASE WHEN status = ...)`).
- Automatically re-synced after every database mutation (Add, Edit, Delete, or Drag-and-Drop).

### B. Interactive Native Drag-and-Drop Station
- Two drop zones:
  - **Return Desk (Available)**: Drop any issued card to mark it returned.
  - **Lending Desk (Issued)**: Drop any available card to mark it issued.
- Cards feature `draggable="true"` and transfer the `book_id` via the browser's `dataTransfer` payload.
- Dropping triggers a `PATCH /api/books/:id` request and displays immediate toast feedback.
- Also includes a fallback **Toggle Status** button on each card for mobile/touchscreen users.

### C. Unified Book Management Modal Form
- Serves both **Add New Book** and **Edit Book** operations dynamically.
- Client-side validation: HTML5 `required`, length limits, regex pattern (`^[A-Za-z0-9-]+$`), and valid year range (`1000` to `2099`).
- Category select: *Fiction*, *Science*, *Technology*, *History*, *Other*.
- Status select: *Available*, *Issued*.

### D. Catalogue & Filter Station
- Real-time **Search** across book title, author, and book code (debounced at 300ms).
- Category and Status dropdown filters.
- Sorting by Title (A–Z / Z–A), Publication Year (Newest / Oldest), and Recently Added.
- Client-side and server-side **Pagination** (configurable page size with Previous, Next, and numbered page links).

---

## 4. Database Setup (MySQL via XAMPP)

1. Launch the **XAMPP Control Panel** and click **Start** next to **MySQL** (and Apache if desired).
2. Open your browser and navigate to **phpMyAdmin**: `http://localhost/phpmyadmin/`.
3. Click on the **Import** tab.
4. Click **Choose File**, select `database.sql` from the project folder, and click **Import** (or **Go**).
5. Alternatively, run via Windows Command Prompt / PowerShell:
   ```powershell
   # Default XAMPP path
   Get-Content database.sql | C:\xampp\mysql\bin\mysql.exe -u root
   ```
6. The script creates the database `library_portal`, the table `books`, and inserts 6 seed records each with a unique cover image.

### Database Table Schema (`books`)
| Column Name | Data Type | Constraints | Description |
|---|---|---|---|
| `book_id` | `INT` | `PRIMARY KEY AUTO_INCREMENT` | Unique system identifier |
| `title` | `VARCHAR(150)` | `NOT NULL` | Full book title |
| `author` | `VARCHAR(100)` | `NOT NULL` | Author name |
| `book_code` | `VARCHAR(30)` | `UNIQUE NOT NULL` | Unique ISBN / Catalog code |
| `category` | `VARCHAR(30)` | `NOT NULL` | Category name |
| `publication_year` | `YEAR` | `NULL` | 4-digit publication year |
| `status` | `VARCHAR(20)` | `NOT NULL DEFAULT 'Available'` | 'Available' or 'Issued' |
| `image_url` | `VARCHAR(255)` | `NULL` | Web URL for book cover image |
| `created_at` | `TIMESTAMP` | `DEFAULT CURRENT_TIMESTAMP` | Record timestamp |

---

## 5. Server Setup & Execution (Windows / VS Code)

### Prerequisites
- **Node.js**: v18.0.0 or higher (`node -v`)
- **XAMPP**: MySQL running on port 3306 with user `root` and blank password (default XAMPP settings).

### Installation & Run Steps
1. Open the project folder in **VS Code**:
   ```bash
   code Library_Book_Lending
   ```
2. Open the built-in terminal (`Ctrl + ~`) and install dependencies:
   ```bash
   npm install
   ```
3. Start the HTTP server:
   ```bash
   npm start
   ```
   *(For auto-restarting during development, run: `npm run dev`)*
4. Open your browser and visit:
   ```text
   http://localhost:3000
   ```
5. Check the live server & database health endpoint:
   ```text
   http://localhost:3000/api/health
   ```

---

## 6. REST API Reference

All requests and responses use JSON formatting with standard HTTP status codes.

| Method | Endpoint | Description | Request Body Example | Success Response |
|---|---|---|---|---|
| `GET` | `/api/health` | System health & DB connection check | *None* | `200 OK` `{ success: true, status: "UP", database: "MySQL Connected" }` |
| `GET` | `/api/books` | Search, filter, sort, paginate, & get stats | *Query params*: `search`, `category`, `status`, `sortBy`, `sortOrder`, `page`, `limit` | `200 OK` `{ success: true, data: [...], pagination: {...}, stats: {...} }` |
| `POST` | `/api/books` | Register a new book | `{ "title": "...", "author": "...", "book_code": "...", "category": "...", "publication_year": 2024, "status": "Available" }` | `201 Created` `{ success: true, message: "Book registered successfully", book_id: 13 }` |
| `PUT` | `/api/books/:id` | Update entire book record | Full book object | `200 OK` `{ success: true, message: "Book details updated successfully" }` |
| `PATCH` | `/api/books/:id` | Update lending status (Drag & Drop / Toggle) | `{ "status": "Issued" }` | `200 OK` `{ success: true, message: "Book status changed...", status: "Issued" }` |
| `DELETE` | `/api/books/:id` | Permanently remove book | *None* | `200 OK` `{ success: true, message: "Book deleted successfully" }` |

---

## 7. Testing Checklist

- [x] **Server Health**: Open `http://localhost:3000` — the top navigation pill shows green: `Online • MySQL Ready`.
- [x] **Initial Data**: 6 seeded books render in responsive Bootstrap cards; dashboard displays: Total: 6, Available: 3, Issued: 3.
- [x] **Add Book**: Click "+ Add Book", fill in title, author, unique code (e.g. `TECH-999`), choose Technology, year 2024, submit. Card appears and Total/Available counts increase by 1.
- [x] **Duplicate Code Prevention**: Attempt to add another book with code `TECH-999`. Form rejects submission with a 409 Conflict error message.
- [x] **Native Drag-and-Drop**: Drag an "Available" card into the yellow "Lending Desk (Issued)" drop zone. Card badge turns amber ("Issued") and Issued count increments by 1.
- [x] **Drop to Available**: Drag an "Issued" card into the green "Return Desk (Available)" drop zone. Status flips back to "Available".
- [x] **Status Toggle Button**: Click "Issue" or "Return" button in card footer — immediately updates status without dragging.
- [x] **Edit Book**: Click the pencil icon on any card, modify the title or category, and click "Update Book". Catalogue reflects changes immediately.
- [x] **Delete Book**: Click trash icon, confirm in modal. Book disappears and counters decrease.
- [x] **Search**: Type `Hawking` in search box — only Stephen Hawking's book is displayed.
- [x] **Category Filter**: Filter by "Technology" — only Tech books appear.
- [x] **Sorting**: Sort by "Title (A → Z)" or "Year (Newest)" — card order updates accurately.
- [x] **Pagination**: Change pages using "Next", numbered page links, or "Prev".

---

## 8. Practical Exam Viva Questions & Answers

### Q1: Why did we use Node.js's native `http` module instead of Express.js?
**Answer:** The native `http` module is part of the Node.js standard library and requires zero external dependencies. It helps examiners assess a student's core understanding of HTTP request-response lifecycles, chunked stream parsing (`req.on('data')`, `req.on('end')`), URL query parsing, MIME type resolution, and header manipulation without relying on framework magic.

### Q2: How do prepared statements protect this application from SQL Injection?
**Answer:** Prepared statements separate the SQL query structure from the user-supplied data. In `mysql2`, placeholders (`?`) ensure that user inputs are transmitted to the database engine as literal values rather than executable SQL fragments, rendering attacks such as `' OR '1'='1` harmless.

### Q3: How is the native HTML5 Drag and Drop API implemented here?
**Answer:** Book cards are marked with `draggable="true"`. On `dragstart`, the card's ID is stored into `event.dataTransfer.setData('text/plain', bookId)`. The drop zones intercept `dragover` (calling `event.preventDefault()` to allow dropping) and `drop`. In the `drop` event handler, `event.dataTransfer.getData('text/plain')` retrieves the `bookId`, which is then dispatched to `PATCH /api/books/:id` via the Fetch API.

### Q4: Why is a connection pool (`mysql.createPool`) preferred over a single connection (`mysql.createConnection`)?
**Answer:** A connection pool maintains a cache of reusable database connections. Instead of repeatedly creating and terminating costly TCP handshakes for every HTTP request, connections are borrowed from the pool, used for queries, and automatically returned, greatly improving throughput and resource efficiency.

### Q5: What is the difference between `PUT` and `PATCH` in RESTful APIs?
**Answer:** `PUT` replaces the entire representation of a target resource with the supplied payload (idempotent full update). `PATCH` applies partial modifications to a resource (in our project, modifying only the `status` field during drag-and-drop or status toggling).

### Q6: How does the application prevent duplicate book codes / ISBNs?
**Answer:** In MySQL, the `book_code` column is defined with a `UNIQUE` constraint. When an insert or update violates this constraint, MySQL returns error code `1062` (`ER_DUP_ENTRY`). The Node.js server catches this error specifically and sends a `409 Conflict` response with a friendly error message back to the client.

### Q7: How does the server prevent Directory Traversal attacks when serving static files?
**Answer:** In `server.js`, file paths are resolved using `path.normalize(path.join(PUBLIC_DIR, relativePath))` and verified with `filePath.startsWith(PUBLIC_DIR)`. If an attacker requests `../../etc/passwd` or `../server.js`, the check fails and returns `403 Forbidden` or `404 Not Found`.

### Q8: What does `event.preventDefault()` do in the `dragover` event handler?
**Answer:** By default, web browsers disable dropping elements onto other HTML elements. Calling `event.preventDefault()` inside the `dragover` listener signals to the browser that the current element is a valid drop target and allows the `drop` event to trigger.

### Q9: How are the dashboard statistics kept in sync after every database mutation?
**Answer:** The `GET /api/books` endpoint executes an aggregation query (`COUNT(*)`, `SUM(CASE WHEN status = ...)`), returning updated counts alongside catalogue data. Whenever a book is added, edited, deleted, or dragged into a drop zone, the client calls `fetchBooks()`, refreshing both the grid and the KPI counters in one network round-trip.

### Q10: Why is debouncing applied to the search input field?
**Answer:** Debouncing delays the execution of the API call until the user stops typing for a specified interval (300ms). This prevents firing an HTTP request and database query on every individual keystroke, conserving server and database resources.

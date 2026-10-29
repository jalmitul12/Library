/**
 * Library Book Lending Management System - Client Application
 * College Practical Examination
 *
 * Technology: Vanilla JavaScript (ES6+), Fetch API, Native HTML5 Drag & Drop
 * Strictly zero external client-side frameworks (No React, Angular, etc.)
 *
 * JavaScript Reference:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript
 * ES6 Reference:
 * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide
 * DOM Reference:
 * https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model
 */

document.addEventListener('DOMContentLoaded', () => {
  // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Document/DOMContentLoaded

  // ========================================================
  // STATE MANAGEMENT
  // ========================================================
  // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Grammar_and_types#declarations
  // Reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const

  const state = {
    search: '',
    category: 'All',
    status: 'All',
    sortBy: 'book_id',
    sortOrder: 'DESC',
    page: 1,
    limit: 6,
    activeDeleteId: null,
    draggedBookId: null,
    draggedCurrentStatus: null
  };

  // ========================================================
  // DOM REFERENCES
  // ========================================================
  // DOM selection reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/Document/getElementById

  // Health
  const healthBadge = document.getElementById('systemHealthBadge');
  const healthDot = document.getElementById('healthDot');
  const healthText = document.getElementById('healthText');

  // Stats Counters
  const statTotalBooks = document.getElementById('statTotalBooks');
  const statAvailableBooks = document.getElementById('statAvailableBooks');
  const statIssuedBooks = document.getElementById('statIssuedBooks');

  // Drop Zones
  const dropZoneAvailable = document.getElementById('dropZoneAvailable');
  const dropZoneIssued = document.getElementById('dropZoneIssued');

  // Catalogue & Filters
  const searchInput = document.getElementById('searchInput');
  const btnClearSearch = document.getElementById('btnClearSearch');
  const categoryFilter = document.getElementById('categoryFilter');
  const statusFilter = document.getElementById('statusFilter');
  const sortBySelect = document.getElementById('sortBySelect');
  const btnResetFilters = document.getElementById('btnResetFilters');
  const booksGrid = document.getElementById('booksGrid');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const emptyState = document.getElementById('emptyState');
  const resultsCountBadge = document.getElementById('resultsCountBadge');
  const paginationControls = document.getElementById('paginationControls');
  const paginationSummary = document.getElementById('paginationSummary');

  // Book Modal & Form
  // Bootstrap Modal reference:
  // https://getbootstrap.com/docs/5.3/components/modal/
  const bookModalEl = document.getElementById('bookModal');
  const bookModal = new bootstrap.Modal(bookModalEl);
  const bookForm = document.getElementById('bookForm');
  const bookModalTitle = document.getElementById('bookModalTitle');
  const formBookId = document.getElementById('formBookId');
  const formTitle = document.getElementById('formTitle');
  const formAuthor = document.getElementById('formAuthor');
  const formBookCode = document.getElementById('formBookCode');
  const formCategory = document.getElementById('formCategory');
  const formYear = document.getElementById('formYear');
  const formImageUrl = document.getElementById('formImageUrl');
  const statusAvailableRadio = document.getElementById('statusAvailableRadio');
  const statusIssuedRadio = document.getElementById('statusIssuedRadio');
  const formErrorAlert = document.getElementById('formErrorAlert');
  const btnSubmitLabel = document.getElementById('btnSubmitLabel');
  const btnOpenAddModal = document.getElementById('btnOpenAddModal');
  const btnEmptyAddBook = document.getElementById('btnEmptyAddBook');

  // Delete Modal
  const deleteModalEl = document.getElementById('deleteModal');
  const deleteModal = new bootstrap.Modal(deleteModalEl);
  const deleteBookTitle = document.getElementById('deleteBookTitle');
  const btnConfirmDelete = document.getElementById('btnConfirmDelete');

  // Live Toast
  // Bootstrap Toast reference:
  // https://getbootstrap.com/docs/5.3/components/toasts/
  const toastEl = document.getElementById('liveToast');
  const toastMessage = document.getElementById('toastMessage');
  const liveToast = new bootstrap.Toast(toastEl, { delay: 3500 });

  // Debounce timer for search
  // setTimeout and clearTimeout references:
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/clearTimeout
  let searchDebounceTimer = null;

  // ========================================================
  // NOTIFICATION HELPER (TOAST)
  // ========================================================
  function showToast(message, type = 'success') {
    // Reference: https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
    // Reference: https://getbootstrap.com/docs/5.3/components/toasts/
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-warning', 'bg-info', 'bg-dark');

    let icon = 'bi-check-circle-fill';
    let bgClass = 'bg-success';

    if (type === 'danger' || type === 'error') {
      bgClass = 'bg-danger';
      icon = 'bi-exclamation-triangle-fill';
    } else if (type === 'warning') {
      bgClass = 'bg-warning';
      icon = 'bi-exclamation-circle-fill';
    } else if (type === 'info') {
      bgClass = 'bg-info';
      icon = 'bi-info-circle-fill';
    }

    toastEl.classList.add(bgClass);

    // innerHTML reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/innerHTML
    // Bootstrap Icons reference:
    // https://icons.getbootstrap.com/
    toastMessage.innerHTML = `<i class="bi ${icon} fs-5"></i> <span>${message}</span>`;
    liveToast.show();
  }

  // ========================================================
  // HEALTH CHECK
  // ========================================================
  async function checkSystemHealth() {
    // Optional DOM elements are checked before updating them.
    // Fetch API reference: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
    // Async/await reference: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/async_function
    if (!healthText && !healthDot && !healthBadge) return;

    try {
      const response = await fetch('/api/health');
      const data = await response.json();

      // Response.ok reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/Response/ok
      // Response.json reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/Response/json
      if (response.ok && data.success) {
        if (healthDot) healthDot.className = 'spinner-grow spinner-grow-sm text-success';
        if (healthText) healthText.textContent = `Online`;
        if (healthBadge) healthBadge.title = `Connected to MySQL database: ${data.database_name}`;
      } else {
        if (healthDot) healthDot.className = 'spinner-grow spinner-grow-sm text-danger';
        if (healthText) healthText.textContent = `DB Error`;
        if (healthBadge) healthBadge.title = data.error || 'Database connection offline';
      }
    } catch (err) {
      // Error handling reference:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/try...catch
      if (healthDot) healthDot.className = 'spinner-grow spinner-grow-sm text-danger';
      if (healthText) healthText.textContent = `Offline`;
    }
  }

  // Canonical 6 books dataset maintained across the application
  // JavaScript arrays and objects reference:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects
  let localBooks = [
    {
      book_id: 1,
      title: 'Clean Code: A Handbook of Agile Software Craftsmanship',
      author: 'Robert C. Martin',
      book_code: 'TECH-101',
      category: 'Technology',
      publication_year: 2008,
      status: 'Available',
      image_url: 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/'
    },
    {
      book_id: 2,
      title: 'Computer Networks: A Systems Approach',
      author: 'Larry L. Peterson',
      book_code: 'TECH-104',
      category: 'Technology',
      publication_year: 2011,
      status: 'Issued',
      image_url: 'https://www.goonebook.in/wp-content/uploads/2021/09/Computer-Networks.jpg'
    },
    {
      book_id: 3,
      title: 'To Kill a Mockingbird',
      author: 'Harper Lee',
      book_code: 'FIC-201',
      category: 'Fiction',
      publication_year: 1960,
      status: 'Available',
      image_url: 'https://images.isbndb.com/covers/30/23/9780061120084.jpg'
    },
    {
      book_id: 4,
      title: '1984',
      author: 'George Orwell',
      book_code: 'FIC-202',
      category: 'Fiction',
      publication_year: 1949,
      status: 'Issued',
      image_url: 'https://images.isbndb.com/covers/37/08/9780451524935.jpg'
    },
    {
      book_id: 5,
      title: 'Cosmos',
      author: 'Carl Sagan',
      book_code: 'SCI-302',
      category: 'Science',
      publication_year: 1980,
      status: 'Available',
      image_url: 'https://images.isbndb.com/covers/71/61/9780345539436.jpg'
    },
    {
      book_id: 6,
      title: 'Sapiens: A Brief History of Humankind',
      author: 'Yuval Noah Harari',
      book_code: 'HIST-401',
      category: 'History',
      publication_year: 2014,
      status: 'Issued',
      image_url: 'https://images.isbndb.com/covers/16/91/9780062316096.jpg'
    }
  ];

  // ========================================================
  // FETCH & RENDER BOOKS
  // ========================================================
  async function fetchBooks() {
    // DOM visibility reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/Element/classList
    loadingIndicator.classList.remove('d-none');
    emptyState.classList.add('d-none');
    booksGrid.innerHTML = '';

    // URLSearchParams reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams
    // Used to encode search, filter, sorting, and pagination parameters.
    const params = new URLSearchParams({
      search: state.search,
      category: state.category,
      status: state.status,
      sortBy: state.sortBy,
      sortOrder: state.sortOrder,
      page: state.page,
      limit: state.limit
    });

    try {
      // Fetch API reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
      // Query-string reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/toString
      const response = await fetch(`/api/books?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Failed to load books: ${response.statusText}`);
      }

      const result = await response.json();

      // 1. Update Dashboard Counters
      updateDashboardStats(result.stats);

      // 2. Render Cards & Grid
      if (result.data && result.data.length > 0) {
        renderBooksGrid(result.data);
      } else {
        emptyState.classList.remove('d-none');
      }

      // 3. Render Badges & Pagination
      resultsCountBadge.textContent = `${result.pagination.total} book${result.pagination.total === 1 ? '' : 's'}`;
      renderPagination(result.pagination);

    } catch (error) {
      // Array slice/filter reference:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array
      // Client-side fallback is used if the API request fails.
      console.warn('Live API unreachable, rendering 6 canonical books in client mode:', error);

      let filtered = localBooks.slice();

      if (state.search) {
        const q = state.search.toLowerCase();

        filtered = filtered.filter(b =>
          b.title.toLowerCase().includes(q) ||
          b.author.toLowerCase().includes(q) ||
          b.book_code.toLowerCase().includes(q)
        );
      }

      if (state.category && state.category !== 'All') {
        filtered = filtered.filter(b => b.category === state.category);
      }

      if (state.status && state.status !== 'All') {
        filtered = filtered.filter(b => b.status === state.status);
      }

      const totalAvailable = localBooks.filter(b => b.status === 'Available').length;
      const totalIssued = localBooks.filter(b => b.status === 'Issued').length;

      updateDashboardStats({
        total: localBooks.length,
        available: totalAvailable,
        issued: totalIssued
      });

      if (filtered.length > 0) {
        renderBooksGrid(filtered);
      } else {
        emptyState.classList.remove('d-none');
      }

      resultsCountBadge.textContent = `${filtered.length} book${filtered.length === 1 ? '' : 's'}`;

      renderPagination({
        total: filtered.length,
        page: 1,
        limit: 6,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });

    } finally {
      // finally runs whether the request succeeds or fails.
      loadingIndicator.classList.add('d-none');
    }
  }

  // Update Dynamic Statistics
  function updateDashboardStats(stats) {
    // Nullish coalescing operator reference:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing
    if (!stats) return;

    statTotalBooks.textContent = stats.total ?? 0;
    statAvailableBooks.textContent = stats.available ?? 0;
    statIssuedBooks.textContent = stats.issued ?? 0;
  }

  // ========================================================
  // COVER IMAGE DICTIONARY & RESOLUTION (EACH BOOK UNIQUE)
  // ========================================================
  // JavaScript objects and property access:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_objects

  const DEFAULT_BOOK_COVERS = {
    'TECH-101': 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/',
    'TECH-104': 'https://www.goonebook.in/wp-content/uploads/2021/09/Computer-Networks.jpg',
    'FIC-201': 'https://images.isbndb.com/covers/30/23/9780061120084.jpg',
    'FIC-202': 'https://images.isbndb.com/covers/37/08/9780451524935.jpg',
    'SCI-302': 'https://images.isbndb.com/covers/71/61/9780345539436.jpg',
    'HIST-401': 'https://images.isbndb.com/covers/16/91/9780062316096.jpg'
  };

  const TITLE_BOOK_COVERS = {
    'clean code': 'https://www.oreilly.com/library/cover/9780136083238/1200w630h/',
    'computer networks': 'https://www.goonebook.in/wp-content/uploads/2021/09/Computer-Networks.jpg',
    'to kill a mockingbird': 'https://images.isbndb.com/covers/30/23/9780061120084.jpg',
    '1984': 'https://images.isbndb.com/covers/37/08/9780451524935.jpg',
    'cosmos': 'https://images.isbndb.com/covers/71/61/9780345539436.jpg',
    'sapiens': 'https://images.isbndb.com/covers/16/91/9780062316096.jpg'
  };

  // Image fallback reference:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img
  const UNIQUE_FALLBACK_COVERS = {
    'TECH-101': 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&w=600&q=80',
    'TECH-104': 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=600&q=80',
    'FIC-201':  'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
    'FIC-202':  'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=600&q=80',
    'SCI-302':  'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
    'HIST-401': 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80'
  };

  const RANDOM_UNIQUE_POOL = [
    'https://images.unsplash.com/photo-1532012164546-f432f2e3777a?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1512820790803-83ca734da794?auto=format&fit=crop&w=600&q=80'
  ];

  function getBookCoverUrl(book) {
    // String.trim and String.toLowerCase references:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String
    if (book.image_url && typeof book.image_url === 'string' && book.image_url.trim()) {
      return book.image_url.trim();
    }

    const code = (book.book_code || '').trim().toUpperCase();

    if (DEFAULT_BOOK_COVERS[code]) {
      return DEFAULT_BOOK_COVERS[code];
    }

    const titleLower = (book.title || '').toLowerCase();

    // Object.entries reference:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/entries
    for (const [key, url] of Object.entries(TITLE_BOOK_COVERS)) {
      if (titleLower.includes(key)) {
        return url;
      }
    }

    return getUniqueFallbackUrl(book);
  }

  function getUniqueFallbackUrl(book) {
    const code = (book.book_code || '').trim().toUpperCase();

    if (UNIQUE_FALLBACK_COVERS[code]) {
      return UNIQUE_FALLBACK_COVERS[code];
    }

    // Number conversion and remainder operator:
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number
    const id = Number(book.book_id) || 1;

    return RANDOM_UNIQUE_POOL[id % RANDOM_UNIQUE_POOL.length];
  }

  // Render Book Cards into DOM
  function renderBooksGrid(books) {
    // createElement and appendChild references:
    // https://developer.mozilla.org/en-US/docs/Web/API/Document/createElement
    // https://developer.mozilla.org/en-US/docs/Web/API/Node/appendChild
    booksGrid.innerHTML = '';

    books.forEach(book => {
      const isAvailable = book.status === 'Available';
      const statusBadgeClass = isAvailable ? 'bg-success' : 'bg-warning text-dark';
      const statusIcon = isAvailable ? 'bi-check-circle-fill' : 'bi-clock-history';
      const coverUrl = getBookCoverUrl(book);
      const fallbackUrl = getUniqueFallbackUrl(book);

      // Bootstrap badge reference:
      // https://getbootstrap.com/docs/5.3/components/badge/
      // Bootstrap color utilities:
      // https://getbootstrap.com/docs/5.3/utilities/colors/
      const categoryBadges = {
        Fiction: 'bg-primary-subtle text-primary border border-primary-subtle',
        Science: 'bg-info-subtle text-info-emphasis border border-info-subtle',
        Technology: 'bg-indigo-subtle text-dark border border-secondary-subtle',
        History: 'bg-secondary-subtle text-secondary-emphasis border border-secondary-subtle',
        Other: 'bg-light text-muted border'
      };

      const catBadge = categoryBadges[book.category] || 'bg-light text-muted border';

      const col = document.createElement('div');
      col.className = 'col';

      // Template literals reference:
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Template_literals
      // HTML article element:
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/article
      // Bootstrap Cards:
      // https://getbootstrap.com/docs/5.3/components/card/
      // Bootstrap layout and utility classes:
      // https://getbootstrap.com/docs/5.3/layout/grid/
      col.innerHTML = `
        <article class="card book-card h-100 border shadow-sm overflow-hidden"
                 draggable="true"
                 data-book-id="${book.book_id}"
                 data-current-status="${book.status}"
                 aria-label="Book: ${escapeHtml(book.title)}">

          <!-- Book Cover Image with overlay badges -->
          <div class="book-cover-container position-relative overflow-hidden bg-light">
            <img src="${coverUrl}"
                 alt="${escapeHtml(book.title)} Cover"
                 class="w-100 h-100 object-fit-cover book-cover-img"
                 loading="lazy"
                 onerror="this.onerror=null; this.src='${fallbackUrl}';" />

            <div class="position-absolute top-0 start-0 m-2">
              <span class="badge ${catBadge} badge-category shadow-sm">${escapeHtml(book.category)}</span>
            </div>

            <div class="position-absolute top-0 end-0 m-2">
              <span class="drag-handle badge bg-dark bg-opacity-75 text-white font-monospace shadow-sm d-flex align-items-center gap-1" title="Drag to lending zones above">
                <i class="bi bi-grip-vertical"></i>
                <span>${escapeHtml(book.book_code)}</span>
              </span>
            </div>
          </div>

          <div class="card-body p-3 d-flex flex-column">
            <h6 class="card-title fw-bold text-dark mb-1 text-truncate" title="${escapeHtml(book.title)}">
              ${escapeHtml(book.title)}
            </h6>
            <p class="card-subtitle text-muted small mb-3">
              <i class="bi bi-person me-1"></i>${escapeHtml(book.author)}
            </p>

            <div class="d-flex align-items-center justify-content-between text-muted small mt-auto pt-2 border-top">
              <span>
                <i class="bi bi-calendar3 me-1"></i>${book.publication_year ? book.publication_year : 'N/A'}
              </span>
              <span class="badge ${statusBadgeClass} rounded-pill px-2.5 py-1 d-inline-flex align-items-center gap-1 shadow-sm">
                <i class="bi ${statusIcon}"></i> ${book.status}
              </span>
            </div>
          </div>

          <div class="card-footer bg-light border-top py-2 d-flex align-items-center justify-content-between">
            <!-- Toggle Lending Status Button -->
            <button type="button"
                    class="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-1 btn-toggle-status"
                    data-book-id="${book.book_id}"
                    data-next-status="${isAvailable ? 'Issued' : 'Available'}"
                    title="Click to quickly switch status to ${isAvailable ? 'Issued' : 'Available'}">
              <i class="bi ${isAvailable ? 'bi-box-arrow-up-right' : 'bi-box-arrow-in-down'}"></i>
              <span>${isAvailable ? 'Issue' : 'Return'}</span>
            </button>

            <!-- Action Buttons: Edit & Delete -->
            <div class="btn-group btn-group-sm">
              <button type="button"
                      class="btn btn-outline-primary btn-edit-book"
                      data-book='${JSON.stringify(book).replace(/'/g, "&apos;")}'
                      title="Edit book details">
                <i class="bi bi-pencil-square"></i>
              </button>
              <button type="button"
                      class="btn btn-outline-danger btn-delete-book"
                      data-book-id="${book.book_id}"
                      data-book-title="${escapeHtml(book.title)}"
                      title="Delete book">
                <i class="bi bi-trash"></i>
              </button>
            </div>
          </div>
        </article>
      `;

      booksGrid.appendChild(col);
    });

    attachCardDragListeners();
    attachCardActionListeners();
  }

  // Render Bootstrap Pagination Controls
  // Bootstrap pagination reference:
  // https://getbootstrap.com/docs/5.3/components/pagination/
  function renderPagination(pagination) {
    const { total, page, totalPages, limit } = pagination;

    const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    paginationSummary.textContent = `Showing ${startItem}–${endItem} of ${total} books (Page ${page} of ${totalPages || 1})`;
    paginationControls.innerHTML = '';

    if (totalPages <= 1) return;

    // Previous Button
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${page === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" data-page="${page - 1}" aria-label="Previous">&laquo; Prev</a>`;
    paginationControls.appendChild(prevLi);

    // Numbered Pages
    for (let p = 1; p <= totalPages; p++) {
      // Show first, last, and current +/- 1 page
      if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
        const pageLi = document.createElement('li');
        pageLi.className = `page-item ${p === page ? 'active' : ''}`;
        pageLi.innerHTML = `<a class="page-link" href="#" data-page="${p}">${p}</a>`;
        paginationControls.appendChild(pageLi);
      } else if (p === page - 2 || p === page + 2) {
        const ellipsisLi = document.createElement('li');
        ellipsisLi.className = 'page-item disabled';
        ellipsisLi.innerHTML = `<span class="page-link">&hellip;</span>`;
        paginationControls.appendChild(ellipsisLi);
      }
    }

    // Next Button
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${page === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" data-page="${page + 1}" aria-label="Next">Next &raquo;</a>`;
    paginationControls.appendChild(nextLi);

    // Attach click handlers
    // Event listener reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener
    paginationControls.querySelectorAll('.page-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();

        const targetPage = parseInt(link.getAttribute('data-page'), 10);

        if (targetPage && targetPage !== state.page && targetPage >= 1 && targetPage <= totalPages) {
          state.page = targetPage;
          fetchBooks();

          // Window scrolling reference:
          // https://developer.mozilla.org/en-US/docs/Web/API/Window/scrollTo
          window.scrollTo({ top: 300, behavior: 'smooth' });
        }
      });
    });
  }

  // ========================================================
  // NATIVE HTML5 DRAG & DROP API IMPLEMENTATION
  // ========================================================
  // HTML Drag and Drop API:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTML_Drag_and_Drop_API
  // DragEvent reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/DragEvent
  // DataTransfer reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer

  function attachCardDragListeners() {
    const cards = document.querySelectorAll('.book-card');

    cards.forEach(card => {
      card.addEventListener('dragstart', (e) => {
        state.draggedBookId = card.getAttribute('data-book-id');
        state.draggedCurrentStatus = card.getAttribute('data-current-status');

        card.classList.add('is-dragging');

        e.dataTransfer.setData('text/plain', state.draggedBookId);
        e.dataTransfer.effectAllowed = 'move';
      });

      card.addEventListener('dragend', () => {
        card.classList.remove('is-dragging');
        state.draggedBookId = null;
        state.draggedCurrentStatus = null;
      });
    });
  }

  function setupDropZones() {
    const dropZones = [dropZoneAvailable, dropZoneIssued];

    dropZones.forEach(zone => {
      // dragenter event reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragenter_event
      zone.addEventListener('dragenter', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
      });

      // dragover event reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragover_event
      // preventDefault() permits the element to accept a drop.
      zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (!zone.classList.contains('drag-over')) {
          zone.classList.add('drag-over');
        }
      });

      // dragleave event reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/dragleave_event
      zone.addEventListener('dragleave', (e) => {
        // Only remove if leaving the zone container entirely
        if (e.relatedTarget && !zone.contains(e.relatedTarget)) {
          zone.classList.remove('drag-over');
        }
      });

      // drop event reference:
      // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/drop_event
      zone.addEventListener('drop', async (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');

        const bookId = e.dataTransfer.getData('text/plain') || state.draggedBookId;
        const targetStatus = zone.getAttribute('data-target-status');

        if (!bookId) return;

        // Check if already in this status
        if (state.draggedCurrentStatus === targetStatus) {
          showToast(`This book is already marked as "${targetStatus}".`, 'info');
          return;
        }

        await updateBookStatus(bookId, targetStatus);
      });
    });
  }

  // API Call: PATCH /api/books/:id
  // Fetch PATCH request reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  // JSON.stringify reference:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify
  async function updateBookStatus(bookId, newStatus) {
    try {
      const response = await fetch(`/api/books/${bookId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showToast(result.message, 'success');
        fetchBooks(); // Refreshes both catalogue and counters
      } else {
        showToast(result.message || 'Failed to update book status', 'danger');
      }
    } catch (err) {
      console.warn('Live API unavailable, updating status in client memory:', err);

      const target = localBooks.find(b => String(b.book_id) === String(bookId));

      if (target) {
        target.status = newStatus;
        showToast(`Book status changed to '${newStatus}' successfully`, 'success');
        fetchBooks();
        return;
      }

      showToast('Network error while updating lending status', 'danger');
    }
  }

  // ========================================================
  // CARD ACTIONS (TOGGLE, EDIT, DELETE)
  // ========================================================
  function attachCardActionListeners() {
    // addEventListener reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener

    // 1. Quick Status Toggle Button
    document.querySelectorAll('.btn-toggle-status').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-book-id');
        const nextStatus = btn.getAttribute('data-next-status');

        updateBookStatus(bookId, nextStatus);
      });
    });

    // 2. Edit Book Button
    document.querySelectorAll('.btn-edit-book').forEach(btn => {
      btn.addEventListener('click', () => {
        // JSON.parse reference:
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
        const bookData = JSON.parse(btn.getAttribute('data-book'));
        openEditBookModal(bookData);
      });
    });

    // 3. Delete Book Button
    document.querySelectorAll('.btn-delete-book').forEach(btn => {
      btn.addEventListener('click', () => {
        const bookId = btn.getAttribute('data-book-id');
        const bookTitle = btn.getAttribute('data-book-title');

        openDeleteModal(bookId, bookTitle);
      });
    });
  }

  // ========================================================
  // FORM & MODAL MANAGEMENT (ADD & EDIT)
  // ========================================================
  // Bootstrap Modal reference:
  // https://getbootstrap.com/docs/5.3/components/modal/
  // HTML form reference:
  // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/form

  function openAddBookModal() {
    // Form reset reference:
    // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/reset
    bookForm.reset();
    bookForm.classList.remove('was-validated');
    formBookId.value = '';
    formImageUrl.value = '';
    formErrorAlert.classList.add('d-none');
    formErrorAlert.textContent = '';

    bookModalTitle.innerHTML = '<i class="bi bi-plus-circle me-1"></i> Add New Book';
    btnSubmitLabel.textContent = 'Save Book';
    statusAvailableRadio.checked = true;

    bookModal.show();
  }

  function openEditBookModal(book) {
    bookForm.reset();
    bookForm.classList.remove('was-validated');
    formErrorAlert.classList.add('d-none');
    formErrorAlert.textContent = '';

    formBookId.value = book.book_id;
    formTitle.value = book.title;
    formAuthor.value = book.author;
    formBookCode.value = book.book_code;
    formCategory.value = book.category;
    formYear.value = book.publication_year || '';
    formImageUrl.value = book.image_url || '';

    if (book.status === 'Issued') {
      statusIssuedRadio.checked = true;
    } else {
      statusAvailableRadio.checked = true;
    }

    bookModalTitle.innerHTML = `<i class="bi bi-pencil-square me-1"></i> Edit Book (#${book.book_id})`;
    btnSubmitLabel.textContent = 'Update Book';

    bookModal.show();
  }

  // Unified Form Submission (POST / PUT)
  // Form submit event:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/submit_event
  // Form validation:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLFormElement/checkValidity
  // HTTP methods and Fetch:
  // https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch
  bookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!bookForm.checkValidity()) {
      e.stopPropagation();
      bookForm.classList.add('was-validated');
      return;
    }

    const bookId = formBookId.value.trim();
    const isEdit = Boolean(bookId);

    const payload = {
      title: formTitle.value.trim(),
      author: formAuthor.value.trim(),
      book_code: formBookCode.value.trim().toUpperCase(),
      category: formCategory.value,
      publication_year: formYear.value ? parseInt(formYear.value, 10) : null,
      status: statusIssuedRadio.checked ? 'Issued' : 'Available',
      image_url: formImageUrl.value.trim() || null
    };

    const url = isEdit ? `/api/books/${bookId}` : '/api/books';
    const method = isEdit ? 'PUT' : 'POST';

    formErrorAlert.classList.add('d-none');

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        bookModal.hide();
        showToast(result.message, 'success');
        fetchBooks();
      } else {
        formErrorAlert.textContent = result.message || (result.errors ? result.errors.join(' ') : 'Operation failed');
        formErrorAlert.classList.remove('d-none');
      }
    } catch (err) {
      console.error('Save error:', err);
      formErrorAlert.textContent = 'Network communication error. Please try again.';
      formErrorAlert.classList.remove('d-none');
    }
  });

  // ========================================================
  // DELETE RECORD
  // ========================================================
  // HTTP DELETE request reference:
  // https://developer.mozilla.org/en-US/docs/Web/HTTP/Methods/DELETE

  function openDeleteModal(bookId, title) {
    state.activeDeleteId = bookId;
    deleteBookTitle.textContent = title;
    deleteModal.show();
  }

  btnConfirmDelete.addEventListener('click', async () => {
    if (!state.activeDeleteId) return;

    try {
      const response = await fetch(`/api/books/${state.activeDeleteId}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok && result.success) {
        deleteModal.hide();
        showToast(result.message, 'success');
        state.activeDeleteId = null;
        fetchBooks();
      } else {
        showToast(result.message || 'Failed to delete book', 'danger');
      }
    } catch (err) {
      console.error('Delete error:', err);
      showToast('Network error while deleting book record', 'danger');
    }
  });

  // ========================================================
  // FILTER & SEARCH HANDLERS
  // ========================================================
  // Input event reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event
  // Debouncing with setTimeout:
  // https://developer.mozilla.org/en-US/docs/Web/API/Window/setTimeout

  // Search input debounced
  searchInput.addEventListener('input', (e) => {
    const val = e.target.value.trim();

    btnClearSearch.classList.toggle('d-none', !val);

    clearTimeout(searchDebounceTimer);

    searchDebounceTimer = setTimeout(() => {
      state.search = val;
      state.page = 1;
      fetchBooks();
    }, 300);
  });

  btnClearSearch.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('d-none');
    state.search = '';
    state.page = 1;

    fetchBooks();
  });

  // Category Filter
  // Change event reference:
  // https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement/change_event
  categoryFilter.addEventListener('change', (e) => {
    state.category = e.target.value;
    state.page = 1;

    fetchBooks();
  });

  // Status Filter
  statusFilter.addEventListener('change', (e) => {
    state.status = e.target.value;
    state.page = 1;

    fetchBooks();
  });

  // Sort By
  // switch statement reference:
  // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/switch
  sortBySelect.addEventListener('change', (e) => {
    const value = e.target.value;

    switch (value) {
      case 'title_asc':
        state.sortBy = 'title';
        state.sortOrder = 'ASC';
        break;

      case 'title_desc':
        state.sortBy = 'title';
        state.sortOrder = 'DESC';
        break;

      case 'publication_year_desc':
        state.sortBy = 'publication_year';
        state.sortOrder = 'DESC';
        break;

      case 'publication_year_asc':
        state.sortBy = 'publication_year';
        state.sortOrder = 'ASC';
        break;

      case 'book_id_desc':
      default:
        state.sortBy = 'book_id';
        state.sortOrder = 'DESC';
        break;
    }

    state.page = 1;
    fetchBooks();
  });

  // Reset Filters Button
  btnResetFilters.addEventListener('click', () => {
    searchInput.value = '';
    btnClearSearch.classList.add('d-none');
    categoryFilter.value = 'All';
    statusFilter.value = 'All';
    sortBySelect.value = 'book_id_desc';

    state.search = '';
    state.category = 'All';
    state.status = 'All';
    state.sortBy = 'book_id';
    state.sortOrder = 'DESC';
    state.page = 1;

    fetchBooks();
  });

  // Open Modal Buttons
  btnOpenAddModal.addEventListener('click', openAddBookModal);
  btnEmptyAddBook.addEventListener('click', openAddBookModal);

  // ========================================================
  // UTILITY: ESCAPE HTML TO PREVENT XSS
  // ========================================================
  // HTML injection/XSS security guidance:
  // https://developer.mozilla.org/en-US/docs/Web/Security/Attacks/XSS
  // HTML escaping context:
  // https://developer.mozilla.org/en-US/docs/Glossary/Entity
  // Note: escaping is important when inserting data into HTML strings.

  function escapeHtml(str) {
    if (str === null || str === undefined) return '';

    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // ========================================================
  // INITIALIZATION
  // ========================================================
  // The following functions initialize drop zones, check the API,
  // and load the catalogue after the DOM is ready.

  setupDropZones();
  checkSystemHealth();
  fetchBooks();
});
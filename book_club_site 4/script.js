
// --- Auth + API helpers (Netlify Identity) ---
async function getToken() {
  try {
    const u = window.netlifyIdentity && window.netlifyIdentity.currentUser();
    if (!u) return null;
    return await u.jwt();
  } catch { return null; }
}

async function authFetch(url, opts = {}) {
  const token = await getToken();
  const headers = { ...(opts.headers||{}), 'content-type': 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}

async function apiGetBooks() {
  const res = await fetch('/.netlify/functions/books-get');
  if (!res.ok) throw new Error('Failed to load books');
  return res.json();
}

async function apiAddBook(book) {
  const res = await authFetch('/.netlify/functions/book-add', { method: 'POST', body: JSON.stringify(book) });
  if (!res.ok) throw new Error('Failed to add book');
  return res.json();
}

async function apiUpsertRead({ book_id, progress_pct, rating }) {
  const res = await authFetch('/.netlify/functions/read-upsert', { method: 'POST', body: JSON.stringify({ book_id, progress_pct, rating }) });
  if (!res.ok) throw new Error('Failed to save progress');
  return res.json();
}
// --- End helpers ---

// ===== Auth UI manager & gating =====
function setAuthUI(user){
  const reqEls = document.querySelectorAll('[data-auth="required"]');
  const guestEls = document.querySelectorAll('[data-auth="guest"]');
  const chip = document.getElementById('user-chip');
  const login = document.getElementById('login-btn');
  const logout = document.getElementById('logout-btn');
  if(user){
    const name = user.user_metadata?.full_name || user.email;
    if(chip){ chip.textContent = name; chip.style.display = 'inline-block'; }
    if(login) login.style.display = 'none';
    if(logout) logout.style.display = 'inline-block';
    reqEls.forEach(e=>e.style.display='');
    guestEls.forEach(e=>e.style.display='none');
  }else{
    if(chip) chip.style.display='none';
    if(login) login.style.display = 'inline-block';
    if(logout) logout.style.display = 'none';
    reqEls.forEach(e=>e.style.display='none');
    guestEls.forEach(e=>e.style.display='');
  }
}

document.addEventListener('DOMContentLoaded', ()=>{
  const u = window.netlifyIdentity?.currentUser();
  setAuthUI(u);
  document.getElementById('login-btn')?.addEventListener('click', ()=> netlifyIdentity.open('login'));
  document.getElementById('logout-btn')?.addEventListener('click', ()=> netlifyIdentity.logout());
  netlifyIdentity?.on('login', async (user)=>{ try{ await fetch('/.netlify/functions/user-upsert'); }catch{} setAuthUI(user); location.reload(); });
  netlifyIdentity?.on('logout', ()=>{ setAuthUI(null); location.reload(); });
});
// ====================================


// Common functionality for page navigation fade transitions
document.addEventListener('DOMContentLoaded', () => {
  // Insert current year into footer
  const yearEl = document.getElementById('year');
  if (yearEl) {
    const now = new Date();
    yearEl.textContent = now.getFullYear();
  }

  // Fade-in class is already applied via HTML, but ensure it's removed after animation
  setTimeout(() => {
    document.body.classList.remove('fade-in');
  }, 700);

  // Setup navigation fade-out on link click
  const navLinks = document.querySelectorAll('nav a');
  navLinks.forEach(link => {
    link.addEventListener('click', event => {
      const href = link.getAttribute('href');
      // Only intercept if going to a different page
      if (href && href !== window.location.pathname.split('/').pop()) {
        event.preventDefault();
        document.body.classList.add('fade-out');
        setTimeout(() => {
          window.location.href = href;
        }, 400);
      }
    });
  });

  // If we are on the books page, initialise book tracker
  if (document.body.classList.contains('page-books')) {
    initBookTracker();
  }
});

/*
 * Book Tracker Logic
 * Uses the browser's localStorage to persist book data between sessions on the same device.
 */
function loadBooks() {
  try {
    const stored = localStorage.getItem('books');
    return stored ? JSON.parse(stored) : [];
  } catch (err) {
    console.warn('Error parsing stored books:', err);
    return [];
  }
}

function saveBooks(books) {
  localStorage.setItem('books', JSON.stringify(books));
}

function renderBooks() {
  const books = loadBooks();
  const listEl = document.getElementById('bookList');
  if (!listEl) return;
  listEl.innerHTML = '';
  // Render each book as a card
  books.forEach(book => {
    const card = document.createElement('div');
    card.className = 'card';

    // Cover image
    const img = document.createElement('img');
    if (book.coverUrl) {
      img.src = book.coverUrl;
    } else {
      // Placeholder if no cover provided
      img.src = 'https://via.placeholder.com/300x200?text=No+Cover';
    }
    img.alt = `Cover of ${book.title}`;
    card.appendChild(img);

    const body = document.createElement('div');
    body.className = 'card-body';

    const member = document.createElement('div');
    member.className = 'member';
    member.textContent = book.member;
    body.appendChild(member);

    const title = document.createElement('div');
    title.className = 'title';
    title.textContent = book.title;
    body.appendChild(title);

    if (book.genre) {
      const genre = document.createElement('div');
      genre.className = 'genre';
      genre.textContent = book.genre;
      body.appendChild(genre);
    }

    if (book.summary) {
      const summary = document.createElement('div');
      summary.className = 'summary';
      summary.textContent = book.summary;
      body.appendChild(summary);
    }

    // Simple suggestions: for demonstration, we suggest more books of same genre
    // Render rating if present
    if (book.rating) {
      const ratingEl = document.createElement('div');
      ratingEl.className = 'rating';
      // Create star icons (filled and empty)
      const ratingVal = parseInt(book.rating, 10);
      let stars = '';
      for (let i = 1; i <= 5; i++) {
        stars += i <= ratingVal ? '★' : '☆';
      }
      ratingEl.textContent = `Rating: ${stars}`;
      body.appendChild(ratingEl);
    }

    // Render progress bar if present
    if (book.progress || book.progress === 0) {
      const progressContainer = document.createElement('div');
      progressContainer.className = 'progress-bar-container';
      const progressBar = document.createElement('div');
      progressBar.className = 'progress-bar';
      const pct = Math.max(0, Math.min(100, parseInt(book.progress, 10) || 0));
      progressBar.style.width = pct + '%';
      progressContainer.appendChild(progressBar);
      body.appendChild(progressContainer);
    }

    if (book.genre) {
      const suggestions = document.createElement('div');
      suggestions.className = 'suggestions';
      suggestions.textContent = `Love ${book.genre}? Try exploring more ${book.genre} titles!`;
      body.appendChild(suggestions);
    }

    card.appendChild(body);
    listEl.appendChild(card);
  });
}

function initBookTracker() {
  renderBooks();
  const form = document.getElementById('addBookForm');
  const fetchBtn = document.getElementById('fetchInfoBtn');
  if (form) {
    form.addEventListener('submit', async event => {
      event.preventDefault();
      const member = document.getElementById('memberName').value.trim();
      const title = document.getElementById('bookTitle').value.trim();
      const genre = document.getElementById('genre').value.trim();
      const summary = document.getElementById('summary').value.trim();
      const coverUrl = document.getElementById('coverUrl').value.trim();
      const progressInput = document.getElementById('progress').value.trim();
      const ratingInput = document.getElementById('rating').value;
      if (!member || !title) {
        alert('Please provide your name and a book title.');
        return;
      }
      const progress = progressInput ? parseInt(progressInput, 10) : null;
      const rating = ratingInput ? parseInt(ratingInput, 10) : null;
      const newBook = {
        id: Date.now(),
        member,
        title,
        genre,
        summary,
        coverUrl,
        progress,
        rating
      };
      const books = loadBooks();
      books.push(newBook);
      saveBooks(books);
      renderBooks();
      form.reset();
    });
  }
  if (fetchBtn) {
    fetchBtn.addEventListener('click', async () => {
      const title = document.getElementById('bookTitle').value.trim();
      if (!title) {
        alert('Enter a title first so we know what to look up.');
        return;
      }
      try {
        // Try to fetch details from Google Books API
        const info = await fetchBookInfo(title);
        if (info) {
          // Fill summary if empty
          const summaryEl = document.getElementById('summary');
          if (!summaryEl.value && info.description) {
            summaryEl.value = info.description;
          }
          // Fill genre if empty
          const genreEl = document.getElementById('genre');
          if (!genreEl.value && info.categories && info.categories.length) {
            genreEl.value = info.categories[0];
          }
          // Fill cover URL if empty
          const coverEl = document.getElementById('coverUrl');
          if (!coverEl.value && info.imageLinks && info.imageLinks.thumbnail) {
            // Use high resolution image if available
            coverEl.value = info.imageLinks.thumbnail.replace('zoom=1', 'zoom=2');
          }
        } else {
          alert('Sorry, we couldn\'t find details for that book.');
        }
      } catch (err) {
        console.error(err);
        alert('Something went wrong while fetching book details.');
      }
    });
  }
}

async function fetchBookInfo(title) {
  const apiUrl = 'https://www.googleapis.com/books/v1/volumes?q=' + encodeURIComponent(title) + '&maxResults=1';
  const response = await fetch(apiUrl);
  if (!response.ok) return null;
  const data = await response.json();
  if (data.items && data.items.length > 0) {
    return data.items[0].volumeInfo;
  }
  return null;
}
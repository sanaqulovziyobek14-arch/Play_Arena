/* ===== PLAYARENA MAIN JS — Yangilangan versiya ===== */

// ── Navbar scroll effect
function initNavbarScroll() {
  const navbar = document.querySelector('.navbar');
  if (!navbar) return;
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.style.borderBottomColor = 'rgba(34, 197, 94, 0.22)';
      navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
    } else {
      navbar.style.borderBottomColor = 'rgba(34, 197, 94, 0.10)';
      navbar.style.boxShadow = 'none';
    }
  }, { passive: true });
}

// ── Sport category tabs
function initSportTabs() {
  const tabs = document.querySelectorAll('.sport-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      const sport = tab.dataset.sport;
      filterVenuesBySport(sport);
    });
  });
}

// ── Filter venues by sport
function filterVenuesBySport(sport) {
  const cards = document.querySelectorAll('.venue-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const matches = !sport || sport === 'all' || card.dataset.sport === sport;
    if (matches) {
      card.style.display = '';
      card.style.animation = 'fade-up 0.3s ease forwards';
      visibleCount++;
    } else {
      card.style.display = 'none';
    }
  });
  // Update result count if element exists
  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = visibleCount + ' ta natija topildi';
}

// ── Favourite toggle
function initFavourites() {
  document.addEventListener('click', e => {
    const favBtn = e.target.closest('.venue-fav');
    if (!favBtn) return;
    e.preventDefault();
    e.stopPropagation();
    favBtn.classList.toggle('active');
    const isActive = favBtn.classList.contains('active');
    showToast(
      isActive ? "Sevimlilar ro'yxatiga qo'shildi ❤️" : "Sevimlilardan olib tashlandi",
      isActive ? 'success' : 'info'
    );
  });
}

// ── Date tabs
function initDateTabs() {
  const dateTabs = document.querySelectorAll('.date-tab');
  dateTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      dateTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });
}

// ── Time slots
function initTimeSlots() {
  const timeSlots = document.querySelectorAll('.time-slot:not(.booked)');
  timeSlots.forEach(slot => {
    slot.addEventListener('click', () => {
      timeSlots.forEach(s => s.classList.remove('active'));
      slot.classList.add('active');
    });
  });
}

// ── Map venue list
function initMapVenueList() {
  const items = document.querySelectorAll('.map-venue-item');
  items.forEach(item => {
    item.addEventListener('click', () => {
      items.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      const venueId = item.dataset.venueId;
      document.querySelectorAll('.map-pin').forEach(pin => {
        pin.style.opacity = '0.6';
        if (pin.dataset.id === venueId) pin.style.opacity = '1';
      });
    });
  });
}

// ── Map pins click
function initMapPins() {
  document.addEventListener('click', e => {
    const pin = e.target.closest('.map-pin');
    if (!pin) return;
    const id = pin.dataset.id;
    const items = document.querySelectorAll('.map-venue-item');
    items.forEach(i => i.classList.remove('active'));
    const item = document.querySelector(`.map-venue-item[data-venue-id="${id}"]`);
    if (item) {
      item.classList.add('active');
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    // Reset pin opacities
    document.querySelectorAll('.map-pin').forEach(p => p.style.opacity = '0.6');
    pin.style.opacity = '1';
  });
}

// ── Sport type cards
function initSportTypeCards() {
  const cards = document.querySelectorAll('.sport-type-card');
  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const sport = card.dataset.sport;
      window.location.href = `venues.html?sport=${sport}`;
    });
  });
}

// ── Booking button
function initBookingButton() {
  const bookBtn = document.getElementById('bookNowBtn');
  if (!bookBtn) return;
  bookBtn.addEventListener('click', () => {
    const selectedDate = document.querySelector('.date-tab.active');
    const selectedTime = document.querySelector('.time-slot.active');
    if (!selectedDate || !selectedTime) {
      showToast('Iltimos, sana va vaqtni tanlang', 'error');
      return;
    }
    openSuccessModal();
  });
}

// ── Success Modal
function openSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.add('active');
}

function closeSuccessModal() {
  const modal = document.getElementById('successModal');
  if (modal) modal.classList.remove('active');
}

// ── Modal close
function initModalClose() {
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) overlay.classList.remove('active');
    });
  });
  document.querySelectorAll('.modal-close, .modal-close-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) overlay.classList.remove('active');
    });
  });
}

// ── Toast Notification
function showToast(message, type = 'success') {
  const container = document.querySelector('.toast-container') || (() => {
    const c = document.createElement('div');
    c.className = 'toast-container';
    document.body.appendChild(c);
    return c;
  })();

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  toast.innerHTML = `
    <span class="toast-icon">${icons[type] || '✅'}</span>
    <span class="toast-msg">${message}</span>
  `;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.transform = 'translateX(120%)';
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 320);
  }, 3200);
}

// ── Filter chips
function initFilterChips() {
  const chips = document.querySelectorAll('.filter-chip');
  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
    });
  });
}

// ── Map zoom buttons
function initMapControls() {
  const mapContainer = document.getElementById('mapVisual');
  if (!mapContainer) return;
  let scale = 1;
  const applyScale = () => {
    mapContainer.style.transform = `scale(${scale})`;
    mapContainer.style.transformOrigin = 'center center';
    mapContainer.style.transition = 'transform 0.2s ease';
  };
  document.getElementById('zoomIn')?.addEventListener('click', () => {
    scale = Math.min(scale + 0.2, 2.2);
    applyScale();
  });
  document.getElementById('zoomOut')?.addEventListener('click', () => {
    scale = Math.max(scale - 0.2, 0.6);
    applyScale();
  });
  document.getElementById('zoomReset')?.addEventListener('click', () => {
    scale = 1;
    applyScale();
  });
}

// ── Bottom navigation — HTML dagi active classi saqlangan holda JS ham yangilaydi
function initBottomNav() {
  const btns = document.querySelectorAll('.bottom-nav-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const href = btn.dataset.href;
      if (href && href !== '#') {
        window.location.href = href;
      }
    });
  });

  // Active state: URL ga qarab avtomatik o'rnatiladi
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  btns.forEach(btn => {
    btn.classList.remove('active');
    if (btn.dataset.href === currentPage) {
      btn.classList.add('active');
    }
  });
}

// ── Search functionality (real-time)
function initSearch() {
  const searchInput = document.querySelector('.search-bar input');
  if (!searchInput) return;
  let timeout;
  searchInput.addEventListener('input', () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      const query = searchInput.value.toLowerCase().trim();
      filterVenuesBySearch(query);
    }, 280);
  });
}

function filterVenuesBySearch(query) {
  const cards = document.querySelectorAll('.venue-card');
  let visibleCount = 0;
  cards.forEach(card => {
    const name = card.querySelector('.venue-name')?.textContent.toLowerCase() || '';
    const sport = card.dataset.sport?.toLowerCase() || '';
    const badge = card.querySelector('.venue-sport-badge')?.textContent.toLowerCase() || '';
    const visible = !query || name.includes(query) || sport.includes(query) || badge.includes(query);
    card.style.display = visible ? '' : 'none';
    if (visible) visibleCount++;
  });
  const countEl = document.getElementById('resultCount');
  if (countEl) countEl.textContent = visibleCount + ' ta natija topildi';
}

// ── Scroll animations — FIX: opacity=0 qo'yishdan oldin IntersectionObserver tayyor bo'ladi
function initScrollAnimations() {
  if (!('IntersectionObserver' in window)) return;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
        entry.target.style.transition = 'opacity 0.45s ease, transform 0.45s ease';
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08 });

  // Faqat viewport tashqarisidagi elementlarga qo'llanadi
  document.querySelectorAll('.venue-card, .stat-card, .why-card, .sport-type-card').forEach(el => {
    const rect = el.getBoundingClientRect();
    // Agar element ekranda ko'rinib tursa, animatsiya qo'llanmaydi
    if (rect.top > window.innerHeight) {
      el.style.opacity = '0';
      el.style.transform = 'translateY(18px)';
    }
    observer.observe(el);
  });
}

// ── Counter animation for stats
function animateCounters() {
  const counters = document.querySelectorAll('.stat-value[data-target]');
  counters.forEach(counter => {
    const target = parseInt(counter.dataset.target);
    const suffix = counter.dataset.suffix || '';
    const duration = 1400;
    const start = performance.now();

    function update(timestamp) {
      const progress = Math.min((timestamp - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      counter.textContent = Math.floor(eased * target) + suffix;
      if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
  });
}

function initCounterAnimation() {
  const statsSection = document.querySelector('.stats-section');
  if (!statsSection) return;
  const observer = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
      animateCounters();
      observer.disconnect();
    }
  }, { threshold: 0.4 });
  observer.observe(statsSection);
}

// ── Gallery thumbnails
function initGallery() {
  const thumbs = document.querySelectorAll('.venue-thumb');
  if (!thumbs.length) return;
  thumbs.forEach(thumb => {
    thumb.addEventListener('click', () => {
      thumbs.forEach(t => t.classList.remove('active-thumb'));
      thumb.classList.add('active-thumb');
    });
  });
}

// ── Venue card click → detail page
function initVenueCardClick() {
  document.querySelectorAll('.venue-card').forEach(card => {
    card.addEventListener('click', e => {
      // Fav button bosilmagan bo'lsa detail ga o'tadi
      if (!e.target.closest('.venue-fav')) {
        const link = card.querySelector('a[href]');
        if (link) window.location.href = link.href;
      }
    });
  });
}

// ── URL query params
function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ── Tab filter buttons (bookings page)
function initTabButtons() {
  const tabBtns = document.querySelectorAll('.tab-btn');
  tabBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      tabBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
}

// ── Cancel booking
function initCancelBooking() {
  document.querySelectorAll('.cancel-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (confirm('Bronni bekor qilishni tasdiqlaysizmi?')) {
        const item = btn.closest('.booking-item');
        if (!item) return;
        const statusEl = item.querySelector('.booking-status');
        if (statusEl) {
          statusEl.className = 'booking-status status-cancelled';
          statusEl.textContent = '❌ Bekor qilingan';
        }
        btn.remove();
        item.style.opacity = '0.55';
        showToast('Bron bekor qilindi', 'info');
      }
    });
  });
}

// ════════════════════════════════════
//  INIT — Hammasi DOMContentLoaded da
// ════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initNavbarScroll();
  initSportTabs();
  initFavourites();
  initDateTabs();
  initTimeSlots();
  initMapVenueList();
  initMapPins();
  initSportTypeCards();
  initBookingButton();
  initModalClose();
  initFilterChips();
  initMapControls();
  initBottomNav();
  initSearch();
  initScrollAnimations();
  initCounterAnimation();
  initGallery();
  initVenueCardClick();
  initTabButtons();
  initCancelBooking();

  // URL dan sport parametrini olish
  const sport = getQueryParam('sport');
  if (sport) {
    const tab = document.querySelector(`.sport-tab[data-sport="${sport}"]`);
    if (tab) tab.click();
  }
});

// Global export
window.PlayArena = {
  showToast,
  openSuccessModal,
  closeSuccessModal,
  filterVenuesBySport,
};
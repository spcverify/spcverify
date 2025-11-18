// script.js
// Clean, robust, tested — works with the provided index.html + design.css
(() => {
  const LS = {
    THEME: 'spc_theme',
    SIDEBAR: 'spc_sidebar_collapsed',
    PROFILE: 'spc_profile',
    CARDS: 'spc_cards_order'
  };

  // short selectors
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const safeParse = (s, d) => { try { return JSON.parse(s); } catch { return d; } };

  // elements
  const app = $('#app');
  const sidebar = $('#sidebar');
  const collapseBtn = $('#collapseBtn');
  const themeToggle = $('#themeToggle');
  const profileBtn = $('#profileBtn');
  const profilePopup = $('#profilePopup');
  const closePopup = $('#closePopup');
  const avatarInput = $('#avatarInput');
  const popupAvatar = $('#popupAvatar');
  const headerAvatar = document.querySelector('.profile .avatar');
  const removeAvatarBtn = $('#removeAvatar');
  const saveProfileBtn = $('#saveProfile');
  const cancelProfileBtn = $('#cancelProfile');
  const inpName = $('#inpName');
  const inpEmail = $('#inpEmail');
  const grid = $('#grid');
  const navItems = $$('.nav-item');

  // toasts container
  let toastsRoot = $('#toasts');
  if (!toastsRoot) {
    toastsRoot = document.createElement('div');
    toastsRoot.id = 'toasts';
    toastsRoot.className = 'toasts';
    document.body.appendChild(toastsRoot);
  }

  function toast(msg, ms = 3000) {
    const el = document.createElement('div');
    el.className = 'toast';
    el.innerText = msg;
    toastsRoot.appendChild(el);
    requestAnimationFrame(() => el.classList.add('show'));
    setTimeout(() => {
      el.classList.remove('show');
      setTimeout(() => el.remove(), 250);
    }, ms);
  }

  // localStorage helpers
  const persist = (k, v) => {
    try { localStorage.setItem(k, typeof v === 'string' ? v : JSON.stringify(v)); } catch(e) {}
  };
  const read = (k, fallback = null) => {
    try { const v = localStorage.getItem(k); return v === null ? fallback : v; } catch(e) { return fallback; }
  };

  // THEME
  function applyTheme() {
    const t = read(LS.THEME, 'light');
    if (t === 'dark') {
      app.classList.add('theme-dark');
      themeToggle && (themeToggle.textContent = 'Light Mode');
      themeToggle && themeToggle.setAttribute('aria-pressed', 'true');
    } else {
      app.classList.remove('theme-dark');
      themeToggle && (themeToggle.textContent = 'Dark Mode');
      themeToggle && themeToggle.setAttribute('aria-pressed', 'false');
    }
  }
  themeToggle && themeToggle.addEventListener('click', () => {
    const isDark = app.classList.toggle('theme-dark');
    persist(LS.THEME, isDark ? 'dark' : 'light');
    themeToggle.textContent = isDark ? 'Light Mode' : 'Dark Mode';
    themeToggle.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    toast(isDark ? 'Dark mode enabled' : 'Light mode enabled', 1200);
  });

  // SIDEBAR
  function applySidebar() {
    const v = read(LS.SIDEBAR, 'false');
    if (v === 'true') {
      sidebar.classList.add('collapsed');
      document.body.classList.add('sidebar-collapsed');
    } else {
      sidebar.classList.remove('collapsed');
      document.body.classList.remove('sidebar-collapsed');
    }
  }
  collapseBtn && collapseBtn.addEventListener('click', () => {
    if (!sidebar) return;
    const collapsed = sidebar.classList.toggle('collapsed');
    document.body.classList.toggle('sidebar-collapsed', collapsed);
    persist(LS.SIDEBAR, collapsed ? 'true' : 'false');
  });

  // PROFILE load/save
  function defaultProfile() {
    return {
      name: 'Ali Hamza',
      email: 'ali@example.com',
      avatar: document.querySelector('.profile .avatar').src // current default inline SVG
    };
  }
  function loadProfile() {
    const raw = read(LS.PROFILE, null);
    if (!raw) {
      const def = defaultProfile();
      persist(LS.PROFILE, def);
      return def;
    }
    return safeParse(raw, defaultProfile());
  }
  function saveProfile(obj) {
    persist(LS.PROFILE, obj);
  }
  function updateProfileUI(p) {
    const nameEl = $('#headerName');
    const roleEl = $('#headerRole');
    if (nameEl) nameEl.textContent = p.name || nameEl.textContent;
    if (roleEl) roleEl.textContent = 'Main Owner';
    if (headerAvatar) headerAvatar.src = p.avatar || headerAvatar.src;
    if (popupAvatar) popupAvatar.src = p.avatar || popupAvatar.src;
    if (inpName) inpName.value = p.name || '';
    if (inpEmail) inpEmail.value = p.email || '';
  }

  // PROFILE POPUP
  function openProfilePopup() {
    if (!profilePopup) return;
    profilePopup.style.display = 'flex';
    profilePopup.setAttribute('aria-hidden', 'false');
    setTimeout(() => inpName && inpName.focus(), 120);
  }
  function closeProfilePopup() {
    if (!profilePopup) return;
    profilePopup.style.display = 'none';
    profilePopup.setAttribute('aria-hidden', 'true');
  }
  profileBtn && profileBtn.addEventListener('click', openProfilePopup);
  closePopup && closePopup.addEventListener('click', closeProfilePopup);
  cancelProfileBtn && cancelProfileBtn.addEventListener('click', closeProfilePopup);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeProfilePopup(); });
  profilePopup && profilePopup.addEventListener('click', (ev) => { if (ev.target === profilePopup) closeProfilePopup(); });

  // avatar upload
  avatarInput && avatarInput.addEventListener('change', (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      if (popupAvatar) popupAvatar.src = ev.target.result;
      if (headerAvatar) headerAvatar.src = ev.target.result;
      const p = loadProfile();
      p.avatar = ev.target.result;
      saveProfile(p);
      toast('Profile picture updated', 1200);
    };
    reader.readAsDataURL(f);
  });
  removeAvatarBtn && removeAvatarBtn.addEventListener('click', () => {
    const def = defaultProfile().avatar;
    if (popupAvatar) popupAvatar.src = def;
    if (headerAvatar) headerAvatar.src = def;
    const p = loadProfile(); p.avatar = def; saveProfile(p);
    toast('Profile picture removed', 1200);
  });

  // save profile
  saveProfileBtn && saveProfileBtn.addEventListener('click', () => {
    const name = inpName ? inpName.value.trim() : '';
    const email = inpEmail ? inpEmail.value.trim() : '';
    if (!name) { toast('Name required', 1400); inpName && inpName.focus(); return; }
    if (!email) { toast('Email required', 1400); inpEmail && inpEmail.focus(); return; }
    const p = loadProfile();
    p.name = name; p.email = email;
    saveProfile(p);
    updateProfileUI(p);
    closeProfilePopup();
    toast('Profile saved', 1200);
  });

  // NAV behavior (show one section at a time)
  navItems.forEach(it => {
    it.addEventListener('click', () => {
      navItems.forEach(i => i.classList.remove('active'));
      it.classList.add('active');
      const target = it.dataset.target;
      // hide all .content sections, then show the requested
      const contentSections = document.querySelectorAll('main .content, main section.content');
      contentSections.forEach(s => s.style.display = 'none');
      const section = document.getElementById(target);
      if (section) section.style.display = 'block';
      else {
        const dash = document.getElementById('dashboard');
        if (dash) dash.style.display = 'block';
      }
    });
  });

  // DRAG & DROP with persistence
  function restoreCardOrder() {
    if (!grid) return;
    const saved = safeParse(read(LS.CARDS), []);
    if (!Array.isArray(saved) || saved.length === 0) return;
    const map = {};
    [...grid.querySelectorAll('.card')].forEach(c => { if (c.id) map[c.id] = c; });
    saved.forEach(id => { if (map[id]) grid.appendChild(map[id]); });
  }
  function saveCardOrder() {
    if (!grid) return;
    const ids = [...grid.querySelectorAll('.card')].map(c => c.id || '');
    persist(LS.CARDS, ids);
  }
  function enableDnD() {
    if (!grid) return;
    let dragging = null;
    grid.addEventListener('dragstart', (e) => {
      const el = e.target.closest('.card');
      if (!el) return;
      dragging = el;
      el.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    grid.addEventListener('dragend', (e) => {
      if (dragging) dragging.classList.remove('dragging');
      dragging = null;
      saveCardOrder();
    });
    grid.addEventListener('dragover', (e) => {
      e.preventDefault();
      const after = getDragAfterElement(grid, e.clientY);
      const drag = grid.querySelector('.dragging');
      if (!drag) return;
      if (!after) grid.appendChild(drag);
      else grid.insertBefore(drag, after);
    });
  }
  function getDragAfterElement(container, y) {
    const els = [...container.querySelectorAll('.card:not(.dragging)')];
    return els.reduce((closest, child) => {
      const box = child.getBoundingClientRect();
      const offset = y - box.top - box.height / 2;
      if (offset < 0 && offset > closest.offset) return { offset, element: child };
      return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
  }

  // init
  function init() {
    applyTheme();
    applySidebar();
    const p = loadProfile();
    updateProfileUI(p);
    restoreCardOrder();
    enableDnD();
    // show dashboard by default
    document.getElementById('dashboard') && (document.getElementById('dashboard').style.display = 'block');

    // small demo buttons
    const addBtn = $('#addScammerBtn');
    addBtn && addBtn.addEventListener('click', () => toast('Demo: Add Scammer — connect backend to save', 1500));
    const expBtn = $('#exportCSV');
    expBtn && expBtn.addEventListener('click', () => toast('Demo: Export CSV — not implemented', 1500));
  }

  // run when ready
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  // expose for debugging
  window.SPC = { read, persist, loadProfile, saveProfile, toast, saveCardOrder, restoreCardOrder };
})();

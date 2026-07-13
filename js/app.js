/* ==========================================================================
   Cherry — App shell (sidebar + mobile topbar)
   Include after api.js, ui.js, auth.js. Call renderShell('home') on load.
   ========================================================================== */

const NAV_ICONS = {
  home:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V10"/></svg>',
  explore:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="m14.5 9.5-2 5-5 2 2-5 5-2Z"/></svg>',
  bell:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  bookmark:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>',
  user:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6l-8-3Z"/></svg>',
  logout: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></svg>',
  menu:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M3 6h18M3 12h18M3 18h18"/></svg>',
  search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></svg>',
  mail:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
};

const LOGO_SVG = `<svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M20 6c-1.5 2-2 4-2 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <path d="M20 6c2-1.3 4-1.6 5.5-1" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
  <circle cx="12" cy="21" r="7" fill="#111111"/>
  <circle cx="22" cy="19" r="6" fill="#595959"/>
</svg>`;

const NAV_ITEMS = [
  { key:'home',          label:'Home',          href:'home.html',          icon:'home' },
  { key:'users',         label:'Explore',       href:'users.html',         icon:'explore' },
  { key:'messages',      label:'Messages',      href:'messages.html',      icon:'mail' },
  { key:'notifications', label:'Notifications', href:'notifications.html', icon:'bell' },
  { key:'bookmarks',     label:'Bookmarks',      href:'bookmarks.html',    icon:'bookmark' },
  { key:'profile',       label:'Profile',       href:'profile.html',       icon:'user' },
  { key:'admin',         label:'Admin',         href:'admin.html',         icon:'shield' },
];

function renderShell(activeKey){
  requireAuth();
  const user = getStoredUser() || {};
  const name = pick(user, ['displayName','username','name'], 'You');
  const handle = pick(user, ['username'], '');

  const isAdmin = String(pick(user, ['role'], '')).toUpperCase() === 'ADMIN';
  const navHtml = NAV_ITEMS
    .filter(item => item.key !== 'admin' || isAdmin)
    .map(item => `
    <a class="nav-link ${item.key === activeKey ? 'active' : ''}" href="${item.href}">
      ${NAV_ICONS[item.icon]}<span>${item.label}</span>
      ${item.key === 'messages' ? '<span class="badge-count" id="messages-badge" style="display:none;"></span>' : ''}
    </a>
  `).join('');

  const sidebarHtml = `
    <div class="logo"><span class="logo-word">Cherry</span>${LOGO_SVG}</div>
    <button type="button" class="search-box global-search-btn" id="global-search-btn" style="width:100%;border:1.5px solid var(--border);border-radius:var(--radius-sm);background:var(--tint-2);cursor:pointer;padding:10px 12px 10px 38px;text-align:left;font:inherit;color:var(--slate-light);">
      ${NAV_ICONS.search}<span>Search Cherry…</span>
    </button>
    <ul class="nav-list">
      ${navHtml}
    </ul>
    <div class="sidebar-foot">
      <a class="sidebar-user" href="profile.html">
        ${avatarHtml(user, 36)}
        <div>
          <div class="sidebar-user-name">${escapeHtml(name)}</div>
          <div class="sidebar-user-handle">@${escapeHtml(handle)}</div>
        </div>
      </a>
      <a class="nav-link" href="#" id="logout-link" style="margin-top:6px;">
        ${NAV_ICONS.logout}<span>Log out</span>
      </a>
    </div>
  `;

  const sidebarRoot = document.getElementById('sidebar');
  if (sidebarRoot){
    sidebarRoot.innerHTML = sidebarHtml;
  }

  const topbarRoot = document.getElementById('topbar-root');
  if (topbarRoot){
    topbarRoot.innerHTML = `
      <button class="icon-btn" id="menu-toggle" aria-label="Open menu">${NAV_ICONS.menu}</button>
      <div class="logo"><span class="logo-word">Cherry</span>${LOGO_SVG}</div>
      <button class="icon-btn" id="topbar-search-btn" aria-label="Search">${NAV_ICONS.search}</button>
      <a href="profile.html">${avatarHtml(user, 28)}</a>
    `;
  }

  const overlay = document.getElementById('sidebar-overlay');
  const sidebarEl = document.getElementById('sidebar');
  document.getElementById('menu-toggle')?.addEventListener('click', () => {
    sidebarEl?.classList.add('open');
    overlay?.classList.add('open');
  });
  overlay?.addEventListener('click', () => {
    sidebarEl?.classList.remove('open');
    overlay?.classList.remove('open');
  });

  document.getElementById('global-search-btn')?.addEventListener('click', () => openGlobalSearchModal());
  document.getElementById('topbar-search-btn')?.addEventListener('click', () => openGlobalSearchModal());

  refreshMessagesBadge();
  setInterval(refreshMessagesBadge, 15000);

  document.getElementById('logout-link')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const ok = await confirmModal({
      title:'Log out of Cherry?',
      message:'You can always sign back in.',
      confirmText:'Log out',
      danger:true
    });
    if (ok) doLogout();
  });

  // Refresh user info in background (in case profile changed elsewhere)
  refreshStoredUser().then((fresh) => {
    if (fresh) renderSidebarUserOnly(fresh);
  });
}

function renderSidebarUserOnly(user){
  const nameEl = document.querySelector('.sidebar-user-name');
  const handleEl = document.querySelector('.sidebar-user-handle');
  const avatarWrap = document.querySelector('.sidebar-user .avatar');
  if (nameEl) nameEl.textContent = pick(user, ['displayName','username','name'], 'You');
  if (handleEl) handleEl.textContent = '@' + pick(user, ['username'], '');
  if (avatarWrap && avatarWrap.parentElement){
    avatarWrap.outerHTML = avatarHtml(user, 36);
  }
}

async function refreshMessagesBadge(){
  const badge = document.getElementById('messages-badge');
  if (!badge) return;
  try{
    const count = await api.getUnreadMessageCount();
    const n = typeof count === 'number' ? count : 0;
    if (n > 0){
      badge.textContent = n > 99 ? '99+' : String(n);
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  }catch(err){
    // quietly ignore — badge just stays hidden
  }
}

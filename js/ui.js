/* ==========================================================================
   Cherry — UI helpers (toasts, modals, formatting)
   No window.alert / window.confirm / window.prompt is used anywhere —
   everything below renders in-page instead.
   ========================================================================== */

/* ---------- Toasts ---------- */
function ensureToastStack(){
  let stack = document.querySelector('.toast-stack');
  if (!stack){
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

const ICONS = {
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M20 6 9 17l-5-5"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M18 6 6 18M6 6l12 12"/></svg>',
  info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
};

function toast(message, type = 'default', duration = 3400){
  const stack = ensureToastStack();
  const el = document.createElement('div');
  el.className = 'toast' + (type === 'success' ? ' success' : type === 'error' ? ' error' : '');
  const icon = type === 'success' ? ICONS.check : type === 'error' ? ICONS.x : ICONS.info;
  el.innerHTML = icon + '<span></span>';
  el.querySelector('span').textContent = message;
  stack.appendChild(el);
  setTimeout(() => {
    el.style.transition = 'opacity .2s ease, transform .2s ease';
    el.style.opacity = '0';
    el.style.transform = 'translateY(-6px)';
    setTimeout(() => el.remove(), 200);
  }, duration);
}
function toastSuccess(msg){ toast(msg, 'success'); }
function toastError(msg){ toast(msg instanceof Error ? msg.message : msg, 'error'); }

/* ---------- Modal (generic) ---------- */
function ensureModalRoot(){
  let overlay = document.getElementById('modal-root');
  if (!overlay){
    overlay = document.createElement('div');
    overlay.id = 'modal-root';
    overlay.className = 'modal-overlay';
    overlay.innerHTML = '<div class="modal" id="modal-content"></div>';
    document.body.appendChild(overlay);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) closeModal(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });
  }
  return overlay;
}
function openModal(innerHTML, opts = {}){
  const overlay = ensureModalRoot();
  const content = document.getElementById('modal-content');
  content.className = 'modal' + (opts.wide ? ' modal-wide' : '');
  content.innerHTML = innerHTML;
  overlay.classList.add('open');
  return content;
}
function closeModal(){
  const overlay = document.getElementById('modal-root');
  if (overlay) overlay.classList.remove('open');
}

/* ---------- Confirm dialog (replaces window.confirm) ---------- */
function confirmModal({ title = 'Are you sure?', message = '', confirmText = 'Confirm', cancelText = 'Cancel', danger = false } = {}){
  return new Promise((resolve) => {
    const content = openModal(`
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(message)}</p>
      <div class="modal-actions">
        <button class="btn btn-ghost" data-act="cancel">${escapeHtml(cancelText)}</button>
        <button class="btn ${danger ? 'btn-danger-solid' : 'btn-primary'}" data-act="confirm">${escapeHtml(confirmText)}</button>
      </div>
    `);
    content.querySelector('[data-act="cancel"]').onclick = () => { closeModal(); resolve(false); };
    content.querySelector('[data-act="confirm"]').onclick = () => { closeModal(); resolve(true); };
  });
}

/* ---------- Misc helpers ---------- */
function escapeHtml(str){
  if (str === null || str === undefined) return '';
  return String(str)
    .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
    .replaceAll('"','&quot;').replaceAll("'",'&#039;');
}

// Pick the first defined/non-null value among possible field name variants.
// Used because we don't have the backend's *ResponseDTO field names —
// this keeps the UI working across common naming conventions.
function pick(obj, keys, fallback = undefined){
  if (!obj) return fallback;
  for (const k of keys){
    if (obj[k] !== undefined && obj[k] !== null && obj[k] !== '') return obj[k];
  }
  return fallback;
}

function initials(name){
  if (!name) return '?';
  const parts = String(name).trim().split(/\s+/);
  const s = parts.length > 1 ? (parts[0][0] + parts[1][0]) : name.slice(0,2);
  return s.toUpperCase();
}

function resolveImageUrl(path){
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith('/')) return API_BASE + path;
  return API_BASE + '/' + path;
}

function timeAgo(dateStr){
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '';
  const diff = Math.max(0, (Date.now() - d.getTime()) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff/60) + 'm';
  if (diff < 86400) return Math.floor(diff/3600) + 'h';
  if (diff < 604800) return Math.floor(diff/86400) + 'd';
  return d.toLocaleDateString(undefined, { month:'short', day:'numeric', year: d.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined });
}

function avatarHtml(user, size = 44){
  const img = resolveImageUrl(pick(user, ['imageUrl','profileImage','picture','image','profilePicture','avatarUrl']));
  const name = pick(user, ['displayName','username','name'], 'User');
  const cls = `avatar avatar-${size}`;
  if (img){
    return `<div class="${cls}"><img src="${img}" alt="${escapeHtml(name)}" onerror="this.parentElement.innerHTML='${initials(name)}'"></div>`;
  }
  return `<div class="${cls}">${initials(name)}</div>`;
}

function setLoading(container, on, message){
  if (!container) return;
  if (on){
    container.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  }
}

function emptyState(icon, title, subtitle){
  return `
    <div class="empty-state">
      ${icon || ''}
      <h3>${escapeHtml(title)}</h3>
      <p>${escapeHtml(subtitle || '')}</p>
    </div>
  `;
}

const ICON_SVGS = {
  inbox: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M4 12h4l2 3h4l2-3h4"/><path d="M4 12 5.5 5A2 2 0 0 1 7.4 3h9.2a2 2 0 0 1 1.9 2L20 12v6a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-6Z"/></svg>',
  users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
  bookmark: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>',
  bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
};

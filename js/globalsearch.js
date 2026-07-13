/* ==========================================================================
   Cherry — Global search
   Available from every page (sidebar button on desktop, icon in the
   mobile topbar). Searches people and insights together and lets you
   jump straight to a profile or an insight.
   ========================================================================== */
let gsDebounce = null;

function openGlobalSearchModal(){
  const modal = openModal(`
    <h3>Search Cherry</h3>
    <div class="field" style="margin-top:14px;">
      <input type="text" id="global-search-input" placeholder="Search people or insights…" autocomplete="off">
    </div>
    <div id="global-search-results" style="max-height:360px;overflow-y:auto;margin-top:6px;">
      <p class="text-sm text-muted">Start typing to search people and insights.</p>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close">Close</button>
    </div>
  `);
  modal.querySelector('[data-act="close"]').onclick = closeModal;

  const input = document.getElementById('global-search-input');
  const results = document.getElementById('global-search-results');
  input.focus();

  input.addEventListener('input', () => {
    clearTimeout(gsDebounce);
    const keyword = input.value.trim();
    if (!keyword){
      results.innerHTML = `<p class="text-sm text-muted">Start typing to search people and insights.</p>`;
      return;
    }
    gsDebounce = setTimeout(() => runGlobalSearch(keyword, results), 350);
  });
}

async function runGlobalSearch(keyword, results){
  results.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;

  const [usersRes, postsRes] = await Promise.allSettled([
    api.searchUsers(keyword),
    api.searchPosts(keyword)
  ]);

  const users = (usersRes.status === 'fulfilled' && Array.isArray(usersRes.value)) ? usersRes.value : [];
  const posts = (postsRes.status === 'fulfilled' && Array.isArray(postsRes.value)) ? postsRes.value : [];

  if (!users.length && !posts.length){
    results.innerHTML = emptyState(ICON_SVGS.inbox, 'No results', 'Try a different search.');
    return;
  }

  let html = '';

  if (users.length){
    html += `<div class="text-sm" style="font-weight:700;color:var(--slate);margin:10px 0 6px;">People</div>`;
    html += users.slice(0, 6).map(u => {
      const id = pick(u, ['id','userId']);
      const name = pick(u, ['displayName','name'], pick(u, ['username'], 'User'));
      const username = pick(u, ['username'], '');
      return `
        <div class="gs-row" data-href="profile.html?id=${id}">
          ${avatarHtml(u, 36)}
          <div>
            <div class="gs-row-title">${escapeHtml(name)}</div>
            <div class="text-sm text-muted">@${escapeHtml(username)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  if (posts.length){
    html += `<div class="text-sm" style="font-weight:700;color:var(--slate);margin:14px 0 6px;">Insights</div>`;
    html += posts.slice(0, 6).map(p => {
      const id = pick(p, ['id','postId']);
      const title = pick(p, ['title'], '');
      const content = pick(p, ['content','body','text'], '');
      const author = p.user || p.author || p.owner || p;
      const authorName = pick(author, ['displayName','name'], pick(author, ['username'], 'Someone'));
      const label = title || content.slice(0, 60) || 'Untitled insight';
      return `
        <div class="gs-row" data-href="post.html?id=${id}">
          <div>
            <div class="gs-row-title">${escapeHtml(label)}</div>
            <div class="text-sm text-muted">by ${escapeHtml(authorName)}</div>
          </div>
        </div>
      `;
    }).join('');
  }

  results.innerHTML = html;
  results.querySelectorAll('.gs-row').forEach(row => {
    row.addEventListener('click', () => { location.href = row.dataset.href; });
  });
}

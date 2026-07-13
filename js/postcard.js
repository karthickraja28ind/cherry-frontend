/* ==========================================================================
   Cherry — Post card component
   Shared by home.html, post.html, profile.html, bookmarks.html.

   PostResponseDTO fields (confirmed): id, userId, title, content, username,
   imageUrl, createdAt, updatedAt. There is no nested "user" object — author
   info comes from the flat username/userId fields directly on the post.
   ========================================================================== */

function postAuthorObj(post){
  return post.user || post.author || post.owner || post;
}

function postId(post){ return pick(post, ['id','postId']); }

function renderPostCard(post, opts = {}){
  const author = postAuthorObj(post);
  const id = postId(post);
  const title = pick(post, ['title']);
  const content = pick(post, ['content','body','text'], '');
  const image = resolveImageUrl(pick(post, ['imageUrl','image','imagePath','postImage']));
  const authorName = pick(author, ['displayName','name'], pick(author, ['username'], 'Unknown'));
  const username = pick(author, ['username'], '');
  const authorId = pick(post, ['userId','authorId']);
  const created = pick(post, ['createdAt','postedAt','date','createdDate'], '');
  const me = getStoredUser() || {};
  const myId = pick(me, ['id','userId']);
  const isMine = myId && authorId && String(myId) === String(authorId);

  return `
    <article class="card post-card" data-post-id="${id}">
      <div class="post-head">
        <a href="profile.html${authorId ? '?id=' + authorId : ''}">${avatarHtml(author, 44)}</a>
        <div class="post-head-meta">
          <div class="post-author-row">
            <a class="post-author" href="profile.html${authorId ? '?id=' + authorId : ''}">${escapeHtml(authorName)}</a>
            ${username ? `<span class="post-username">@${escapeHtml(username)}</span>` : ''}
            ${created ? `<span class="post-dot"></span><span class="post-time">${escapeHtml(timeAgo(created))}</span>` : ''}
          </div>
        </div>
        <div class="action-menu-wrap">
          <button class="icon-btn menu-toggle" title="More" style="color:var(--slate);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>
          </button>
          <div class="dropdown">
            ${isMine ? `
              <div class="dropdown-item" data-act="edit">✏️ Edit insight</div>
              <div class="dropdown-item danger" data-act="delete">🗑️ Delete insight</div>
            ` : `
              <div class="dropdown-item" data-act="visit-profile">👤 View profile</div>
            `}
            ${opts.isAdmin ? `<div class="dropdown-item danger" data-act="admin-delete">🛡️ Admin: remove insight</div>` : ''}
          </div>
        </div>
      </div>

      ${title ? `<a href="post.html?id=${id}" style="text-decoration:none;color:inherit;"><div class="post-title">${escapeHtml(title)}</div></a>` : ''}
      <a href="post.html?id=${id}" style="text-decoration:none;color:inherit;">
        <div class="post-content">${escapeHtml(content)}</div>
      </a>
      ${image ? `<a href="post.html?id=${id}"><div class="post-image"><img src="${image}" alt="Insight image" loading="lazy"></div></a>` : ''}

      <div class="post-actions">
        <button class="action-btn" data-act="like" title="Vote">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8Z"/></svg>
          <span class="like-count">–</span>
        </button>
        <button class="action-btn" data-act="comment">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M21 11.5a8.4 8.4 0 0 1-8.9 8.4A9 9 0 0 1 8 19l-5 1 1.5-4.3A8.4 8.4 0 1 1 21 11.5Z"/></svg>
          <span class="comment-count">–</span>
        </button>
        <button class="action-btn" data-act="bookmark">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M19 21 12 16l-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16Z"/></svg>
          <span>Save</span>
        </button>
        <button class="action-btn" data-act="share" title="Copy link">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 10.5 15.4 6.5M8.6 13.5 15.4 17.5"/></svg>
          <span>Share</span>
        </button>
      </div>
    </article>
  `;
}

function wirePostCard(cardEl, post, handlers = {}){
  const id = postId(post);

  // dropdown menu toggle
  const menuBtn = cardEl.querySelector('.menu-toggle');
  const dropdown = cardEl.querySelector('.dropdown');
  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown?.classList.remove('open'));

  dropdown?.querySelector('[data-act="delete"]')?.addEventListener('click', async () => {
    const ok = await confirmModal({ title:'Delete this insight?', message:'This cannot be undone.', confirmText:'Delete', danger:true });
    if (!ok) return;
    try{
      await api.deletePost(id);
      toastSuccess('Insight deleted.');
      cardEl.remove();
      handlers.onDeleted?.(id);
    }catch(err){ toastError(err); }
  });

  dropdown?.querySelector('[data-act="admin-delete"]')?.addEventListener('click', async () => {
    const ok = await confirmModal({ title:'Remove this insight as admin?', message:'This cannot be undone.', confirmText:'Remove', danger:true });
    if (!ok) return;
    try{
      await api.adminDeletePost(id);
      toastSuccess('Insight removed.');
      cardEl.remove();
      handlers.onDeleted?.(id);
    }catch(err){ toastError(err); }
  });

  dropdown?.querySelector('[data-act="edit"]')?.addEventListener('click', () => openEditPostModal(post, cardEl));

  dropdown?.querySelector('[data-act="visit-profile"]')?.addEventListener('click', () => {
    const authorId = pick(post, ['userId','authorId']);
    if (authorId) location.href = 'profile.html?id=' + authorId;
  });

  // like
  const likeBtn = cardEl.querySelector('[data-act="like"]');
  const likeCountEl = cardEl.querySelector('.like-count');
  api.countLikes(id).then(c => { likeCountEl.textContent = (typeof c === 'number') ? c : (c ?? 0); }).catch(() => { likeCountEl.textContent = '0'; });

  likeCountEl.style.cursor = 'pointer';
  likeCountEl.title = 'See who voted';
  likeCountEl.addEventListener('click', (e) => {
    e.stopPropagation();
    openVotersModal(id);
  });

  likeBtn?.addEventListener('click', async () => {
    const liked = likeBtn.classList.contains('liked');
    likeBtn.disabled = true;
    try{
      if (!liked){
        await api.addLike(id);
        likeBtn.classList.add('liked');
        likeCountEl.textContent = (parseInt(likeCountEl.textContent) || 0) + 1;
      } else {
        await api.deleteLike(id);
        likeBtn.classList.remove('liked');
        likeCountEl.textContent = Math.max(0, (parseInt(likeCountEl.textContent) || 1) - 1);
      }
    }catch(err){ toastError(err); }
    likeBtn.disabled = false;
  });

  // comment count + navigation
  const commentBtn = cardEl.querySelector('[data-act="comment"]');
  const commentCountEl = cardEl.querySelector('.comment-count');
  api.countComments(id).then(c => { commentCountEl.textContent = (typeof c === 'number') ? c : (c ?? 0); }).catch(() => { commentCountEl.textContent = '0'; });
  commentBtn?.addEventListener('click', () => { location.href = 'post.html?id=' + id; });

  commentCountEl.style.cursor = 'pointer';
  commentCountEl.title = 'See who commented';
  commentCountEl.addEventListener('click', (e) => {
    e.stopPropagation();
    openCommentersModal(id);
  });

  // bookmark
  const bookmarkBtn = cardEl.querySelector('[data-act="bookmark"]');
  if (opts_isBookmarked(post, handlers)) bookmarkBtn?.classList.add('saved');
  bookmarkBtn?.addEventListener('click', async () => {
    const saved = bookmarkBtn.classList.contains('saved');
    bookmarkBtn.disabled = true;
    try{
      if (!saved){
        await api.savePost(id);
        bookmarkBtn.classList.add('saved');
        bookmarkBtn.querySelector('span:last-child').textContent = 'Saved';
        toastSuccess('Saved to bookmarks.');
      } else {
        await api.removeSavedPost(id);
        bookmarkBtn.classList.remove('saved');
        bookmarkBtn.querySelector('span:last-child').textContent = 'Save';
        toastSuccess('Removed from bookmarks.');
        handlers.onUnbookmarked?.(id, cardEl);
      }
    }catch(err){ toastError(err); }
    bookmarkBtn.disabled = false;
  });

  // share (copy link)
  const shareBtn = cardEl.querySelector('[data-act="share"]');
  shareBtn?.addEventListener('click', async () => {
    const url = new URL('post.html?id=' + id, location.href).toString();
    try{
      if (navigator.clipboard && navigator.clipboard.writeText){
        await navigator.clipboard.writeText(url);
      } else {
        const tmp = document.createElement('textarea');
        tmp.value = url;
        tmp.style.position = 'fixed';
        tmp.style.opacity = '0';
        document.body.appendChild(tmp);
        tmp.select();
        document.execCommand('copy');
        tmp.remove();
      }
      toastSuccess('Link copied to clipboard.');
    }catch(err){
      toastError('Could not copy the link.');
    }
  });
}

function opts_isBookmarked(post, handlers){
  return !!handlers.startBookmarked;
}

// ---------- Who voted / who commented ----------
function userRowHtml(nameOrObj){
  // getAllLikes returns bare usernames (strings); comments give us full author objects
  if (typeof nameOrObj === 'string'){
    return `
      <div class="gs-row" data-username="${escapeHtml(nameOrObj)}">
        <div class="avatar avatar-36">${initials(nameOrObj)}</div>
        <div class="gs-row-title">@${escapeHtml(nameOrObj)}</div>
      </div>
    `;
  }
  const name = pick(nameOrObj, ['displayName','name'], pick(nameOrObj, ['username'], 'User'));
  const username = pick(nameOrObj, ['username'], '');
  return `
    <div class="gs-row" data-username="${escapeHtml(username)}">
      ${avatarHtml(nameOrObj, 36)}
      <div>
        <div class="gs-row-title">${escapeHtml(name)}</div>
        ${username ? `<div class="text-sm text-muted">@${escapeHtml(username)}</div>` : ''}
      </div>
    </div>
  `;
}

function wireUserRows(container){
  container.querySelectorAll('.gs-row').forEach(row => {
    row.addEventListener('click', () => {
      const username = row.dataset.username;
      if (username) location.href = 'users.html?q=' + encodeURIComponent(username);
    });
  });
}

async function openVotersModal(postId){
  const modal = openModal(`
    <h3>Who voted</h3>
    <div id="voters-list" style="max-height:360px;overflow-y:auto;margin-top:14px;">
      <div class="spinner-wrap"><div class="spinner"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close">Close</button>
    </div>
  `);
  modal.querySelector('[data-act="close"]').onclick = closeModal;
  const list = document.getElementById('voters-list');
  try{
    const voters = await api.getAllLikes(postId);
    if (!Array.isArray(voters) || !voters.length){
      list.innerHTML = emptyState(null, 'No votes yet', 'Be the first to vote on this.');
      return;
    }
    list.innerHTML = voters.map(userRowHtml).join('');
    wireUserRows(list);
  }catch(err){
    list.innerHTML = emptyState(null, "Couldn't load voters", err.message || '');
  }
}

async function openCommentersModal(postId){
  const modal = openModal(`
    <h3>Who commented</h3>
    <div id="commenters-list" style="max-height:360px;overflow-y:auto;margin-top:14px;">
      <div class="spinner-wrap"><div class="spinner"></div></div>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close">Close</button>
    </div>
  `);
  modal.querySelector('[data-act="close"]').onclick = closeModal;
  const list = document.getElementById('commenters-list');
  try{
    const comments = await api.getComments(postId);
    if (!Array.isArray(comments) || !comments.length){
      list.innerHTML = emptyState(null, 'No comments yet', 'Be the first to say something.');
      return;
    }
    // de-duplicate by username/id, keep the most recent comment's author info
    const seen = new Map();
    for (const c of comments){
      const author = c.user || c.author || c;
      const key = pick(c, ['userId','authorId'], pick(author, ['id','userId','username']));
      if (key !== undefined && key !== null) seen.set(String(key), author);
    }
    list.innerHTML = Array.from(seen.values()).map(userRowHtml).join('');
    wireUserRows(list);
  }catch(err){
    list.innerHTML = emptyState(null, "Couldn't load commenters", err.message || '');
  }
}

function openEditPostModal(post, cardEl){
  const id = postId(post);
  const title = pick(post, ['title'], '');
  const content = pick(post, ['content','body','text'], '');

  const content_html = `
    <h3>Edit insight</h3>
    <form id="edit-post-form">
      <div class="field">
        <label>Title</label>
        <input type="text" id="edit-title" value="${escapeHtml(title)}">
      </div>
      <div class="field">
        <label>Content</label>
        <textarea id="edit-content" rows="4">${escapeHtml(content)}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </div>
    </form>
  `;
  const modal = openModal(content_html);
  modal.querySelector('[data-act="cancel"]').onclick = closeModal;
  modal.querySelector('#edit-post-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newTitle = document.getElementById('edit-title').value.trim();
    const newContent = document.getElementById('edit-content').value.trim();
    try{
      await api.updatePost(id, { title: newTitle, content: newContent });
      toastSuccess('Insight updated.');
      closeModal();
      const titleEl = cardEl.querySelector('.post-title');
      const contentEl = cardEl.querySelector('.post-content');
      if (titleEl) titleEl.textContent = newTitle;
      if (contentEl) contentEl.textContent = newContent;
    }catch(err){ toastError(err); }
  });
}

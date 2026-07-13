/* ==========================================================================
   Cherry — Post detail page
   ========================================================================== */
renderShell('home');

const params = new URLSearchParams(location.search);
const currentPostId = params.get('id');
const postWrap = document.getElementById('post-wrap');
const commentsList = document.getElementById('comments-list');

document.getElementById('comment-avatar').innerHTML = avatarHtml(getStoredUser() || {}, 36);

if (!currentPostId){
  postWrap.innerHTML = emptyState(ICON_SVGS.inbox, 'No insight selected', 'Go back and choose an insight to view.');
} else {
  loadPost();
  loadComments();
}

async function loadPost(){
  try{
    const post = await api.getPost(currentPostId);
    postWrap.innerHTML = renderPostCard(post);
    const cardEl = postWrap.querySelector('.post-card');
    wirePostCard(cardEl, post, {
      onDeleted: () => { location.href = 'home.html'; }
    });
  }catch(err){
    postWrap.innerHTML = emptyState(ICON_SVGS.inbox, "Couldn't load this insight", err.message || 'It may have been removed.');
  }
}

async function loadComments(){
  commentsList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const comments = await api.getComments(currentPostId);
    renderComments(Array.isArray(comments) ? comments : []);
  }catch(err){
    commentsList.innerHTML = emptyState(null, 'No comments yet', 'Be the first to say something.');
  }
}

function renderComments(comments){
  if (!comments.length){
    commentsList.innerHTML = emptyState(null, 'No comments yet', 'Be the first to say something.');
    return;
  }
  const me = getStoredUser() || {};
  const myId = pick(me, ['id','userId']);
  const myUsername = pick(me, ['username']);
  const isAdmin = String(pick(me, ['role'], '')).toUpperCase() === 'ADMIN';

  commentsList.innerHTML = comments.map(c => {
    const author = c.user || c.author || c;
    const cid = pick(c, ['id','commentId']);
    const text = pick(c, ['content','text'], '');
    const authorName = pick(author, ['displayName','name','username'], 'User');
    const authorId = pick(c, ['userId','authorId'], pick(author, ['id']));
    const authorUsername = pick(author, ['username']);
    const isMine = (myId && authorId && String(myId) === String(authorId)) || (myUsername && authorUsername && myUsername === authorUsername);
    return `
      <div class="comment-row" data-comment-id="${cid}">
        ${avatarHtml(author, 36)}
        <div style="flex:1;">
          <div class="comment-bubble">
            <div class="comment-author">${escapeHtml(authorName)} ${isAdmin ? `<span class="text-sm text-muted" style="font-weight:400;">#${escapeHtml(String(cid))}</span>` : ''}</div>
            <div class="comment-text">${escapeHtml(text)}</div>
          </div>
          ${isMine ? `
            <div class="comment-actions">
              <button data-act="edit-comment">Edit</button>
              <button data-act="delete-comment">Delete</button>
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  commentsList.querySelectorAll('.comment-row').forEach(row => {
    const cid = row.dataset.commentId;
    row.querySelector('[data-act="delete-comment"]')?.addEventListener('click', async () => {
      const ok = await confirmModal({ title:'Delete comment?', confirmText:'Delete', danger:true });
      if (!ok) return;
      try{
        await api.deleteComment(cid);
        toastSuccess('Comment deleted.');
        row.remove();
      }catch(err){ toastError(err); }
    });
    row.querySelector('[data-act="edit-comment"]')?.addEventListener('click', () => {
      const textEl = row.querySelector('.comment-text');
      const current = textEl.textContent;
      const modal = openModal(`
        <h3>Edit comment</h3>
        <div class="field" style="margin-top:14px;">
          <textarea id="edit-comment-input" rows="3">${escapeHtml(current)}</textarea>
        </div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-act="cancel">Cancel</button>
          <button class="btn btn-primary" data-act="save">Save</button>
        </div>
      `);
      modal.querySelector('[data-act="cancel"]').onclick = closeModal;
      modal.querySelector('[data-act="save"]').onclick = async () => {
        const newText = document.getElementById('edit-comment-input').value.trim();
        if (!newText) return;
        try{
          await api.updateComment(cid, { content: newText });
          textEl.textContent = newText;
          closeModal();
          toastSuccess('Comment updated.');
        }catch(err){ toastError(err); }
      };
    });
  });
}

document.getElementById('comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const input = document.getElementById('comment-input');
  const text = input.value.trim();
  if (!text) return;
  try{
    await api.addComment(currentPostId, { content: text });
    input.value = '';
    loadComments();
    const countEl = document.querySelector('.comment-count');
    if (countEl) countEl.textContent = (parseInt(countEl.textContent) || 0) + 1;
  }catch(err){ toastError(err); }
});

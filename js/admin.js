/* ==========================================================================
   Cherry — Admin page
   Requires role === 'ADMIN' on the stored user (added via
   UserProfileResponseDTO.role). Non-admins are redirected to Home.
   ========================================================================== */
renderShell('admin');

(function guardAdminPage(){
  const me = getStoredUser() || {};
  const role = String(pick(me, ['role'], '')).toUpperCase();
  if (role !== 'ADMIN'){
    location.href = 'home.html';
  }
})();

const adminUsersList = document.getElementById('admin-users-list');
const adminInsightsList = document.getElementById('admin-insights-list');
let allInsights = [];
const adminCommentsList = document.getElementById('admin-comments-list');
let allComments = [];
let allUsers = [];

loadUsers();
loadInsights();
loadComments();

async function loadInsights(){
  adminInsightsList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    let posts = await api.getAllPosts();
    if (!Array.isArray(posts)) posts = [];
    posts.sort((a, b) => {
      const idA = Number(pick(a, ['id','postId'], 0));
      const idB = Number(pick(b, ['id','postId'], 0));
      return idB - idA;
    });
    allInsights = posts;
    renderInsights(allInsights);
  }catch(err){
    adminInsightsList.innerHTML = emptyState(ICON_SVGS.inbox, "Couldn't load insights", err.message || '');
  }
}

function renderInsights(posts){
  if (!posts.length){
    adminInsightsList.innerHTML = emptyState(ICON_SVGS.inbox, 'No insights found', '');
    return;
  }
  adminInsightsList.innerHTML = posts.map(p => {
    const id = pick(p, ['id','postId']);
    const title = pick(p, ['title'], '');
    const username = pick(p, ['username'], 'someone');
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border);">
        <div style="min-width:0;">
          <span class="text-sm text-muted">#${escapeHtml(String(id))}</span>
          <span style="font-weight:600;margin-left:8px;">${escapeHtml(title || '(untitled)')}</span>
          <span class="text-sm text-muted" style="margin-left:8px;">by @${escapeHtml(username)}</span>
        </div>
        <button class="btn btn-danger btn-sm" data-admin-delete-insight="${id}" style="flex-shrink:0;">Delete</button>
      </div>
    `;
  }).join('');

  adminInsightsList.querySelectorAll('[data-admin-delete-insight]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.adminDeleteInsight;
      const ok = await confirmModal({ title:'Delete insight #' + id + '?', confirmText:'Delete', danger:true });
      if (!ok) return;
      try{
        await api.adminDeletePost(id);
        toastSuccess('Insight deleted.');
        loadInsights();
      }catch(err){ toastError(err); }
    });
  });
}

async function loadComments(){
  adminCommentsList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    let comments = await api.adminGetAllComments();
    if (!Array.isArray(comments)) comments = [];
    allComments = comments;
    renderComments(allComments);
  }catch(err){
    adminCommentsList.innerHTML = emptyState(ICON_SVGS.inbox, "Couldn't load comments", err.message || '');
  }
}

function renderComments(comments){
  if (!comments.length){
    adminCommentsList.innerHTML = emptyState(ICON_SVGS.inbox, 'No comments found', '');
    return;
  }
  adminCommentsList.innerHTML = comments.map(c => {
    const id = pick(c, ['id','commentId']);
    const text = pick(c, ['content','text'], '');
    const username = pick(c, ['username'], pick(c.user || c.author || {}, ['username'], 'someone'));
    const postId = pick(c, ['postId'], '');
    return `
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 4px;border-bottom:1px solid var(--border);">
        <div style="min-width:0;">
          <span class="text-sm text-muted">#${escapeHtml(String(id))}</span>
          <span style="font-weight:600;margin-left:8px;">${escapeHtml(text)}</span>
          <span class="text-sm text-muted" style="margin-left:8px;">by @${escapeHtml(username)}${postId ? ` on insight #${escapeHtml(String(postId))}` : ''}</span>
        </div>
        <button class="btn btn-danger btn-sm" data-admin-delete-comment="${id}" style="flex-shrink:0;">Delete</button>
      </div>
    `;
  }).join('');

  adminCommentsList.querySelectorAll('[data-admin-delete-comment]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.adminDeleteComment;
      const ok = await confirmModal({ title:'Delete comment #' + id + '?', confirmText:'Delete', danger:true });
      if (!ok) return;
      try{
        await api.adminDeleteComment(id);
        toastSuccess('Comment deleted.');
        loadComments();
      }catch(err){ toastError(err); }
    });
  });
}

document.getElementById('admin-comment-search').addEventListener('input', (e) => {
  const kw = e.target.value.trim().toLowerCase();
  if (!kw){ renderComments(allComments); return; }
  const filtered = allComments.filter(c => {
    const text = String(pick(c, ['content','text'], '')).toLowerCase();
    const username = String(pick(c, ['username'], '')).toLowerCase();
    const id = String(pick(c, ['id','commentId'], ''));
    return text.includes(kw) || username.includes(kw) || id === kw;
  });
  renderComments(filtered);
});

async function loadUsers(){
  adminUsersList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    allUsers = await api.adminGetUsers();
    if (!Array.isArray(allUsers)) allUsers = [];
    renderUsers(allUsers);
  }catch(err){
    adminUsersList.innerHTML = emptyState(ICON_SVGS.users, "Couldn't load users", err.message || '');
  }
}

function renderUsers(users){
  if (!users.length){
    adminUsersList.innerHTML = emptyState(ICON_SVGS.users, 'No users found', '');
    return;
  }
  adminUsersList.innerHTML = users.map(u => renderUserRow(u, { adminControls:true })).join('');
  adminUsersList.querySelectorAll('.list-row').forEach((el, i) => wireUserRow(el, users[i], new Set(), { adminControls:true }));
}

document.getElementById('admin-user-search').addEventListener('input', (e) => {
  const kw = e.target.value.trim().toLowerCase();
  if (!kw){ renderUsers(allUsers); return; }
  const filtered = allUsers.filter(u => {
    const uname = String(pick(u, ['username'], '')).toLowerCase();
    const name = String(pick(u, ['displayName','name'], '')).toLowerCase();
    return uname.includes(kw) || name.includes(kw);
  });
  renderUsers(filtered);
});

document.getElementById('admin-insight-search').addEventListener('input', (e) => {
  const kw = e.target.value.trim().toLowerCase();
  if (!kw){ renderInsights(allInsights); return; }
  const filtered = allInsights.filter(p => {
    const title = String(pick(p, ['title'], '')).toLowerCase();
    const username = String(pick(p, ['username'], '')).toLowerCase();
    const id = String(pick(p, ['id','postId'], ''));
    return title.includes(kw) || username.includes(kw) || id === kw;
  });
  renderInsights(filtered);
});

document.getElementById('delete-post-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('delete-post-id').value.trim();
  if (!id) return;
  const ok = await confirmModal({ title:'Delete insight #' + id + '?', confirmText:'Delete', danger:true });
  if (!ok) return;
  try{
    await api.adminDeletePost(id);
    toastSuccess('Insight deleted.');
    document.getElementById('delete-post-id').value = '';
  }catch(err){ toastError(err); }
});

document.getElementById('delete-comment-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const id = document.getElementById('delete-comment-id').value.trim();
  if (!id) return;
  const ok = await confirmModal({ title:'Delete comment #' + id + '?', confirmText:'Delete', danger:true });
  if (!ok) return;
  try{
    await api.adminDeleteComment(id);
    toastSuccess('Comment deleted.');
    document.getElementById('delete-comment-id').value = '';
  }catch(err){ toastError(err); }
});

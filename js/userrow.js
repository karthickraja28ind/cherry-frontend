/* ==========================================================================
   Cherry — Shared user row component
   ========================================================================== */
function renderUserRow(user, opts = {}){
  const id = pick(user, ['id','userId']);
  const name = pick(user, ['displayName','name'], pick(user, ['username'], 'User'));
  const username = pick(user, ['username'], '');
  const me = getStoredUser() || {};
  const myId = pick(me, ['id','userId']);
  const isMe = myId && id && String(myId) === String(id);

  return `
    <div class="list-row" data-user-id="${id}">
      <a href="profile.html?id=${id}">${avatarHtml(user, 44)}</a>
      <a class="list-row-main" href="profile.html?id=${id}" style="text-decoration:none;color:inherit;">
        <div class="list-row-title">${escapeHtml(name)}</div>
        <div class="list-row-sub">@${escapeHtml(username)}</div>
      </a>
      ${isMe ? '' : `<button class="btn btn-primary btn-sm follow-toggle-btn">Follow</button>`}
      ${opts.adminControls ? `
        <div class="action-menu-wrap">
          <button class="icon-btn menu-toggle" title="Admin actions" style="color:var(--slate);">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="6" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="12" cy="18" r="1.4"/></svg>
          </button>
          <div class="dropdown">
            <div class="dropdown-item" data-act="ban">🚫 Ban user</div>
            <div class="dropdown-item" data-act="unban">✅ Unban user</div>
          </div>
        </div>
      ` : ''}
    </div>
  `;
}

async function wireUserRow(rowEl, user, followingIds, opts = {}){
  const id = pick(user, ['id','userId']);
  const followBtn = rowEl.querySelector('.follow-toggle-btn');
  if (followBtn){
    let following = followingIds.has(String(id));
    setUserRowFollowState(followBtn, following);
    followBtn.addEventListener('click', async () => {
      followBtn.disabled = true;
      try{
        if (followBtn.dataset.following === 'true'){
          await api.unfollow(id);
          setUserRowFollowState(followBtn, false);
        } else {
          await api.follow(id);
          setUserRowFollowState(followBtn, true);
        }
      }catch(err){ toastError(err); }
      followBtn.disabled = false;
    });
  }

  const menuBtn = rowEl.querySelector('.menu-toggle');
  const dropdown = rowEl.querySelector('.dropdown');
  menuBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    document.querySelectorAll('.dropdown.open').forEach(d => { if (d !== dropdown) d.classList.remove('open'); });
    dropdown.classList.toggle('open');
  });
  document.addEventListener('click', () => dropdown?.classList.remove('open'));

  dropdown?.querySelector('[data-act="ban"]')?.addEventListener('click', async () => {
    const ok = await confirmModal({ title:'Ban this user?', confirmText:'Ban', danger:true });
    if (!ok) return;
    try{ await api.adminBanUser(id); toastSuccess('User banned.'); }catch(err){ toastError(err); }
  });
  dropdown?.querySelector('[data-act="unban"]')?.addEventListener('click', async () => {
    try{ await api.adminUnbanUser(id); toastSuccess('User unbanned.'); }catch(err){ toastError(err); }
  });
}

function setUserRowFollowState(btn, following){
  btn.dataset.following = following ? 'true' : 'false';
  btn.textContent = following ? 'Following' : 'Follow';
  btn.className = following ? 'btn btn-secondary btn-sm follow-toggle-btn' : 'btn btn-primary btn-sm follow-toggle-btn';
}

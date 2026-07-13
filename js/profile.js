/* ==========================================================================
   Cherry — Profile page
   ========================================================================== */
renderShell('profile');

const qp = new URLSearchParams(location.search);
const viewedId = qp.get('id');
const profileWrap = document.getElementById('profile-wrap');
const postsWrap = document.getElementById('profile-posts');

let viewedProfile = null;
let isOwnProfile = false;

init();

async function init(){
  try{
    const me = getStoredUser() || {};
    const myId = pick(me, ['id','userId']);

    if (!viewedId || String(viewedId) === String(myId)){
      isOwnProfile = true;
      viewedProfile = await api.getMyProfile();
    } else {
      isOwnProfile = false;
      viewedProfile = await api.getProfileById(viewedId);
    }
    await renderProfile();
    loadUserPosts();
  }catch(err){
    profileWrap.innerHTML = emptyState(ICON_SVGS.users, "Couldn't load profile", err.message || 'Something went wrong.');
  }
}

function resolvedId(){
  return pick(viewedProfile, ['id','userId'], viewedId);
}

async function renderProfile(){
  const p = viewedProfile;
  const id = resolvedId();
  const name = pick(p, ['displayName','name'], pick(p, ['username'], 'User'));
  const username = pick(p, ['username'], '');
  const bio = pick(p, ['bio','about'], '');

  profileWrap.innerHTML = `
    <div class="card profile-card">
      <div class="profile-cover"></div>
      <div class="profile-head">
        <div class="profile-avatar-wrap">
          ${avatarHtml(p, 96)}
          ${isOwnProfile ? `
            <button class="avatar-edit-btn" id="avatar-edit-btn" title="Change photo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
            </button>
          ` : ''}
        </div>
        <div id="profile-action"></div>
      </div>
      <div class="profile-body">
        <div class="profile-name">${escapeHtml(name)}</div>
        <div class="profile-username">@${escapeHtml(username)}</div>
        ${bio ? `<div class="profile-bio">${escapeHtml(bio)}</div>` : (isOwnProfile ? `<div class="profile-bio text-muted">Add a short bio so people know what you're about.</div>` : '')}
        <div class="profile-stats">
          <a class="profile-stat" href="connections.html?type=following&id=${id}"><b id="following-count">–</b> Following</a>
          <a class="profile-stat" href="connections.html?type=followers&id=${id}"><b id="followers-count">–</b> Followers</a>
        </div>
      </div>
    </div>
  `;

  // action button (edit vs follow)
  const actionWrap = document.getElementById('profile-action');
  if (isOwnProfile){
    actionWrap.innerHTML = `
      <div style="display:flex;gap:8px;">
        <button class="btn btn-secondary btn-sm" id="edit-profile-btn">Edit profile</button>
        <button class="btn btn-ghost btn-sm" id="account-settings-btn">Account settings</button>
      </div>
    `;
    document.getElementById('edit-profile-btn').addEventListener('click', openEditProfileModal);
    document.getElementById('account-settings-btn').addEventListener('click', openAccountSettingsModal);
  } else {
    actionWrap.innerHTML = `
      <div style="display:flex;gap:8px;">
        <button class="btn btn-primary btn-sm" id="follow-btn">Follow</button>
        <button class="btn btn-secondary btn-sm" id="message-btn">Message</button>
      </div>
    `;
    setupFollowButton(id);
    document.getElementById('message-btn').addEventListener('click', () => {
      location.href = 'message.html?id=' + id;
    });
  }

  // follower / following counts
  api.followersOf(id).then(list => { document.getElementById('followers-count').textContent = Array.isArray(list) ? list.length : 0; }).catch(() => {});
  api.followingOf(id).then(list => { document.getElementById('following-count').textContent = Array.isArray(list) ? list.length : 0; }).catch(() => {});

  // avatar edit
  document.getElementById('avatar-edit-btn')?.addEventListener('click', openAvatarMenu);
}

async function setupFollowButton(userId){
  const btn = document.getElementById('follow-btn');
  let following = false;
  try{
    const myFollowing = await api.myFollowing();
    following = Array.isArray(myFollowing) && myFollowing.some(u => String(pick(u, ['id','userId'])) === String(userId));
  }catch(e){ /* ignore */ }
  setFollowBtnState(btn, following);

  btn.addEventListener('click', async () => {
    btn.disabled = true;
    try{
      if (btn.dataset.following === 'true'){
        await api.unfollow(userId);
        setFollowBtnState(btn, false);
      } else {
        await api.follow(userId);
        setFollowBtnState(btn, true);
      }
      const followersCount = document.getElementById('followers-count');
      const cur = parseInt(followersCount.textContent) || 0;
      followersCount.textContent = btn.dataset.following === 'true' ? cur + 1 : Math.max(0, cur - 1);
    }catch(err){ toastError(err); }
    btn.disabled = false;
  });
}
function setFollowBtnState(btn, following){
  btn.dataset.following = following ? 'true' : 'false';
  btn.textContent = following ? 'Following' : 'Follow';
  btn.className = following ? 'btn btn-secondary btn-sm' : 'btn btn-primary btn-sm';
}

// ---------- Edit profile (displayName / bio) ----------
function openEditProfileModal(){
  const p = viewedProfile;
  const name = pick(p, ['displayName','name'], '');
  const bio = pick(p, ['bio','about'], '');
  const modal = openModal(`
    <h3>Edit profile</h3>
    <form id="edit-profile-form">
      <div class="field" style="margin-top:14px;">
        <label>Display name</label>
        <input type="text" id="edit-display-name" value="${escapeHtml(name)}">
      </div>
      <div class="field">
        <label>Bio</label>
        <textarea id="edit-bio" rows="3" placeholder="Tell people about yourself">${escapeHtml(bio)}</textarea>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" data-act="cancel">Cancel</button>
        <button type="submit" class="btn btn-primary">Save changes</button>
      </div>
    </form>
  `);
  modal.querySelector('[data-act="cancel"]').onclick = closeModal;
  modal.querySelector('#edit-profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = document.getElementById('edit-display-name').value.trim();
    const bioVal = document.getElementById('edit-bio').value.trim();
    try{
      const updated = await api.updateProfile({ displayName, bio: bioVal });
      viewedProfile = updated || { ...viewedProfile, displayName, bio: bioVal };
      setStoredUser(viewedProfile);
      closeModal();
      toastSuccess('Profile updated.');
      renderProfile();
    }catch(err){ toastError(err); }
  });
}

// ---------- Avatar menu (upload / remove) ----------
function openAvatarMenu(){
  const modal = openModal(`
    <h3>Profile photo</h3>
    <p>Update or remove your current photo.</p>
    <div class="modal-actions" style="justify-content:flex-start;flex-wrap:wrap;">
      <button class="btn btn-secondary btn-sm" id="upload-photo-btn">Upload new photo</button>
      <button class="btn btn-danger btn-sm" id="remove-photo-btn">Remove photo</button>
    </div>
    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="cancel">Close</button>
    </div>
  `);
  modal.querySelector('[data-act="cancel"]').onclick = closeModal;
  modal.querySelector('#upload-photo-btn').addEventListener('click', () => {
    document.getElementById('picture-input').click();
  });
  modal.querySelector('#remove-photo-btn').addEventListener('click', async () => {
    closeModal();
    const ok = await confirmModal({ title:'Remove profile photo?', confirmText:'Remove', danger:true });
    if (!ok) return;
    try{
      const updated = await api.deleteProfilePicture();
      viewedProfile = updated || viewedProfile;
      setStoredUser(viewedProfile);
      toastSuccess('Photo removed.');
      renderProfile();
    }catch(err){ toastError(err); }
  });
}

document.getElementById('picture-input').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  closeModal();
  try{
    const updated = await api.updateProfilePicture(file);
    viewedProfile = updated || viewedProfile;
    setStoredUser(viewedProfile);
    toastSuccess('Profile photo updated.');
    renderProfile();
  }catch(err){ toastError(err); }
  e.target.value = '';
});

// ---------- Account settings (username / password) ----------
function openAccountSettingsModal(){
  const me = getStoredUser() || {};
  const username = pick(me, ['username'], '');
  const modal = openModal(`
    <h3>Account settings</h3>

    <div class="mt-2">
      <label class="text-sm" style="font-weight:700;color:var(--slate);">Change username</label>
      <form id="username-form" class="mt-1" style="display:flex;gap:8px;">
        <input type="text" id="new-username" placeholder="New username" value="" style="flex:1;padding:10px 12px;border:1.5px solid var(--border);border-radius:var(--radius-sm);">
        <button class="btn btn-secondary btn-sm" type="submit">Update</button>
      </form>
    </div>

    <hr class="divider">

    <div>
      <label class="text-sm" style="font-weight:700;color:var(--slate);">Change password</label>
      <form id="password-form" class="mt-1">
        <div class="field"><input type="password" id="old-pass" placeholder="Current password"></div>
        <div class="field"><input type="password" id="new-pass" placeholder="New password"></div>
        <button class="btn btn-secondary btn-sm" type="submit">Update password</button>
      </form>
    </div>

    <hr class="divider">

    <div>
      <label class="text-sm" style="font-weight:700;color:var(--danger);">Danger zone</label>
      <p class="mt-1">Deleting your account removes it permanently and cannot be undone.</p>
      <button class="btn btn-danger btn-sm mt-1" id="delete-account-btn">Delete my account</button>
    </div>

    <div class="modal-actions">
      <button class="btn btn-ghost" data-act="close">Close</button>
    </div>
  `);
  modal.querySelector('[data-act="close"]').onclick = closeModal;

  modal.querySelector('#delete-account-btn').addEventListener('click', async () => {
    const me2 = getStoredUser() || {};
    const myId = pick(me2, ['id','userId']);
    if (!myId){ toastError('Could not determine your account id.'); return; }
    closeModal();
    const ok = await confirmModal({ title:'Delete your account?', message:'This permanently removes your account and cannot be undone.', confirmText:'Delete account', danger:true });
    if (!ok) return;
    try{
      await api.deleteUser(myId);
      toastSuccess('Account deleted.');
      doLogout();
    }catch(err){ toastError(err); }
  });

  modal.querySelector('#username-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const newUsername = document.getElementById('new-username').value.trim();
    if (!newUsername) return;
    try{
      await api.changeUsername(username, newUsername);
      const me2 = getStoredUser() || {};
      me2.username = newUsername;
      setStoredUser(me2);
      toastSuccess('Username updated.');
      closeModal();
      renderProfile();
    }catch(err){ toastError(err); }
  });

  modal.querySelector('#password-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const oldPass = document.getElementById('old-pass').value;
    const newPass = document.getElementById('new-pass').value;
    if (!oldPass || !newPass) return;
    try{
      await api.changePassword(oldPass, newPass);
      toastSuccess('Password updated.');
      closeModal();
    }catch(err){ toastError(err); }
  });
}

// ---------- Posts by this user ----------
async function loadUserPosts(){
  const id = resolvedId();
  postsWrap.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const posts = await api.getPostsByUser(id);
    if (!Array.isArray(posts) || !posts.length){
      postsWrap.innerHTML = emptyState(ICON_SVGS.inbox, 'No insights yet', isOwnProfile ? 'Share your first insight from the Home page.' : 'This user hasn\'t shared anything yet.');
      return;
    }
    postsWrap.innerHTML = posts.map(p => renderPostCard(p)).join('');
    postsWrap.querySelectorAll('.post-card').forEach((el, i) => wirePostCard(el, posts[i]));
  }catch(err){
    postsWrap.innerHTML = emptyState(ICON_SVGS.inbox, "Couldn't load insights", err.message || '');
  }
}

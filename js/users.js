/* ==========================================================================
   Cherry — Explore / users page
   ========================================================================== */
renderShell('users');

const usersList = document.getElementById('users-list');
let followingIds = new Set();
let debounceTimer = null;

const usersQp = new URLSearchParams(location.search);
const prefillQuery = usersQp.get('q');
if (prefillQuery){
  const searchInput = document.getElementById('user-search');
  if (searchInput) searchInput.value = prefillQuery;
}

init();

async function init(){
  try{
    const mine = await api.myFollowing();
    followingIds = new Set((Array.isArray(mine) ? mine : []).map(u => String(pick(u, ['id','userId']))));
  }catch(e){ /* ignore */ }
  if (prefillQuery){
    usersList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
    try{
      const users = await api.searchUsers(prefillQuery);
      renderUsers(Array.isArray(users) ? users : []);
    }catch(err){
      usersList.innerHTML = emptyState(ICON_SVGS.users, 'No results', err.message || '');
    }
  } else {
    loadAllUsers();
  }
}

async function loadAllUsers(){
  usersList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const users = await api.getAllUsers();
    renderUsers(Array.isArray(users) ? users : []);
  }catch(err){
    usersList.innerHTML = emptyState(ICON_SVGS.users, "Couldn't load users", err.message || '');
  }
}

function renderUsers(users){
  if (!users.length){
    usersList.innerHTML = emptyState(ICON_SVGS.users, 'No users found', '');
    return;
  }
  usersList.innerHTML = users.map(u => renderUserRow(u)).join('');
  usersList.querySelectorAll('.list-row').forEach((el, i) => wireUserRow(el, users[i], followingIds));
}

document.getElementById('user-search').addEventListener('input', (e) => {
  clearTimeout(debounceTimer);
  const keyword = e.target.value.trim();
  debounceTimer = setTimeout(async () => {
    if (!keyword){ loadAllUsers(); return; }
    usersList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
    try{
      const users = await api.searchUsers(keyword);
      renderUsers(Array.isArray(users) ? users : []);
    }catch(err){
      usersList.innerHTML = emptyState(ICON_SVGS.users, 'No results', err.message || '');
    }
  }, 320);
});

/* ==========================================================================
   Cherry — Connections (followers / following) page
   ========================================================================== */
renderShell('profile');

const cp = new URLSearchParams(location.search);
const connUserId = cp.get('id');
let connType = cp.get('type') === 'following' ? 'following' : 'followers';

const connList = document.getElementById('connections-list');
const connTitle = document.getElementById('connections-title');
let followingIdsSet = new Set();

document.querySelectorAll('#connection-tabs .tab').forEach(t => {
  t.classList.toggle('active', t.dataset.type === connType);
  t.addEventListener('click', () => {
    connType = t.dataset.type;
    document.querySelectorAll('#connection-tabs .tab').forEach(x => x.classList.remove('active'));
    t.classList.add('active');
    load();
  });
});

init();

async function init(){
  try{
    const mine = await api.myFollowing();
    followingIdsSet = new Set((Array.isArray(mine) ? mine : []).map(u => String(pick(u, ['id','userId']))));
  }catch(e){}
  load();
}

async function load(){
  connTitle.textContent = connType === 'followers' ? 'Followers' : 'Following';
  connList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  if (!connUserId){
    connList.innerHTML = emptyState(ICON_SVGS.users, 'No user specified', '');
    return;
  }
  try{
    const list = connType === 'followers' ? await api.followersOf(connUserId) : await api.followingOf(connUserId);
    renderList(Array.isArray(list) ? list : []);
  }catch(err){
    connList.innerHTML = emptyState(ICON_SVGS.users, "Couldn't load list", err.message || '');
  }
}

function renderList(users){
  if (!users.length){
    connList.innerHTML = emptyState(ICON_SVGS.users, connType === 'followers' ? 'No followers yet' : 'Not following anyone yet', '');
    return;
  }
  connList.innerHTML = users.map(u => renderUserRow(u)).join('');
  connList.querySelectorAll('.list-row').forEach((el, i) => wireUserRow(el, users[i], followingIdsSet));
}

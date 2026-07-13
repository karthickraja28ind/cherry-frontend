/* ==========================================================================
   Cherry — Home feed
   ========================================================================== */
renderShell('home');

const feedList = document.getElementById('feed-list');
let currentFeed = 'home';
let searchDebounce = null;

document.getElementById('composer-avatar').innerHTML = avatarHtml(getStoredUser() || {}, 44);

async function loadFeed(kind){
  currentFeed = kind;
  feedList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    let posts = [];
    if (kind === 'home') posts = await api.homeFeed();
    else if (kind === 'latest') posts = await api.latestPosts();
    else if (kind === 'trending') posts = await api.trendingPosts();
    else posts = await api.getAllPosts();
    renderFeed(Array.isArray(posts) ? posts : []);
  }catch(err){
    feedList.innerHTML = emptyState(ICON_SVGS.inbox, "Couldn't load insights", err.message || 'Something went wrong.');
  }
}

function renderFeed(posts){
  if (!posts.length){
    feedList.innerHTML = emptyState(ICON_SVGS.inbox, 'Nothing here yet', 'When there are insights to show, they will appear here.');
    return;
  }
  feedList.innerHTML = posts.map(p => renderPostCard(p)).join('');
  feedList.querySelectorAll('.post-card').forEach((el, i) => {
    wirePostCard(el, posts[i], { onDeleted: () => {} });
  });
}

document.querySelectorAll('#feed-tabs .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('#feed-tabs .tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('feed-search').value = '';
    loadFeed(tab.dataset.feed);
  });
});

document.getElementById('feed-search').addEventListener('input', (e) => {
  clearTimeout(searchDebounce);
  const keyword = e.target.value.trim();
  searchDebounce = setTimeout(async () => {
    if (!keyword){ loadFeed(currentFeed); return; }
    feedList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
    try{
      const posts = await api.searchPosts(keyword);
      renderFeed(Array.isArray(posts) ? posts : []);
    }catch(err){
      feedList.innerHTML = emptyState(ICON_SVGS.inbox, 'No results', err.message || 'Try a different search.');
    }
  }, 350);
});

// ---------- Composer ----------
const composerForm = document.getElementById('composer-form');
const composerImageInput = document.getElementById('composer-image');
const composerPreview = document.getElementById('composer-preview');
const composerPreviewImg = document.getElementById('composer-preview-img');
let selectedImageFile = null;

composerImageInput.addEventListener('change', () => {
  const file = composerImageInput.files[0];
  if (!file) return;
  selectedImageFile = file;
  const reader = new FileReader();
  reader.onload = () => {
    composerPreviewImg.src = reader.result;
    composerPreview.style.display = 'block';
  };
  reader.readAsDataURL(file);
});

document.getElementById('composer-remove-img').addEventListener('click', () => {
  selectedImageFile = null;
  composerImageInput.value = '';
  composerPreview.style.display = 'none';
});

composerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const titleInput = document.getElementById('composer-title');
  const contentInput = document.getElementById('composer-content');
  const title = titleInput.value.trim();
  const content = contentInput.value.trim();

  if (!title){ toastError('Add a short title for your insight.'); titleInput.focus(); return; }
  if (!content){ toastError('Write something before sharing.'); contentInput.focus(); return; }

  const me = getStoredUser() || {};
  const myId = pick(me, ['id','userId']);

  const btn = document.getElementById('composer-submit');
  btn.disabled = true; btn.textContent = 'Sharing…';
  try{
    await api.createPost({ title, content, userId: myId, image: selectedImageFile });
    toastSuccess('Insight shared!');
    titleInput.value = '';
    contentInput.value = '';
    selectedImageFile = null;
    composerImageInput.value = '';
    composerPreview.style.display = 'none';
    document.querySelectorAll('#feed-tabs .tab').forEach(t => t.classList.remove('active'));
    document.querySelector('#feed-tabs .tab[data-feed="home"]').classList.add('active');
    loadFeed('home');
  }catch(err){
    toastError(err);
  }
  btn.disabled = false; btn.textContent = 'Share Insight';
});

loadFeed('home');

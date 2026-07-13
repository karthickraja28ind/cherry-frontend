/* ==========================================================================
   Cherry — Bookmarks page
   ========================================================================== */
renderShell('bookmarks');

const bookmarksList = document.getElementById('bookmarks-list');
load();

async function load(){
  bookmarksList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const posts = await api.myBookmarks();
    render(Array.isArray(posts) ? posts : []);
  }catch(err){
    bookmarksList.innerHTML = emptyState(ICON_SVGS.bookmark, "Couldn't load bookmarks", err.message || '');
  }
}

function render(posts){
  if (!posts.length){
    bookmarksList.innerHTML = emptyState(ICON_SVGS.bookmark, 'No bookmarks yet', 'Save insights from your feed to find them here later.');
    return;
  }
  bookmarksList.innerHTML = posts.map(p => renderPostCard(p)).join('');
  bookmarksList.querySelectorAll('.post-card').forEach((el, i) => {
    wirePostCard(el, posts[i], {
      startBookmarked: true,
      onUnbookmarked: (id, cardEl) => { cardEl.remove(); }
    });
  });
}

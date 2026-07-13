/* ==========================================================================
   Cherry — Messages inbox (list of conversations)
   ========================================================================== */
renderShell('messages');

const conversationsList = document.getElementById('conversations-list');
load();

async function load(){
  conversationsList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const items = await api.getConversations();
    render(Array.isArray(items) ? items : []);
  }catch(err){
    conversationsList.innerHTML = emptyState(ICON_SVGS.mail, "Couldn't load messages", err.message || '');
  }
}

function render(items){
  if (!items.length){
    conversationsList.innerHTML = emptyState(ICON_SVGS.mail, 'No conversations yet', 'Visit someone\'s profile and tap Message to start one.');
    return;
  }

  conversationsList.innerHTML = items.map(c => {
    const otherId = pick(c, ['otherUserId','userId']);
    const name = pick(c, ['otherDisplayName'], pick(c, ['otherUsername'], 'User'));
    const username = pick(c, ['otherUsername'], '');
    const lastMessage = pick(c, ['lastMessage'], '');
    const lastAt = pick(c, ['lastMessageAt'], '');
    const unread = Number(pick(c, ['unreadCount'], 0)) || 0;
    const fakeUser = { displayName: name, username, profileImage: pick(c, ['otherProfileImage'], null) };

    return `
      <div class="conv-row" data-id="${otherId}" style="display:flex;align-items:center;gap:12px;padding:12px 8px;cursor:pointer;border-radius:var(--radius-sm);border-bottom:1px solid var(--border);">
        ${avatarHtml(fakeUser, 44)}
        <div style="flex:1;min-width:0;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
            <span style="font-weight:700;font-size:14.5px;">${escapeHtml(name)}</span>
            ${lastAt ? `<span class="text-sm text-muted" style="flex-shrink:0;">${escapeHtml(timeAgo(lastAt))}</span>` : ''}
          </div>
          <div class="text-sm text-muted" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">
            ${escapeHtml(lastMessage)}
          </div>
        </div>
        ${unread > 0 ? `<span class="badge-count">${unread > 99 ? '99+' : unread}</span>` : ''}
      </div>
    `;
  }).join('');

  conversationsList.querySelectorAll('.conv-row').forEach(row => {
    row.addEventListener('mouseenter', () => row.style.background = 'var(--tint-1)');
    row.addEventListener('mouseleave', () => row.style.background = '');
    row.addEventListener('click', () => { location.href = 'message.html?id=' + row.dataset.id; });
  });
}

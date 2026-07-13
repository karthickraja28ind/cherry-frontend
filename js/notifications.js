/* ==========================================================================
   Cherry — Notifications page
   Reads the real NotificationResponseDTO shape: id, senderId, senderUsername,
   senderDisplayName, senderProfileImage, message, read, createdAt.
   No related-post reference exists on the backend, so clicking a
   notification takes you to the sender's profile instead.
   ========================================================================== */
renderShell('notifications');

const notifList = document.getElementById('notifications-list');
load();

async function load(){
  notifList.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  try{
    const items = await api.myNotifications();
    render(Array.isArray(items) ? items : []);
  }catch(err){
    notifList.innerHTML = emptyState(ICON_SVGS.bell, "Couldn't load notifications", err.message || '');
  }
}

function render(items){
  if (!items.length){
    notifList.innerHTML = emptyState(ICON_SVGS.bell, 'All caught up', 'You have no notifications right now.');
    return;
  }

  notifList.innerHTML = items.map(n => {
    const fakeSender = {
      displayName: n.senderDisplayName,
      username: n.senderUsername,
      profileImage: n.senderProfileImage
    };
    return `
      <div class="notif-row ${n.read ? '' : 'unread'}" data-sender-id="${n.senderId ?? ''}" style="align-items:center;cursor:pointer;">
        ${avatarHtml(fakeSender, 38)}
        <div style="flex:1;">
          <div style="font-size:14px;">${escapeHtml(n.message || 'New activity on your account')}</div>
          ${n.createdAt ? `<div class="text-sm text-muted mt-1" style="margin-top:3px;">${escapeHtml(timeAgo(n.createdAt))}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  notifList.querySelectorAll('.notif-row').forEach(row => {
    const sid = row.dataset.senderId;
    if (sid){
      row.addEventListener('click', () => { location.href = 'profile.html?id=' + sid; });
    }
  });
}

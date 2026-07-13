/* ==========================================================================
   Cherry — Single conversation thread
   Polls every few seconds for new messages (no WebSocket needed).
   ========================================================================== */
renderShell('messages');

const qp = new URLSearchParams(location.search);
const otherUserId = qp.get('id');

const headerEl = document.getElementById('message-thread-header');
const threadEl = document.getElementById('message-thread');
const formEl = document.getElementById('message-form');
const inputEl = document.getElementById('message-input');
const sendBtn = document.getElementById('message-send-btn');

const me = getStoredUser() || {};
const myId = String(pick(me, ['id','userId'], ''));

let pollTimer = null;
let lastMessageCount = 0;

if (!otherUserId){
  threadEl.innerHTML = emptyState(ICON_SVGS.mail, 'No conversation selected', 'Go back and pick a conversation.');
} else {
  init();
}

let otherUserProfile = null;

async function init(){
  try{
    otherUserProfile = await api.getProfileById(otherUserId);
    renderHeader(otherUserProfile);
  }catch(err){
    headerEl.innerHTML = `<div style="font-weight:700;">Conversation</div>`;
  }
  await loadThread(true);
  pollTimer = setInterval(() => loadThread(false), 4000);
  formEl.addEventListener('submit', onSend);
}

function renderHeader(profile){
  const name = pick(profile, ['displayName'], pick(profile, ['username'], 'User'));
  const username = pick(profile, ['username'], '');
  headerEl.innerHTML = `
    ${avatarHtml(profile, 36)}
    <div>
      <div style="font-weight:700;">${escapeHtml(name)}</div>
      ${username ? `<div class="text-sm text-muted">@${escapeHtml(username)}</div>` : ''}
    </div>
  `;
}

async function loadThread(showSpinner){
  if (showSpinner){
    threadEl.innerHTML = `<div class="spinner-wrap"><div class="spinner"></div></div>`;
  }
  try{
    const messages = await api.getConversation(otherUserId);
    renderThread(Array.isArray(messages) ? messages : []);
  }catch(err){
    if (showSpinner){
      threadEl.innerHTML = emptyState(ICON_SVGS.mail, "Couldn't load conversation", err.message || '');
    }
  }
}

function renderThread(messages){
  if (!messages.length){
    threadEl.innerHTML = `<p class="text-sm text-muted" style="text-align:center;margin-top:20px;">No messages yet — say hello.</p>`;
    return;
  }

  const shouldScroll = messages.length !== lastMessageCount;
  lastMessageCount = messages.length;

  threadEl.innerHTML = messages.map(m => {
    const mine = String(m.senderId) === myId;
    return `
      <div style="display:flex;justify-content:${mine ? 'flex-end' : 'flex-start'};">
        <div style="max-width:75%;padding:9px 13px;border-radius:14px;background:${mine ? 'var(--blue)' : 'var(--tint-1)'};color:${mine ? '#fff' : 'var(--ink)'};font-size:14px;">
          <div>${escapeHtml(m.content || '')}</div>
          <div style="font-size:10.5px;opacity:.75;margin-top:3px;">${escapeHtml(timeAgo(m.createdAt))}</div>
        </div>
      </div>
    `;
  }).join('');

  if (shouldScroll){
    threadEl.scrollTop = threadEl.scrollHeight;
  }
}

async function onSend(e){
  e.preventDefault();
  const content = inputEl.value.trim();
  if (!content) return;

  sendBtn.disabled = true;
  try{
    await api.sendMessage({ receiverId: Number(otherUserId), content });
    inputEl.value = '';
    await loadThread(false);
    threadEl.scrollTop = threadEl.scrollHeight;
  }catch(err){
    toastError(err);
  }finally{
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

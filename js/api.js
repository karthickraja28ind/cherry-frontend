/* ==========================================================================
   Cherry — API layer
   All calls to your Spring Boot backend go through here.
   Change API_BASE if your backend runs on a different host/port.
   ========================================================================== */
const API_BASE = 'https://cherry-backend-v0u7.onrender.com';

const TOKEN_KEY = 'cherry_token';
const USER_KEY  = 'cherry_user';

function getToken(){ return localStorage.getItem(TOKEN_KEY); }
function setToken(t){ localStorage.setItem(TOKEN_KEY, t); }
function clearToken(){ localStorage.removeItem(TOKEN_KEY); }

function getStoredUser(){
  try { return JSON.parse(localStorage.getItem(USER_KEY) || 'null'); }
  catch(e){ return null; }
}
function setStoredUser(u){ localStorage.setItem(USER_KEY, JSON.stringify(u || {})); }
function clearStoredUser(){ localStorage.removeItem(USER_KEY); }

/**
 * Core fetch wrapper.
 * - Adds JWT bearer token automatically when present.
 * - Sends JSON by default; leaves FormData bodies untouched (for file uploads).
 * - Parses JSON responses when possible, falls back to plain text.
 * - Throws an Error with a readable message on non-2xx responses.
 */
async function apiFetch(path, options = {}){
  const opts = { ...options };
  const headers = { ...(opts.headers || {}) };

  const isFormData = (typeof FormData !== 'undefined') && (opts.body instanceof FormData);
  if (!isFormData && opts.body && typeof opts.body !== 'string'){
    opts.body = JSON.stringify(opts.body);
  }
  if (!isFormData && opts.body){
    headers['Content-Type'] = 'application/json';
  }

  const token = getToken();
  if (token){ headers['Authorization'] = 'Bearer ' + token; }

  opts.headers = headers;

  let res;
  try{
    res = await fetch(API_BASE + path, opts);
  }catch(networkErr){
    throw new Error('Could not reach the server. Is the backend running at ' + API_BASE + '?');
  }

  const raw = await res.text();
  let data = null;
  if (raw){
    try { data = JSON.parse(raw); } catch(e){ data = raw; }
  }

  if (res.status === 401){
    // token missing / expired / invalid
    clearToken();
    clearStoredUser();
    if (!location.pathname.endsWith('index.html') && location.pathname !== '/'){
      location.href = 'index.html?expired=1';
    }
    throw new Error('Your session expired. Please sign in again.');
  }

  if (!res.ok){
    let message = 'Something went wrong (' + res.status + ').';
    if (typeof data === 'string' && data.trim()) message = data;
    else if (data && data.message) message = data.message;
    else if (data && data.error) message = data.error;
    throw new Error(message);
  }

  return data;
}

const api = {
  // ---------- Users ----------
  signup: (dto) => apiFetch('/api/cherry/users/signup', { method:'POST', body: dto }),
  login:  (dto) => apiFetch('/api/cherry/users/login',  { method:'POST', body: dto }),
  getUser: (id) => apiFetch(`/api/cherry/users/${id}`),
  getAllUsers: () => apiFetch('/api/cherry/users/alluser'),
  updateUser: (dto) => apiFetch('/api/cherry/users/update', { method:'PUT', body: dto }),
  deleteUser: (id) => apiFetch(`/api/cherry/users/${id}`, { method:'DELETE' }),
  searchUsers: (keyword) => apiFetch('/api/cherry/users/search?keyword=' + encodeURIComponent(keyword)),
  changePassword: (oldPass, newPass) => apiFetch(
    `/api/cherry/users/change/password?oldPass=${encodeURIComponent(oldPass)}&newPass=${encodeURIComponent(newPass)}`,
    { method:'PUT' }
  ),
  changeUsername: (oldUsername, newUsername) => apiFetch(
    `/api/cherry/users/change/username?oldUsername=${encodeURIComponent(oldUsername)}&newUsername=${encodeURIComponent(newUsername)}`,
    { method:'PUT' }
  ),

  // ---------- Profile ----------
  getMyProfile: () => apiFetch('/api/cherry/profile/my'),
  getProfileById: (userId) => apiFetch(`/api/cherry/profile/${userId}`),
  updateProfile: (dto) => apiFetch('/api/cherry/profile/update', { method:'PUT', body: dto }),
  updateProfilePicture: (file) => {
    const fd = new FormData();
    fd.append('image', file);
    return apiFetch('/api/cherry/profile', { method:'PUT', body: fd });
  },
  deleteProfilePicture: () => apiFetch('/api/cherry/profile/image', { method:'DELETE' }),

  // ---------- Posts ----------
  createPost: ({ title, content, userId, image }) => {
    const fd = new FormData();
    fd.append('title', title);
    fd.append('content', content);
    if (userId !== undefined && userId !== null) fd.append('userId', userId);
    if (image) fd.append('image', image);
    return apiFetch('/api/cherry/post/newpost', { method:'POST', body: fd });
  },
  getPost: (id) => apiFetch(`/api/cherry/post/${id}`),
  getAllPosts: () => apiFetch('/api/cherry/post/get/allpost'),
  updatePost: (id, dto) => apiFetch(`/api/cherry/post/updatepost/${id}`, { method:'PUT', body: dto }),
  deletePost: (id) => apiFetch(`/api/cherry/post/delete/${id}`, { method:'DELETE' }),
  getPostsByPage: (page, size) => apiFetch(`/api/cherry/post/page?page=${page}&size=${size}`),
  getPostsByUser: (userId) => apiFetch(`/api/cherry/post/user/${userId}`),
  searchPosts: (keyword) => apiFetch('/api/cherry/post/search?keyword=' + encodeURIComponent(keyword)),
  latestPosts: () => apiFetch('/api/cherry/post/latest'),
  sortPosts: (field) => apiFetch('/api/cherry/post/sort?field=' + encodeURIComponent(field)),
  homeFeed: () => apiFetch('/api/cherry/post/home/feed'),
  trendingPosts: () => apiFetch('/api/cherry/post/trending'),

  // ---------- Comments ----------
  addComment: (postId, dto) => apiFetch(`/api/cherry/comments/${postId}`, { method:'POST', body: dto }),
  getComments: (postId) => apiFetch(`/api/cherry/comments/${postId}`),
  deleteComment: (commentId) => apiFetch(`/api/cherry/comments/${commentId}`, { method:'DELETE' }),
  updateComment: (commentId, dto) => apiFetch(`/api/cherry/comments/${commentId}`, { method:'PUT', body: dto }),
  countComments: (postId) => apiFetch(`/api/cherry/comments/${postId}/count`),

  // ---------- Likes ----------
  addLike: (postId) => apiFetch(`/api/cherry/like/add/${postId}`, { method:'POST' }),
  getAllLikes: (postId) => apiFetch(`/api/cherry/like/all/${postId}`),
  deleteLike: (postId) => apiFetch(`/api/cherry/like/delete/${postId}`, { method:'DELETE' }),
  countLikes: (postId) => apiFetch(`/api/cherry/like/count/${postId}`),

  // ---------- Follow ----------
  follow: (userId) => apiFetch(`/api/cherry/follow/${userId}`, { method:'POST' }),
  unfollow: (userId) => apiFetch(`/api/cherry/follow/${userId}`, { method:'DELETE' }),
  myFollowers: () => apiFetch('/api/cherry/follow/followers'),
  myFollowing: () => apiFetch('/api/cherry/follow/following'),
  followersOf: (userId) => apiFetch(`/api/cherry/follow/${userId}/followers`),
  followingOf: (userId) => apiFetch(`/api/cherry/follow/${userId}/following`),
  countFollowers: () => apiFetch('/api/cherry/follow/followers/count'),
  countFollowing: () => apiFetch('/api/cherry/follow/following/count'),

  // ---------- Bookmarks ----------
  savePost: (postId) => apiFetch(`/api/cherry/bookmark/savepost/${postId}`, { method:'POST' }),
  removeSavedPost: (postId) => apiFetch(`/api/cherry/bookmark/removesaved/${postId}`, { method:'DELETE' }),
  myBookmarks: () => apiFetch('/api/cherry/bookmark/myBookmarks'),

  // ---------- Notifications ----------
  myNotifications: () => apiFetch('/api/notifications/my'),

  // ---------- Messages ----------
  sendMessage: (dto) => apiFetch('/api/cherry/message/send', { method:'POST', body: dto }),
  getConversation: (userId) => apiFetch(`/api/cherry/message/conversation/${userId}`),
  getConversations: () => apiFetch('/api/cherry/message/conversations'),
  getUnreadMessageCount: () => apiFetch('/api/cherry/message/unread/count'),

  // ---------- Admin ----------
  adminGetUsers: () => apiFetch('/api/admin/users'),
  adminDeletePost: (id) => apiFetch(`/api/admin/post/${id}`, { method:'DELETE' }),
  adminDeleteComment: (id) => apiFetch(`/api/admin/comment/${id}`, { method:'DELETE' }),
  adminGetAllComments: () => apiFetch('/api/admin/comments/recent'),
  adminBanUser: (id) => apiFetch(`/api/admin/ban/${id}`, { method:'PUT' }),
  adminUnbanUser: (id) => apiFetch(`/api/admin/unban/${id}`, { method:'PUT' }),
};

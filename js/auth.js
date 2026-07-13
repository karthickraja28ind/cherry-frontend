/* ==========================================================================
   Cherry — Auth helpers
   ========================================================================== */

function isLoggedIn(){ return !!getToken(); }

function requireAuth(){
  if (!isLoggedIn()){
    location.href = 'index.html';
  }
}

function redirectIfAuthed(){
  if (isLoggedIn()){
    location.href = 'home.html';
  }
}

async function doLogin(username, password){
  const token = await api.login({ username, password });
  // login() returns a plain String (the JWT) per the backend controller.
  const jwt = typeof token === 'string' ? token.replace(/^"|"$/g, '') : (token && token.token) || token;
  setToken(jwt);
  // Fetch full profile so we have id / displayName / picture available app-wide.
  try{
    const profile = await api.getMyProfile();
    setStoredUser(profile);
  }catch(e){
    setStoredUser({ username });
  }
}

async function doSignup(dto){
  return api.signup(dto);
}

function doLogout(){
  clearToken();
  clearStoredUser();
  location.href = 'index.html';
}

async function refreshStoredUser(){
  try{
    const profile = await api.getMyProfile();
    setStoredUser(profile);
    return profile;
  }catch(e){
    return getStoredUser();
  }
}

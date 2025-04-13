const CLIENT_ID = "df8d9ff2-d947-4649-94a5-58cb9593d138"; // Your actual Azure Client ID
const REDIRECT_URI = "https://vortex7171.github.io/2b2t-token-generator/";

function startAuth() {
  const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin%20offline_access`;
  window.location.href = authUrl;
}

window.onload = async () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  const accessToken = hash.get("access_token");

  if (!accessToken) return;

  try {
    // Step 1: Get Xbox Live Token
    const xblResp = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${accessToken}`
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT"
      })
    });

    const xbl = await xblResp.json();

    // Step 2: Get XSTS Token
    const xstsResp = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xbl.Token]
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT"
      })
    });

    const xsts = await xstsResp.json();
    const userHash = xsts.DisplayClaims.xui[0].uhs;

    // Step 3: Get Minecraft Token
    const mcResp = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${userHash};${xsts.Token}`
      })
    });

    const mc = await mcResp.json();

    // Step 4: Show token
    document.getElementById("output").textContent =
      `Token: ${mc.access_token}\nUserHash: ${userHash}\n\nSend this token to the bot owner to be added to the 2b2t queue.`;

  } catch (err) {
    document.getElementById("output").textContent = "Error getting token:\n" + err;
  }
};

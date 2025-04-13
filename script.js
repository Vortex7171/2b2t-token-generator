const CLIENT_ID = "00000000402b5328"; // This is Minecraft's public Xbox Live client ID
const REDIRECT_URI = location.origin + location.pathname;

function login() {
  const url = `https://login.live.com/oauth20_authorize.srf?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=XboxLive.signin offline_access`;
  window.location.href = url;
}

window.onload = async () => {
  const hash = new URLSearchParams(location.hash.slice(1));
  const accessToken = hash.get("access_token");

  if (!accessToken) return;

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

  const mcResp = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      identityToken: `XBL3.0 x=${xsts.DisplayClaims.xui[0].uhs};${xsts.Token}`
    })
  });

  const mc = await mcResp.json();
  const profileResp = await fetch("https://api.minecraftservices.com/minecraft/profile", {
    headers: { Authorization: `Bearer ${mc.access_token}` }
  });

  const profile = await profileResp.json();

  document.getElementById("output").innerText =
    `Email: ${xsts.DisplayClaims.xui[0].xid}@hotmail.com\nToken: ${mc.access_token}`;
};

const CLIENT_ID = "d663097d-dd66-4c2e-9325-7091ea40c0fd";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "XboxLive.signin offline_access";

document.getElementById("loginBtn").onclick = () => {
  const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
  window.location.href = authUrl;
};

async function exchangeToken(msToken) {
  const log = (msg) => {
    document.getElementById("output").textContent += msg + "\n";
  };

  try {
    // Step 1: Get Xbox token
    let xblRes = await fetch("https://user.auth.xboxlive.com/user/authenticate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Properties: {
          AuthMethod: "RPS",
          SiteName: "user.auth.xboxlive.com",
          RpsTicket: `d=${msToken}`
        },
        RelyingParty: "http://auth.xboxlive.com",
        TokenType: "JWT"
      })
    });
    let xbl = await xblRes.json();
    const xblToken = xbl.Token;
    const userHash = xbl.DisplayClaims.xui[0].uhs;

    log("✔ Xbox Live Token acquired");

    // Step 2: Get XSTS token
    let xstsRes = await fetch("https://xsts.auth.xboxlive.com/xsts/authorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        Properties: {
          SandboxId: "RETAIL",
          UserTokens: [xblToken]
        },
        RelyingParty: "rp://api.minecraftservices.com/",
        TokenType: "JWT"
      })
    });
    let xsts = await xstsRes.json();
    const xstsToken = xsts.Token;

    log("✔ XSTS Token acquired");

    // Step 3: Get Minecraft access token
    let mcRes = await fetch("https://api.minecraftservices.com/authentication/login_with_xbox", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identityToken: `XBL3.0 x=${userHash};${xstsToken}`
      })
    });
    let mc = await mcRes.json();
    const mcAccessToken = mc.access_token;

    log("✔ Minecraft Token acquired:\n" + mcAccessToken);

    // Step 4: Get Minecraft Profile
    let profileRes = await fetch("https://api.minecraftservices.com/minecraft/profile", {
      headers: {
        "Authorization": `Bearer ${mcAccessToken}`
      }
    });
    let profile = await profileRes.json();

    log(`✔ Username: ${profile.name}`);
    log(`✔ UUID: ${profile.id}`);

    // Step 5: Get Microsoft email
    let emailRes = await fetch("https://graph.microsoft.com/v1.0/me/", {
      headers: {
        "Authorization": `Bearer ${msToken}`
      }
    });

    if (emailRes.ok) {
      let emailData = await emailRes.json();
      log(`✔ Microsoft Email: ${emailData.userPrincipalName}`);
    } else {
      log("⚠ Unable to fetch Microsoft email. (Expected for some accounts)");
    }

  } catch (e) {
    document.getElementById("output").textContent += "❌ Error: " + e.message;
  }
}

// Handle token in URL after login
window.onload = () => {
  if (window.location.hash) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token = params.get("access_token");

    if (token) {
      document.getElementById("output").textContent = "🎮 Logging in...\n";
      exchangeToken(token);
    }
  }
};

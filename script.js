const CLIENT_ID = "df8d9ff2-d947-4649-94a5-58cb9593d138"; // Your actual Azure Client ID
const REDIRECT_URI = "https://vortex7171.github.io/2b2t-token-generator/";
const SCOPES = "XboxLive.signin offline_access";

function startAuth() {
    const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
}

// This runs when redirected back
window.onload = function () {
    if (window.location.hash) {
        const hash = window.location.hash.substring(1);
        const params = new URLSearchParams(hash);
        const accessToken = params.get("access_token");

        if (accessToken) {
            document.getElementById("output").innerText = `Token: ${accessToken}\n\nCopy this and send it.`;
        } else {
            document.getElementById("output").innerText = "Error: No token found.";
        }
    }
};

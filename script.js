const CLIENT_ID = "d663097d-dd66-4c2e-9325-7091ea40c0fd";
const REDIRECT_URI = window.location.origin + window.location.pathname;
const SCOPES = "XboxLive.signin offline_access";

function login() {
    const authUrl = `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?client_id=${CLIENT_ID}&response_type=token&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&scope=${encodeURIComponent(SCOPES)}`;
    window.location.href = authUrl;
}

// On redirect back, get token from URL
window.onload = () => {
    if (window.location.hash) {
        const params = new URLSearchParams(window.location.hash.slice(1));
        const token = params.get("access_token");

        if (token) {
            document.getElementById("output").innerText = `Token:\n${token}\n\nCopy this and send it.`;
        }
    }
};

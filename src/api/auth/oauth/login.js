const crypto = require('crypto');

const serverURL = process.env.SERVER_URL;
const secure = process.env.SECURE === "true";

module.exports = (app) => {
    app.get("/auth/oauth/login", (req, res) => {
        const provider = req?.query?.provider?.toLowerCase();
        if (!provider || !["discord", "google", "gitlab", "twitch", "github"].includes(provider)) return res.status(400).json({ "message": "Invalid OAuth provider" });

        const clientid = process.env[provider.toUpperCase() + "_CLIENT_ID"];
        const redirectURI = serverURL + "/auth/oauth/login/callback?provider=" + provider;

        let apiURL, scope;
        switch (provider) {
            case "discord":
                apiURL = "https://discord.com/api/oauth2/authorize";
                scope = "identify email";
                break;
            case "google":
                apiURL = "https://accounts.google.com/o/oauth2/v2/auth";
                scope = "openid profile email";
                break;
            case "gitlab":
                apiURL = "https://gitlab.com/oauth/authorize";
                scope = "openid profile email";
                break;
            case "twitch":
                apiURL = "https://id.twitch.tv/oauth2/authorize";
                scope = "user:read:email";
                break;
            case "github":
                apiURL = "https://github.com/login/oauth/authorize";
                scope = "read:user user:email";
                break;
            default:
                return res.status(400).json({ "message": "Invalid OAuth provider" });
        }

        const state = crypto.randomUUID();

        const codeVerifier = crypto.randomBytes(32).toString("hex");
        const codeChallenge = crypto
            .createHash("sha256")
            .update(codeVerifier)
            .digest("base64")
            .replace(/\+/g, "-")
            .replace(/\//g, "_")
            .replace(/=+$/, "");

        res.cookie('oauthState', state, {
            httpOnly: true,
            sameSite: 'Lax',
            secure: secure,
            maxAge: 5 * 60 * 1000
        });
        res.cookie("codeVerifier", codeVerifier, {
            httpOnly: true,
            sameSite: "Lax",
            secure: secure,
            maxAge: 5 * 60 * 1000
        });

        const authURI =
            apiURL +
            `?client_id=${clientid}` +
            `&redirect_uri=${encodeURIComponent(redirectURI)}` +
            `&response_type=code` +
            `&scope=${encodeURIComponent(scope)}` +
            `&state=${state}` +
            `&code_challenge=${codeChallenge}` +
            `&code_challenge_method=S256`;

        return res.redirect(authURI);
    });
};
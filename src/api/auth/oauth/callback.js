const { GetDiscordUser } = require('../../../helpers/oauth/getuser/getdiscorduser');
const { GetGoogleUser } = require('../../../helpers/oauth/getuser/getgoogleuser');
const { GetGitlabUser } = require('../../../helpers/oauth/getuser/getgitlabuser');
const { GetGithubUser } = require('../../../helpers/oauth/getuser/getgithubuser');
const { GetTwitchUser } = require('../../../helpers/oauth/getuser/gettwitchuser');
const db = require("../../../config/db/db");
const { Encrypt } = require("../../../helpers/encryption");
const Token = require("../../../helpers/token");
const crypto = require('crypto');

const clientURL = process.env.CLIENT_URL;
const serverURL = process.env.SERVER_URL;
const emailHashVersion = process.env.EMAIL_HASH_SECRET_VERSION;
const emailEncryptedVersion = process.env.EMAIL_ENCRYPTION_SECRET_VERSION;
const secure = process.env.SECURE;

module.exports = (app) => {
    app.get("/auth/oauth/login/callback", async (req, res) => {

        const errorURL = clientURL + `/login?oauth=error&error=`;

        if (req?.query?.state !== req?.cookies?.oauthState) return res.redirect(errorURL + encodeURIComponent("Invalid State"));

        const code = req?.query?.code;
        if (!code) return res.redirect(errorURL + encodeURIComponent("Error providing the code"));

        const codeVerifier = req?.cookies?.codeVerifier;
        if (!codeVerifier) return res.redirect(errorURL + encodeURIComponent("Error providing the verifier"));

        res.clearCookie('oauthState');
        res.clearCookie("codeVerifier");

        const provider = req?.query?.provider?.toLowerCase();
        if (!provider || !["discord", "google", "gitlab", "twitch", "github"].includes(provider)) return res.status(400).json({ "message": "Invalid OAuth provider" });

        const redirectURI = serverURL + "/auth/oauth/login/callback?provider=" + provider;

        let user;
        switch (provider) {
            case "discord":
                user = await GetDiscordUser(redirectURI, codeVerifier, code);
                break;
            case "google":
                user = await GetGoogleUser(redirectURI, codeVerifier, code);
                break;
            case "gitlab":
                user = await GetGitlabUser(redirectURI, codeVerifier, code);
                break;
            case "twitch":
                user = await GetTwitchUser(redirectURI, codeVerifier, code);
                break;
            case "github":
                user = await GetGithubUser(redirectURI, codeVerifier, code);
                break;
            default:
                return res.status(400).json({ "message": "Invalid OAuth provider" });
        }

        const providerPretty = provider.charAt(0).toUpperCase() + provider.slice(1);
        if (!user) return res.redirect(errorURL + encodeURIComponent("Couldn't fetch user information from the " + providerPretty + " provider"));
        if (!user.verified) return res.redirect(errorURL + encodeURIComponent("Your email is not verified"));
        if (!user.username || !user.email) return res.redirect(errorURL + encodeURIComponent("Couldn't fetch user information from the " + providerPretty + " provider"));

        const emailHash = crypto.createHmac('sha256', process.env["EMAIL_HASH_SECRET_V" + emailHashVersion]).update(user.email).digest('hex');
        const emailEncrypted = Encrypt(emailEncryptedVersion + ":" + user.email, process.env['EMAIL_ENCRYPTION_SECRET_V' + emailEncryptedVersion]);

        try {
            const request = await db.query(`
                INSERT INTO users (created_at, hashed_email, encrypted_email, auth_method, username)
                VALUES ($1, $2, $3, $4, $5)
                ON CONFLICT (hashed_email)
                DO UPDATE SET hashed_email = users.hashed_email
                RETURNING uuid, username, auth_method, (xmax = 0) AS inserted;
            `, [new Date().toISOString(), emailHash, emailEncrypted, providerPretty, user.username]);

            if (providerPretty != request.rows[0].auth_method) return res.redirect(errorURL + encodeURIComponent('You already have an account associated with this email using another service (' + request.rows[0].auth_method + ')'));

            // if (request.rows[0].inserted)
            // {
            //     SAVE PICTURE publicuserinfo.avatar
            //
            // } else fetch it

            user = {
                'uuid': request.rows[0].uuid,
                'username': request.rows[0].username
            };

            let accessToken = new Token(user, Token.Type.ACCESS);
            if (!await accessToken.Save(res)) return res.redirect(clientURL + `/login?oauth=error&error=${encodeURIComponent("Couldn't create a token")}`);

            let refreshToken = new Token(user, Token.Type.REFRESH, { "accessjti": accessToken.content.jti });
            if (!await refreshToken.Save(res)) return res.redirect(clientURL + `/login?oauth=error&error=${encodeURIComponent("Couldn't create a token")}`);

            accessToken = null;
            refreshToken = null;

            res.cookie('user', JSON.stringify(user), {
                domain: ".opacube.vip",
                sameSite: 'Strict',
                secure: secure,
                maxAge: process.env.TOKEN_EXP_REFRESH * 60 * 60 * 1000,
                httpOnly: false
            });

            return res.redirect(clientURL + "/profile?oauth=success");
        } catch (err) {
            if (process.env.LOGERRORS === 'true') console.error(err);
            return res.redirect(errorURL + encodeURIComponent("Internal server error"));
        }
    });
};
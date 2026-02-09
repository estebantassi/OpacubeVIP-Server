const axios = require("axios");
const qs = require("qs");

const clientid = process.env.DISCORD_CLIENT_ID;
const clientsecret = process.env.DISCORD_CLIENT_SECRET;

const GetDiscordUser = async (redirectURI, codeVerifier, code) => {
    try {
        const tokenResponse = await axios.post(
            "https://discord.com/api/oauth2/token",
            qs.stringify({
                client_id: clientid,
                client_secret: clientsecret,
                redirect_uri: redirectURI,
                grant_type: "authorization_code",
                code_verifier: codeVerifier,
                code
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
        );

        const userResponse = await axios.get("https://discord.com/api/users/@me", {
            headers: {
                Authorization: `Bearer ${tokenResponse.data.access_token}`
            }
        });

        //https://cdn.discordapp.com/avatars/userResponse.data.id/userResponse.data.avatar.{format}?size=SIZE
        const username = userResponse.data.global_name || userResponse.data.username || "User";
        const email = userResponse.data.email;
        const verified = userResponse.data.verified;

        return {username, email, verified};
    } catch (err) {
        if (process.env.LOGERRORS === 'true') console.error(err);
        return null;
    }
};

module.exports = { GetDiscordUser };
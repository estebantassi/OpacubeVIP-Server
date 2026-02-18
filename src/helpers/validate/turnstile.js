const axios = require("axios");

const turnstile = process.env.TURNSTILE;
const turnstileSecretKey = process.env.TURNSTILE_SECRET_KEY;
const hostname = process.env.HOSTNAME;

const ValidateTurnstile = async (token, remoteip) => {
    if (turnstile == "false") return true;
    if (!token) return false;

    try {
        const response = await axios.post(
            "https://challenges.cloudflare.com/turnstile/v0/siteverify",
            {
                secret: turnstileSecretKey,
                response: token,
                remoteip: remoteip,
            },
            {
                headers: { "Content-Type": "application/json" },
                timeout: 5000
            }
        );

        if (!response.data.success) return false;
        if (response.data.hostname !== hostname) return false;

        console.log(response.data);
        return true;
    } catch (err) {
        if (process.env.LOGERRORS === 'true') console.error(err);
        return false;
    }
};

module.exports = { ValidateTurnstile };
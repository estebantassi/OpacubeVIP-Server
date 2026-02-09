const Token = require("../../helpers/token");

module.exports = (app) => {
    app.get("/auth/access/check", async (req, res) => {
        const token = req?.cookies?.token_access;

        const data = await Token.GetData(token, Token.Type.ACCESS);
        const authorized = data != null;

        return res.status(200).json({ authorized });
    });
};
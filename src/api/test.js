
module.exports = (app) => {
    app.post('/test', async (req, res) => {

        return res.status(200).json({"message": "error"});

    });
};
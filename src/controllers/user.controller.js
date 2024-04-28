async function whoAmI(req, res, next) {
    try {
        return res.json(req.user);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    whoAmI
}
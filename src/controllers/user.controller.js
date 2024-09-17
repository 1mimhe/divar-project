async function whoAmI(req, res, next) {
    try {
        res.render('panel.main.ejs', {
            operation: "home"
        });
        return res.json(req.user);
    } catch (err) {
        next(err);
    }
}

module.exports = {
    whoAmI
}
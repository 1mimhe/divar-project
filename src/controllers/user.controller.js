async function whoAmI(req, res, next) {
    try {
        res.render('panel.main.ejs', {
            operation: "home"
        });
        return res.json(req.user);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    whoAmI
}
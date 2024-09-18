async function whoAmI(req, res, next) {
    try {
        if (req.query.render === "true") {
            return res.render('panel.main.ejs', {
                operation: "home"
            });
        }

        return res.json(req.user);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    whoAmI
}
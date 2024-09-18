module.exports = (req, res, next) => {
    req.query.render = "true";
    next();
}
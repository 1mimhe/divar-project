const UserService = require("../services/user.service");
const AdService = require("../services/ad.service");

async function getAllUsers(req, res, next) {
    try {
        const users = await UserService.getAllUsers();

        return res.json(users);
    } catch (error) {
        next(error);
    }
}

async function whoAmI(req, res, next) {
    try {
        if (req.query.render === "true") {
            const totalAds = (await AdService.getAllAds()).length;
            const myAds = (await AdService.getMyAds(req.user._id));

            return res.render('panel.main.ejs', {
                operation: "home",
                user: req.user,
                totalAds,
                myAds
            });
        }

        return res.json(req.user);
    } catch (error) {
        next(error);
    }
}

async function getUserById(req, res, next) {
    try {
        const { userId } = req.params;
        const user = await UserService.getUserById(userId);

        return res.json(user);
    } catch (error) {
        next(error);
    }
}

async function getUserByMobile(req, res, next) {
    try {
        const { mobile } = req.params;
        const user = await UserService.getUserByMobile(mobile);

        return res.json(user);
    } catch (error) {
        next(error);
    }
}

module.exports = {
    whoAmI,
    getAllUsers,
    getUserById,
    getUserByMobile
}
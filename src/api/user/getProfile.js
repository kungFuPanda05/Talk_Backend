import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';

let controller = async (req, res, next) => {
    let profile = await db.User.findOne({
        attributes: ['id', 'name', 'email', 'coins', 'gender'],
        where: {
            id: req.user.id
        },
        raw: true
    })
    let friendsCount = await db.Friend_Request.count({
        where: {
            status: "accepted",
            [Op.or]: [
                { from: req.user.id },
                { to: req.user.id }
            ]
        },
        distinct: true,
        col: 'id'
    });
    profile.friendsCount = friendsCount;
    try {
        res.status(200).json({
            success: true,
            profile
        });
    } catch (error) {
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


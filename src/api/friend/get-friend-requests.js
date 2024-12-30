import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';


let controller = async (req, res, next) => {

    try {
        const userId = req.user.id;
        let { limit = 100, page = 1, search = "" } = req.query;
        limit = limit ? parseInt(limit, 10) : 10;
        const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
        let friendRequests;
        let totalFriendReqCount = 0;
        if(process.env.ULTRA_SEARCH==="true" && search){
            friendRequests = await db.Friend_Request.findAll({
                include: [{
                    model: db.User,
                    as: 'SentRequests',
                    attributes: ['id', 'name', 'Online']
                }],
                where: {
                    to: userId,
                    status: 'pending'
                },
                attributes: ['id', 'status'],
                order: [['createdAt', 'DESC']],
            });
            friendRequests = friendRequests
            .filter((request) => match(request.SentRequests.name, search));  
            totalFriendReqCount = friendRequests.length;
            friendRequests = friendRequests.slice(offset, offset + limit);  
        }else{
            [friendRequests, totalFriendReqCount] = await Promise.all([
                db.Friend_Request.findAll({
                    include: [{
                        model: db.User,
                        as: 'SentRequests',
                        attributes: ['id', 'name', 'Online'],
                        where: {
                            name: {
                                [Op.like]: `%${search}%`
                            }
                        }
                    }],
                    where: {
                        to: userId,
                        status: 'pending'
                    },
                    attributes: ['id', 'status'],
                    order: [['createdAt', 'DESC']]
                }),
                db.Friend_Request.count({
                    include: [{
                        model: db.User,
                        as: 'SentRequests',
                        where: {
                            name: {
                                [Op.like]: `%${search}%`
                            }
                        }
                    }],
                    where: {
                        to: userId,
                        status: 'pending'
                    },
                    distinct: true,
                    col: 'id'
                })
            ])

        }
        return res.status(200).json({
            success: true,
            messages: "Friend Requests Fetched Successfully",
            response: friendRequests,
            totalFriendReqCount
        });
    } catch (error) {
        console.log("Error fetching friend requests: ", error);
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


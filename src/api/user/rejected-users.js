import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';

let controller = async (req, res, next) => {
    try {
        let { limit = 10, page = 1, search = "" } = req.query;
        limit = limit ? parseInt(limit, 10) : 10;
        const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
        let rejectedUsers, totalRejectedUsers;


        if(process.env.ULTRA_SEARCH=="true"){


            rejectedUsers = await db.User.findAll({
                attributes: ['id', 'name'],
                include: [{
                    attributes: [],
                    model: db.Friend_Request,
                    as: 'ReceivedRequests',
                    where: { status: 'rejected', from: req.user.id }
                }],
            })
            totalRejectedUsers = rejectedUsers.length;
            rejectedUsers = rejectedUsers
            .filter((rejectedUser) => match(rejectedUser.name, search))  
            .slice(offset, offset + limit);    
        }else{
            [rejectedUsers, totalRejectedUsers] = await Promise.all([
                db.User.findAll({
                    attributes: ['id', 'name'],
                    include: [{
                        attributes: [],
                        model: db.Friend_Request,
                        as: 'ReceivedRequests',
                        where: { status: 'rejected', from: req.user.id }
                    }],
                    where: {
                        name: {
                            [Op.like]: `%${search}%` 
                        }
                    },
                    limit,
                    offset
                }),
                db.User.count({
                    include: [{
                        model: db.Friend_Request,
                        as: 'ReceivedRequests',
                        where: { status: 'rejected', from: req.user.id }
                    }],
                    where: {
                        name: {
                            [Op.like]: `%${search}%` 
                        }
                    },
                    distinct: true,
                    col: 'id' 
                })
            ]);

        }


        res.status(200).json({
            success: true,
            message: 'Rejected users list fetched successfully',
            users: rejectedUsers,
            totalUsers: totalRejectedUsers
        });
    } catch (error) {
        next(error); 
    }
};

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;

//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        const userId = req.user.id;
        let friendRequests = await db.Friend_Request.findAll({
            include: [{
                model: db.User,
                as: 'SentRequests',
                attributes: ['id', 'name']
            }],
            where: {
                to: userId,
                status: 'pending'
            },
            order: [['createdAt', 'DESC']]
        });
        return res.status(200).json({
            success: true,
            messages: "Friend Requests Fetched Successfully",
            response: friendRequests
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


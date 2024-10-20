//it gives all the users corresponding to a chat

import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';

let controller = async (req, res, next)=>{
    const {chatId} = req.body;
    try{
        const user = await db.ChatUser.findAll({
            attributes: [],
            where: {chatId},
            include: [
                db.User
            ]
        });

        res.status(200).json({
            result: user,
            success: true,
            messages: 'User list fetched successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


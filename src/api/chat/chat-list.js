//it gives me the chats corresponding to a user
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';


let controller = async (req, res, next)=>{
    const {id} = req.user;
    try{
        const chat = await db.ChatUser.findAll({
            attributes: [],
            where: {userId: id},
            include: [{
                model: db.Chat,
            }]
        });

        res.status(200).json({
            result: chat,
            success: true,
            messages: 'chat list retrieved successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';

let controller = async (req, res, next)=>{
    const {chatId, content} = req.body;
    try{
        const message = await db.Message.create({
            chatId, content
        })
        res.status(201).json({
            success: true,
            messages: 'message added to the Messages table',
            result: `message is added to the database`
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


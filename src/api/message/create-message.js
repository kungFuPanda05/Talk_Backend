//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';


let controller = async (req, res, next)=>{
    const {chatId, content} = req.body;
    const sentBy = req.user.id;
    
    try{
        const message = await db.Message.create({
            chatId, content, sentBy
        })
        
        res.status(201).json({
            success: true,
            messages: 'chat created successfully',
            result: message
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


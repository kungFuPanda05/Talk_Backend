//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        console.log("Req reached to set status");
        const {status, strangerId} = req.body;
        console.log("The req.body is: ", req.body);
        let friend_request = await db.Friend_Request.update({
            status: (status==='accept'?"accepted":"rejected"),
        }, {
            where: {
                from: strangerId,
                to: req.user.id
            }
        });
        if(status==="accept"){
            let chat = await db.Chat.create({
                chatName: req.user.id+"_"+strangerId,
            });
            await db.ChatUser.create({
                chatId: chat.id,
                userId: req.user.id
            });
            await db.ChatUser.create({
                chatId: chat.id,
                userId: strangerId
            })
        }
        res.status(200).json({
            success: true,
            messages: 'Friend Request has been '+ status+"ed",
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import crypto from 'crypto';

//chatName is the name of the chat
//isGroupChat tells whether it is to create a group or direct message chat
//usersArray consists of the userdId belongs to that particular chat

let controller = async (req, res, next)=>{
    const {chatName, isGroupChat, usersArray} = req.body;

    let transaction;
    try{
        let chat;
        transaction = await db.sequelize.transaction();
        if(isGroupChat){
            chat = await db.Chat.create({
                chatName, isGroupChat, groupAdmin: req.user.id
            }, {transaction})
        }else{
            chat = await db.Chat.create({
                chatName
            })
        }
        let chatUserEntries = usersArray.map(userId => ({
            id: crypto.randomUUID(),
            chatId: chat.id,
            userId : userId
        }))
        chatUserEntries = [...chatUserEntries, {id: crypto.randomUUID(), chatId: chat.id, userId: req.user.id}];
    
        const chatUsersList = await db.ChatUser.bulkCreate(chatUserEntries, {transaction});
        await transaction.commit();
        res.status(201).json({
            data:chat,
            success: true,
            messages: 'chat created successfully'
        });
    }catch(error){
        if(transaction) await transaction.rollback();
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


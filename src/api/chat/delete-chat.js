import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import crypto from 'crypto';
import { authenticateDataForUser } from '../../authenticateDataForUser';

//chatName is the name of the chat
//isGroupChat tells whether it is to create a group or direct message chat
//usersArray consists of the userdId belongs to that particular chat

let controller = async (req, res, next)=>{
    try{
        let {chatId} = req.params;
        await authenticateDataForUser({userId: req.user.id, chatId});
        let chat =  await db.Chat.findOne({
            where: {
                id: chatId
            }
        });
        if(!chat) throw new RequestError("Invalid ChatId", 400);
        console.log("Reached to delete chat: ", chatId);
        await db.ChatUser.destroy({
            where: {
                chatId
            },
            // force: true
        })
        if(!chat.isGroupchat){
            await db.Message.destroy({
                where: {
                    chatId
                },
                // force: true
            });
            await db.Chat.destroy({
                where: {
                    id: chatId
                },
                // force: true
            });
            await db.Friend_Request.destroy({
                where: {
                    [db.Sequelize.Op.or]: [
                        { from: chat.chatName.split('_')[0], to: chat.chatName.split('_')[1] },
                        { from: chat.chatName.split('_')[1], to: chat.chatName.split('_')[0] }
                    ]
                },
                // force: true
            });
        }

        res.status(200).json({
            success: true,
            message: 'Chat deleted successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/:chatId').post(jwtStrategy, controller);
export default apiRouter;


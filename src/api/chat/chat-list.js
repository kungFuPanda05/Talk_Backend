//it gives me the chats corresponding to a user
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import { match } from '../../functions';


let controller = async (req, res, next)=>{
    try{
        let { limit=10, page=1, search = ""} = req.query;
        limit = limit ? parseInt(limit, 10) : 10;
        const offset = page ? (parseInt(page, 10) - 1) * limit : 0;
        let chats;
        if(process.env.ULTRA_SEARCH=="true"){
            chats = await db.Chat.findAll({
                attributes: ['id','chatName', 'isGroupChat', 'avatar'],
                include: [
                    {
                        model: db.ChatUser,
                        attributes: ['newMessageCount'],
                        where: {
                            userId: req.user.id,
                        },                        
                        required: true
                    },
                    {
                        model: db.Message,
                        attributes: ['content', 'sentBy', 'createdAt'],
                        as: 'Last_Message',  
                        required: false,    
                    }
                ],
                order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],

            });
            console.log("The chats are: ", JSON.parse(JSON.stringify(chats)));
            
            chats = await Promise.all(chats.map(async (chat) => {
                // Convert `chat` to a plain object to allow modification
                chat = chat.get({ plain: true });
                if (!chat.isGroupChat) {
                    let user = await db.User.findOne({
                        attributes: ['id', 'name', 'Online'],
                        include: [{
                            model: db.ChatUser,
                            attributes: [],
                            required: true,
                            where: {
                                chatId: chat.id
                            }
                        },{
                            model: db.Friend_Request,
                            as: 'ReceivedRequests',
                            attributes: ['status'],
                            where: {
                                from: req.user.id
                            },
                            required: false
                        }],
                        where: {
                            id: {
                                [Op.ne]: req.user.id
                            }
                        }
                    });
                    chat.chatName = user?.name ?? chat.chatName;
                    chat.friendId = user.id;
                    chat.friendOnlineStatus = user.Online>0?true: false
                    chat.status = (user.ReceivedRequests && user.ReceivedRequests[0] && user.ReceivedRequests[0].status) || "accepted"
                }
                if(chat.Last_Message?.content) chat.Last_Message.content = (chat.Last_Message.content.length>50)?(chat.Last_Message.content.slice(0, 50).trim()+"..."):(chat.Last_Message.content)
                chat.newMessageCount = chat.ChatUsers[0]?.newMessageCount ?? 0;
                delete chat.ChatUsers;
                return chat;
            }));
            chats = chats
            .filter((c) => (match(c.chatName, search) && c.status==="accepted"))  
            .slice(offset, offset + limit);     
            

        }else{
            // chats = await db.Chat.findAll({
            //     include: [
            //         {
            //             model: db.ChatUser,
            //             attributes: [],
            //             where: {
            //                 userId: req.user.id,
            //             },                        
            //             required: true
            //         },
            //         {
            //             model: db.Message,
            //             attributes: ['content', 'sentBy', 'createdAt'],
            //             as: 'Last_Message',
            //             required: false      
            //         }
            //     ],
            //     where: {
            //         chatName: { [Op.like]: `%${search}%` }
            //     },
            //     order: [[db.Sequelize.literal(`(SELECT m.createdAt FROM Messages AS m WHERE m.id = Chat.lastMessageId)`), 'DESC']],
            //     limit,
            //     offset
            // });
            

        }


        res.status(200).json({
            result: chats,
            success: true,
            messages: 'chats list retrieved successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


import { Op } from "sequelize";
import db from "../models";
import { onlineUsers } from "./randomConnLogic";
import io from "./index";

export const createMessage = async (socket, chatId, content, createdAt, type="text") => {
    let selfUserId = socket.user.id;
    let selfId, friendId;
    try {
        let chat = await db.Chat.findOne({
            attributes: ['isGroupChat', 'chatName'],
            where: {
                id: chatId
            }
        });
        if (!chat) throw new RequestError("Invalid ChatId", 400);
        if (!chat.isGroupChat) {
            [selfId, friendId] = chat.chatName.split('_');
            if (friendId == selfUserId) {
                let temp = selfId;
                selfId = friendId;
                friendId = temp;
            }

            const [isBlockedByYou, isBlocked] = await Promise.all([
                db.Friend_Request.count({ where: { from: selfUserId, to: friendId, status: "blocked" } }),
                db.Friend_Request.count({ where: { from: friendId, to: selfUserId, status: "blocked" } }),
            ]);
            if (isBlockedByYou) throw new RequestError("You had blocked this user, to send the message unblock", 409);
            if (isBlocked) throw new RequestError("The other user has blocked you");
        }

        const message = await db.Message.create({
            chatId, content, sentBy: selfUserId, createdAt, updatedAt: createdAt, type
        })

        db.Chat.update({
            lastMessageId: message.id
        }, {
            where: {
                id: chatId
            }
        }).catch(err => console.log("Error occured while updating chat from chatId: ", chatId, err));
        console.log("the online users are: ", onlineUsers);
        db.ChatUser.update(
            {
                newMessageCount: db.Sequelize.literal('newMessageCount + 1'),
            },
            {
                where: {
                    chatId,
                    userId: {
                        [Op.and]: [
                            { [Op.notIn]: Object.keys(onlineUsers) }, // Exclude online users
                            { [Op.ne]: selfUserId } // Exclude current user
                        ]
                    }
                }
            }
        ).catch(err => console.log("Error occured while updating chatUser for chatId: ", chatId, err));

    } catch (error) {
        console.log("Error creating the message: ", error);
        if(error.message==="You had blocked this user, to send the message unblock" || error.message==="The other user has blocked you"){
            socket.emit('error', { 
                response: {
                    data: {
                        success: false,
                        messages: error.errorList
                    } 
                }
            });
            socket.leave(chatId);
            if(onlineUsers[friendId]?.length){
                const friendSocketIds = onlineUsers[friendId];
                for(let friendScoektId of friendSocketIds){
                    const friendSocket = io.sockets.sockets.get(friendScoektId); // Get the socket by its ID
                    if (friendSocket) {
                        friendSocket.leave(chatId); // Make the friendSocket leave the specified room
                        console.log(`friendSocket ${onlineUsers[friendId]} has left room ${chatId}`);
                    } else {
                        console.log(`friendSocket with ID ${onlineUsers[friendId]} not found`);
                    }
                }
            }
        }
    }
}
import db from "../models"

export const authenticateDataForUser = async({
    userId,
    chatId
}) => {
    let chatUser = await db.ChatUser.findOne({
        where: {
            chatId,
            userId
        }
    });
    if(!chatUser) throw new RequestError("You are not a part of this chat", 400);
}
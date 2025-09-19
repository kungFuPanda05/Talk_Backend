//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import Joi from 'joi';
import { validateBody } from '../../middleware/validator';
import { logoUpload, sendImageUpload } from '../../middleware/multer-config';
import { createMessage } from '../../service';
import io from '../..';
import { onlineUsers } from '../../randomConnLogic';

const validator = Joi.object({
    chatId: Joi.number().integer().required(), 
    // sendImages: Joi.string().required()
});


let controller = async (req, res, next)=>{
    try{ 
        let {chatId=0} = req.params;
        chatId = parseInt(chatId, 10);
        let {identityKey} = req.query;
        const pic = req.file? `uploads/sendImages/${req.file.filename}` : null;
        if(!pic) throw new RequestError("No Image found", 400);
        if(!onlineUsers[req.user.id]?.length) throw new RequestError("User is not online", 400);
        const socket = io.sockets.sockets.get(onlineUsers[req.user.id][0]);
        let createdAt = new Date();
        await createMessage(socket, chatId, pic, createdAt, "image");

        io.to(chatId).emit('message', { userId: req.user.id, content: pic, chatId, identityKey, createdAt, type: "image" });
        res.status(200).json({
            success: true,
            pic,
            messages: 'Image uploaded successfully'
        });
    }catch(error){
        next(error);
    }
}
const apiRouter = express.Router();
apiRouter.route('/:chatId').post(sendImageUpload.single('sendImage'), /*validateBody(validator),*/ jwtStrategy, controller);
export default apiRouter;


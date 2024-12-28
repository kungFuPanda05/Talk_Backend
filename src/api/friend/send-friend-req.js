//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';
import dbFunctions from '../../dbFunctions';


let controller = async (req, res, next)=>{
    
    try{
        const {selfId, strangerId} = req.body;
        let isBlocked = await db.Friend_Request.findOne({
            where: {
                from: strangerId,
                to: req.user.id,
                status: 'blocked'
            },
            raw: true
        });
        if (isBlocked) throw new RequestError("The other user has blocked you, you can try sending a mail to them", 409);
        let friend_request = await db.Friend_Request.findOne({
            where: {
                from: selfId,
                to: strangerId
            }
        });
        let reverse_friend = await db.Friend_Request.findOne({
            where: {
                from: strangerId,
                to: selfId
            }
        });
        if(friend_request?.status==="accepted" || reverse_friend?.status==="accepted") throw new RequestError("Already Added friends", 409);
        if(reverse_friend?.status==='pending') throw new RequestError("Stranger had already sent you the friend request, Please Add", 409);
        if(friend_request?.status==="pending") throw new RequestError("Friend request had already been sent to the user", 409);

        await dbFunctions.createUnique(db.Friend_Request, {
            from: selfId,
            to: strangerId
        });

        
        res.status(200).json({
            success: true,
            messages: 'Request sent to stranger successfully',
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


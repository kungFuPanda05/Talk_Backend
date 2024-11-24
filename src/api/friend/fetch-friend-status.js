//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        const {selfId, strangerId} = req.body;
        let friendRequest = await db.Friend_Request.findOne({
            attributes: ['status'],
            where: {
                from: strangerId,
                to: selfId
            }
        });
        let reverseFriendReq = await db.Friend_Request.findOne({
            attributes: ['status'],
            where: {
                from: selfId,
                to: strangerId
            }
        })
        res.status(200).json({
            success: true,
            messages: 'Friend Request status received successfully',
            response: {
                isReqSent: reverseFriendReq? true: false,
                isReqRecieved: friendRequest? true: false,
                isAccept: (friendRequest?.status==="accepted")?true:false,
                isReject: (friendRequest?.status==="rejected")?true:false
            }
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


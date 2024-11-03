//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        const {selfId, strangerId} = req.body;
        let friend_request = await db.Friend_Request.findOne({
            where: {
                from: selfId,
                to: strangerId
            }
        });
        //ismein thode aur cases banenge sochke likhna
        if(friend_request?.status==="Pending") throw new RequestError("Friend request had already been sent to the user", 409);

        await db.Friend_Request.create({
            from: selfId,
            to: strangerId
        })
        
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


//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        let {status, strangerId} = req.body;
        await db.Friend_Request.update({
            status,
            where: {
                from: req.user.id,
                to: strangerId
            }
        })
        res.status(200).json({
            success: true,
            message: "User has been"+ status==="pending"?" recoverd, you can find them in friend request list":" unblocked" 
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


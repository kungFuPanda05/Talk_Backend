//it will create a message


import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op, where } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        const {to, description} = req.body;
        let isValidUser = await db.User.count({
            where: {
                id: to
            }
        });
        if(!isValidUser) throw new RequestError("Invalid friend", 400);

        await db.Report.create({
            from: req.user.id, to, description
        });
        res.status(200).json({
            success: true,
            message: 'User has been reported successfully',
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(jwtStrategy, controller);
export default apiRouter;


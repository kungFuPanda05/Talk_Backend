
import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';
import { Op } from 'sequelize';


let controller = async (req, res, next)=>{
    
    try{
        let {friendId} = req.params;
        await db.Friend_Request.destroy({
            where: {
                from: req.user.id,
                to: friendId
            }
        })


        res.status(200).json({
            success: true,
            messages: "Record deleted successfully",
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/:friendId').post(jwtStrategy, controller);
export default apiRouter;


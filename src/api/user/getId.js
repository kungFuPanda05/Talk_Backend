import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';
import db from '../../../models';

let controller = async (req, res, next)=>{
    try{
        res.status(200).json({
            result: req.user.id,
            success: true,
            messages: 'USer Id fetched successfully'
        });
    }catch(error){
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, controller);
export default apiRouter;


import express from 'express';
import db from '../../../models';
import jwtStrategy from '../../strategy/auth/jwtauth';
import dbFunctions from '../../dbFunctions';


let controller = async (req, res, next)=>{
    
    try{
        let isCreated = await dbFunctions.createUnique(db.Friend_Request, {
            from: 2,
            to: 1
        }, false);

        res.status(200).json({
            success: true,
            message: "Friend Request created successfully",
            isCreated
        });
    }catch(error){
        console.log("The error is : ", error.name);
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').get(controller);
export default apiRouter;


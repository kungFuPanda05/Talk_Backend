import express from 'express';
import localStrategy from '../../strategy/auth/localauth';
import { signAuthToken } from '../../authToken';

let controller = async(req, res, next)=>{
    try {
        const token = signAuthToken(req.user);
        const {id, name, email, gender, coins, isGuest} = req.user;
        return res.status(200).json({
            success: true,
            token,
            message: "User logged in",
            user: {id, name, email, gender, coins, isGuest: Boolean(isGuest)}
        })
    } catch (error) {
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(localStrategy, controller);
export default apiRouter;

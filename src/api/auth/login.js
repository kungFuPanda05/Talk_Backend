import express from 'express';
import localStrategy from '../../strategy/auth/localauth';
import config from '../../../config'
import JWT from 'jsonwebtoken';
const JWTSign = (user, date)=>{
    return JWT.sign(
        {
            iss: config.app.name,
            sub: user.id,
            iat: date.getTime()
        },
        config.app.secret,
        {
            expiresIn: "30d"
        }
    );
}

let controller = async(req, res, next)=>{
    try {
        const token = JWTSign(req.user, new Date());
        const {name, email} = req.user;
        return res.status(200).json({
            success: true,
            token,
            message: "User logged in",
            user: {name, email}
        })
    } catch (error) {
        next(error);
    }
}

const apiRouter = express.Router();
apiRouter.route('/').post(localStrategy, controller);
export default apiRouter;


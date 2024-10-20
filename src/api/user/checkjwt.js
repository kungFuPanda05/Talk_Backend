import express from 'express';
import jwtStrategy from '../../strategy/auth/jwtauth';

const apiRouter = express.Router();
apiRouter.route('/').get(jwtStrategy, (req, res, next)=>{
    
    res.json({
        message: "The jwt is Working fine"
    })
});
export default apiRouter;


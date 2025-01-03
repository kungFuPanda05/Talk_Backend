import passport from 'passport'

const jwtStrategy = async (req , res , next) => {
    passport.authenticate('jwt' , {session : false} , (err , user) => {
        if (err && err == "user" || !user) {
            return next(new RequestError("UnAuthorized User", 401));
        }
        if (err) {
            return next(new RequestError(err));
        }
        req.user = user;
        next();
    })(req , res , next);
}

export default jwtStrategy;
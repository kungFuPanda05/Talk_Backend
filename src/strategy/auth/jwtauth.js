import passport from 'passport'

const jwtStrategy = async (req , res , next) => {
    passport.authenticate('jwt' , {session : false} , (err , user) => {
        if (err && err == "user" || !user) {
            return next(new Error("UnAuthorized User"));
        }
        if (err) {
            return next(new Error(err));
        }
        req.user = user;
        next();
    })(req , res , next);
}

export default jwtStrategy;
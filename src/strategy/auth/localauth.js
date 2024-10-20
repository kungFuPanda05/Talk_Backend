import passport from 'passport'
const localStrategy = async(req, res, next)=>{
    passport.authenticate('local', {session: false}, (err, user)=>{
        if(err){
            if(err==='invalid-email') return next(new Error("Invalid email")); //according to me this error should get passed to the next middleware in the chain but instead it is showing the error from here only
            else if(err==='wrong-password') return next(new Error("Invalid password"));
            else next(err);
        }
        req.user = user;
        next();
    })(req, res, next);
}
export default localStrategy;
import passport from 'passport'
const localStrategy = async(req, res, next)=>{
    passport.authenticate('local', {session: false}, (err, user)=>{
        if(err){
            if(err==='invalid-email') return next(new RequestError("Invalid email")); //according to me this Requesterror should get passed to the next middleware in the chain but instead it is showing the Requesterror from here only
            else if(err==='wrong-password') return next(new RequestError("Invalid password"));
            else next(err);
        }
        req.user = user;
        next();
    })(req, res, next);
}
export default localStrategy;
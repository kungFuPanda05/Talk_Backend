const db = require("../../models");


const JwtStrategyAuthenticationLogic = async (payload, done) =>{
    
    try {
        if(!payload) return done("user", false);
        let user = await db.User.findOne({where : {id : payload.sub}})
        if(!user) return done('user' , null);
        return done(null, user);
    } catch (error) {
        done(error, false);
    }
}

export default JwtStrategyAuthenticationLogic;
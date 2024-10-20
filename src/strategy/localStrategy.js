const db = require("../../models");
import bcrypt from 'bcrypt';


const LocalStrategyAuthenticationLogic = async (req, email, password, done)=>{
    try{
        const user = await db.User.findOne({where: {email}});
        if(!user) return done("invalid-email", null);
        const passwordMatched = bcrypt.compareSync(password, user.password);
        if(!passwordMatched) return done('wrong-password', null);
        return done(null, user);
    }catch(error){
        return done(error, false);
    }
}
export default LocalStrategyAuthenticationLogic;
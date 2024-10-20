const passport = require("passport");
import JwtStrategyAuthenticationLogic from "./strategy/jwtStrategy";
import LocalStrategyAuthenticationLogic from "./strategy/localStrategy";
import {Strategy as LocalStrategy} from 'passport-local';
import {Strategy as JwtStrategy, ExtractJwt} from 'passport-jwt';
import config from '../config';


passport.use(new LocalStrategy({
    usernameField: 'email',
    passReqToCallback: true //it means that an additional "req" object will pass to passport.authenticate function
}, LocalStrategyAuthenticationLogic));

passport.use('jwt', new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.app.secret,
},JwtStrategyAuthenticationLogic))


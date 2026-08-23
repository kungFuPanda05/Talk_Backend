import JWT from 'jsonwebtoken';
import config from '../config';

export const signAuthToken = (user) => JWT.sign(
    {
        iss: config.app.name,
        sub: String(user.id)
    },
    config.app.secret,
    {
        expiresIn: '30d'
    }
);

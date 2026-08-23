import crypto from 'crypto';
import express from 'express';
import Joi from 'joi';
import db from '../../../models';
import { signAuthToken } from '../../authToken';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    name: Joi.string().trim().min(2).max(40).required(),
    gender: Joi.string().valid('M', 'F').required()
});

const controller = async (req, res, next) => {
    try {
        const guestId = crypto.randomUUID();
        const user = await db.User.create({
            name: req.body.name.trim(),
            gender: req.body.gender,
            email: `guest-${guestId}@guest.chittalk.local`,
            password: crypto.randomBytes(32).toString('hex'),
            isGuest: true,
            Online: 0,
            coins: 100,
            rating: 0
        });
        const token = signAuthToken(user);

        return res.status(201).json({
            success: true,
            token,
            message: 'Guest session created',
            user: {
                id: user.id,
                name: user.name,
                gender: user.gender,
                coins: user.coins,
                isGuest: true
            }
        });
    } catch (error) {
        next(error);
    }
};

const apiRouter = express.Router();
apiRouter.route('/').post(validateBody(validator), controller);

export default apiRouter;

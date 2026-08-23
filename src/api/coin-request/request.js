import express from 'express';
import Joi from 'joi';
import db from '../../../models';
import jwtStrategy from '../../strategy/auth/jwtauth';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    requestedCoins: Joi.number().integer().min(1).max(100).required()
});

const requestAttributes = [
    'id',
    'requestedCoins',
    'status',
    'reviewedAt',
    'adminNote',
    'createdAt',
    'updatedAt'
];

const getController = async (req, res, next) => {
    try {
        const request = await db.Coin_Request.findOne({
            attributes: requestAttributes,
            where: { userId: req.user.id },
            order: [['createdAt', 'DESC'], ['id', 'DESC']]
        });

        res.status(200).json({
            success: true,
            request
        });
    } catch (error) {
        next(error);
    }
};

const postController = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();

    try {
        const user = await db.User.findByPk(req.user.id, {
            attributes: ['id', 'coins'],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!user) throw new RequestError('User not found', 404);
        if (user.coins > 0) {
            throw new RequestError('You can request more coins after your balance reaches zero', 409);
        }

        const pendingRequest = await db.Coin_Request.findOne({
            where: {
                userId: user.id,
                status: 'pending'
            },
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (pendingRequest) {
            throw new RequestError('You already have a pending coin request', 409);
        }

        const request = await db.Coin_Request.create({
            userId: user.id,
            requestedCoins: req.body.requestedCoins,
            status: 'pending'
        }, { transaction });

        await transaction.commit();

        res.status(201).json({
            success: true,
            message: 'Coin request submitted',
            request: {
                id: request.id,
                requestedCoins: request.requestedCoins,
                status: request.status,
                createdAt: request.createdAt
            }
        });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        next(error);
    }
};

const apiRouter = express.Router();
apiRouter.route('/')
    .get(jwtStrategy, getController)
    .post(jwtStrategy, validateBody(validator), postController);

export default apiRouter;

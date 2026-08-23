import express from 'express';
import Joi from 'joi';
import db from '../../../models';
import jwtStrategy from '../../strategy/auth/jwtauth';
import adminOnly from '../../middleware/adminOnly';
import { validateBody } from '../../middleware/validator';

const validator = Joi.object({
    requestId: Joi.number().integer().positive().required(),
    status: Joi.string().valid('approved', 'rejected').required(),
    adminNote: Joi.string().trim().max(255).allow('', null)
});

const controller = async (req, res, next) => {
    const transaction = await db.sequelize.transaction();

    try {
        const request = await db.Coin_Request.findByPk(req.params.requestId, {
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!request) throw new RequestError('Coin request not found', 404);
        if (request.status !== 'pending') {
            throw new RequestError('This coin request has already been reviewed', 409);
        }

        const user = await db.User.findByPk(request.userId, {
            attributes: ['id', 'coins'],
            transaction,
            lock: transaction.LOCK.UPDATE
        });

        if (!user) throw new RequestError('Requesting user not found', 404);

        if (req.body.status === 'approved') {
            await user.increment('coins', {
                by: request.requestedCoins,
                transaction
            });
            await user.reload({ transaction });
        }

        await request.update({
            status: req.body.status,
            reviewedBy: req.user.id,
            reviewedAt: new Date(),
            adminNote: req.body.adminNote || null
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            success: true,
            message: `Coin request ${request.status}`,
            request: {
                id: request.id,
                userId: request.userId,
                requestedCoins: request.requestedCoins,
                status: request.status,
                reviewedAt: request.reviewedAt,
                adminNote: request.adminNote
            },
            coins: user.coins
        });
    } catch (error) {
        if (!transaction.finished) await transaction.rollback();
        next(error);
    }
};

const apiRouter = express.Router();
apiRouter.route('/:requestId').patch(
    jwtStrategy,
    adminOnly,
    validateBody(validator),
    controller
);

export default apiRouter;

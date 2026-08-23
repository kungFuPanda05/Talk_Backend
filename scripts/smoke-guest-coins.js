import 'dotenv/config';
import axios from 'axios';
import JWT from 'jsonwebtoken';
import { io } from 'socket.io-client';
import db from '../models';
import { signAuthToken } from '../src/authToken';

const api = axios.create({
    baseURL: process.env.SMOKE_API_URL || `http://127.0.0.1:${process.env.PORT || process.env.APP_PORT || 4000}`,
    validateStatus: () => true
});

const assert = (condition, message) => {
    if (!condition) throw new Error(message);
};

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

const run = async () => {
    let accountId;
    let userId;
    let requestId;
    let socket;

    try {
        const admin = await db.User.findOne({ where: { isAdmin: true } });
        assert(admin, 'A local admin user is required for the smoke check');

        const accountEmail = `smoke-${Date.now()}@example.com`;
        const accountPassword = 'SmokePass123!';
        const registerResponse = await api.post('/api/auth/register', {
            name: 'Smoke Account',
            gender: 'M',
            email: accountEmail,
            password: accountPassword
        });
        assert(registerResponse.status === 200, `Account registration returned ${registerResponse.status}`);

        const account = await db.User.findOne({ where: { email: accountEmail } });
        assert(account, 'Registered account was not persisted');
        accountId = account.id;

        const loginResponse = await api.post('/api/auth/login', {
            email: accountEmail,
            password: accountPassword
        });
        assert(loginResponse.status === 200, `Account login returned ${loginResponse.status}`);
        assert(loginResponse.data.user.isGuest === false, 'Registered account was marked as guest');

        const guestResponse = await api.post('/api/auth/guest', {
            name: `Smoke Guest ${Date.now()}`,
            gender: 'F'
        });
        assert(guestResponse.status === 201, `Guest creation returned ${guestResponse.status}`);

        const guestToken = guestResponse.data.token;
        userId = Number(JWT.decode(guestToken).sub);
        const userHeaders = { Authorization: `Bearer ${guestToken}` };

        const profileResponse = await api.get('/api/user/getProfile', { headers: userHeaders });
        assert(profileResponse.status === 200, `Guest profile returned ${profileResponse.status}`);
        assert(profileResponse.data.profile.isGuest === true, 'Guest profile is not marked as guest');
        assert(profileResponse.data.profile.email === null, 'Guest internal email leaked through the profile API');

        const chatListResponse = await api.get('/api/chat/chat-list?search=&limit=100&page=1', {
            headers: userHeaders
        });
        assert(chatListResponse.status === 200, `Chat list returned ${chatListResponse.status}`);
        assert(Array.isArray(chatListResponse.data.result), 'Chat list result is not an array');

        const fundedRequestResponse = await api.post('/api/coin-request/request', {
            requestedCoins: 50
        }, { headers: userHeaders });
        assert(fundedRequestResponse.status === 409, `Funded user request returned ${fundedRequestResponse.status}`);

        await db.User.update({ coins: 0 }, { where: { id: userId } });

        const overLimitResponse = await api.post('/api/coin-request/request', {
            requestedCoins: 101
        }, { headers: userHeaders });
        assert(overLimitResponse.status === 400, `Over-limit request returned ${overLimitResponse.status}`);

        const requestResponse = await api.post('/api/coin-request/request', {
            requestedCoins: 100
        }, { headers: userHeaders });
        assert(requestResponse.status === 201, `Coin request returned ${requestResponse.status}`);
        assert(requestResponse.data.request.status === 'pending', 'Coin request was not created as pending');
        requestId = requestResponse.data.request.id;

        const duplicatePendingResponse = await api.post('/api/coin-request/request', {
            requestedCoins: 10
        }, { headers: userHeaders });
        assert(duplicatePendingResponse.status === 409, `Duplicate pending request returned ${duplicatePendingResponse.status}`);

        const nonAdminReviewResponse = await api.patch(`/api/coin-request/review/${requestId}`, {
            status: 'approved'
        }, { headers: userHeaders });
        assert(nonAdminReviewResponse.status === 403, `Non-admin approval returned ${nonAdminReviewResponse.status}`);

        const adminHeaders = { Authorization: `Bearer ${signAuthToken(admin)}` };
        const listResponse = await api.get('/api/coin-request/admin-list?status=pending&page=1&limit=100', {
            headers: adminHeaders
        });
        assert(listResponse.status === 200, `Admin list returned ${listResponse.status}`);
        assert(listResponse.data.requests.some((request) => request.id === requestId), 'Pending request is missing from the admin list');

        const reviewResponse = await api.patch(`/api/coin-request/review/${requestId}`, {
            status: 'approved',
            adminNote: 'Automated smoke check'
        }, { headers: adminHeaders });
        assert(reviewResponse.status === 200, `Admin approval returned ${reviewResponse.status}`);
        assert(reviewResponse.data.coins === 100, 'Approved coins were not credited');

        const duplicateResponse = await api.patch(`/api/coin-request/review/${requestId}`, {
            status: 'approved'
        }, { headers: adminHeaders });
        assert(duplicateResponse.status === 409, `Duplicate approval returned ${duplicateResponse.status}`);

        const persistedUser = await db.User.findByPk(userId);
        const persistedRequest = await db.Coin_Request.findByPk(requestId);
        assert(persistedUser.coins === 100, 'Final user balance is incorrect');
        assert(persistedRequest.status === 'approved', 'Final request status is incorrect');

        socket = io(api.defaults.baseURL, {
            auth: { token: guestToken },
            transports: ['websocket'],
            reconnection: false
        });
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Realtime authentication timed out')), 3000);
            socket.once('connect', () => {
                clearTimeout(timeout);
                resolve();
            });
            socket.once('connect_error', (error) => {
                clearTimeout(timeout);
                reject(error);
            });
        });

        await db.User.update({ coins: 5 }, { where: { id: userId } });
        const paidMatchError = new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error('Paid-match balance guard timed out')), 3000);
            socket.once('error', (error) => {
                clearTimeout(timeout);
                resolve(error);
            });
        });
        socket.emit('join-room', { gwant: 'M', miRating: 0, maRating: 5 });
        const matchError = await paidMatchError;
        const matchMessages = matchError?.response?.data?.messages || [];
        assert(matchMessages.includes('You need 10 coins for this preference'), 'Paid match accepted a balance below 10 coins');
        await db.User.update({ coins: 100 }, { where: { id: userId } });

        console.log(JSON.stringify({
            accountLogin: 'passed',
            guestAuth: 'passed',
            chatList: 'passed',
            coinValidation: 'passed',
            coinRequest: 'passed',
            adminGuard: 'passed',
            adminApproval: 'passed',
            oneTimeCredit: 'passed',
            realtimeAuth: 'passed',
            paidMatchGuard: 'passed'
        }));
    } finally {
        try {
            if (requestId) await db.Coin_Request.destroy({ where: { id: requestId }, force: true });
            if (userId) await db.User.destroy({ where: { id: userId }, force: true });
            if (accountId) await db.User.destroy({ where: { id: accountId }, force: true });
            if (socket) {
                socket.disconnect();
                await delay(250);
                const healthResponse = await api.get('/health');
                assert(healthResponse.status === 200, 'Backend stopped after the deleted guest disconnected');
            }
        } finally {
            await db.sequelize.close();
        }
    }
};

run().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
});

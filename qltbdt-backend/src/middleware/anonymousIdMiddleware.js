const { v4: uuidv4 } = require('uuid');

const anonymousIdMiddleware = (req, res, next) => {
    const cookieName = 'anon_id';
    let anonId = req.cookies[cookieName];

    if (!anonId) {
        anonId = uuidv4();
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Lax',
            maxAge: 365 * 24 * 60 * 60 * 1000 // 1 năm
        };
        res.cookie(cookieName, anonId, cookieOptions);
        console.log(`[AnonMiddleware] New anonymous ID generated and set: ${anonId}`);
    } else {
        // console.log(`[AnonMiddleware] Existing anonymous ID found: ${anonId}`);
    }

    // Gắn anonId vào request để controller sử dụng
    req.anonymous_voter_id = anonId;
    next();
};

module.exports = anonymousIdMiddleware;
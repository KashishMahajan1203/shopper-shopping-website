const jwt = require('jsonwebtoken');

// Requires a valid JWT in the "Authorization" header ("Bearer <token>" or just "<token>").
const ensureAuthenticated = (req, res, next) => {
    const header = req.headers['authorization'] || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : header;
    if (!token) {
        return res.status(401)
            .json({ message: 'Please log in to continue', success: false });
    }
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        next();
    } catch (err) {
        return res.status(401)
            .json({ message: 'Your session has expired. Please log in again.', success: false });
    }
}

module.exports = ensureAuthenticated;

const jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
    // Get token from header
    const token = req.header('x-auth-token');
    console.log('Auth middleware - Request headers:', req.headers);
    console.log('Auth middleware - Token received:', token);

    // Check if JWT_SECRET is set
    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET is not set in environment variables');
        return res.status(500).json({
            success: false,
            message: 'Server configuration error'
        });
    }

    // Check if no token
    if (!token) {
        console.log('Auth middleware - No token provided');
        return res.status(401).json({
            success: false,
            message: 'No token, authorization denied'
        });
    }

    try {
        // Verify token
        console.log('Attempting to verify token with secret:', process.env.JWT_SECRET);
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        console.log('Auth middleware - Token decoded:', decoded);

        // Add user from payload
        req.user = decoded.user;
        console.log('Auth middleware - User added to request:', req.user);
        next();
    } catch (err) {
        console.error('Auth middleware - Token verification error:', {
            name: err.name,
            message: err.message,
            stack: err.stack
        });

        if (err.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired'
            });
        }

        if (err.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token'
            });
        }

        res.status(401).json({
            success: false,
            message: 'Token is not valid'
        });
    }
}; 
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token
        
        if (!token) {
            return res.redirect('/signin');
        }
        
        req.token = token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        res.clearCookie('auth_token');
        res.redirect('/signin');
    }
};

module.exports = auth;

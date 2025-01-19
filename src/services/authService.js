const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
    try {
        const token = req.cookies.auth_token
        
        if (!token) {
            return res.redirect('/dashboard');
        }
        
        req.token = token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;

        next();
    } catch (error) {
        res.clearCookie('auth_token');
        res.redirect('/auth');
    }
};

const isTokenValid = async (req) => {
    try {
        const token = req.cookies.auth_token

        if (!token) {
            return false
        }

        const decoded = jwt.verify(token,process.env.JWT_SECRET)

        return decoded
    } catch {
        return false
    }
}

module.exports = {auth, isTokenValid};

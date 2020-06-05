const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        req.isAuth = false;
        return next();
    }
    const token = authHeader.split(' ')[1]; // Bearer kjf;weoqjpr43qRFJ$#(UHT*#H$QRju3jrqn430 9ro3hqefu) 
    if (!token || token === '') {
        req.isAuth = false;
        return next();
    }

    let decodedToken;

    try{
        decodedToken = jwt.verify(token, process.env.JWT_KEY);
    }
    catch (err) {
        req.isAuth = false;
        return next();
    }

    if(!decodedToken) {
        req.isAuth = false;
        return next();
    }

    req.isAuth = true;
    req.userId = decodedToken.userId;
    next();

}
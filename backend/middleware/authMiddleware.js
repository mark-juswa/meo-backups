import User from '../models/User.js';
import jwt from 'jsonwebtoken';

export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader){
        return res.status(401).json({ message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid token' });
        }
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };
        next();
    });
}

export const verifyRole = (roles) => {
    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    return (req, res, next) => {
        const userRole = req.user?.role;
        
        if (!userRole || !allowedRoles.includes(userRole)) {
            return res.status(403).json({ message: 'Access denied. You do not have the required permissions.' });
        }
        next();
    };
}
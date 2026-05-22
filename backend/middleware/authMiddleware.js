import firebaseAdmin from "../lib/firebaseAdmin.js";
import User from "../models/User.js";

export const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await firebaseAdmin.adminAuth.verifyIdToken(token);

    // Look up MongoDB user to get the actual role (not Firebase custom claims)
    const mongoUser = await User.findOne({ uid: decodedToken.uid });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: mongoUser?.role || decodedToken.role || 'donor',
      firstName: decodedToken.firstName || '',
      lastName: decodedToken.lastName || '',
      _id: mongoUser?._id,
    };

    next();
  } catch (error) {
    console.error('Token verification error:', error.message);
    return res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};

export const optionalVerifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await firebaseAdmin.adminAuth.verifyIdToken(token);
    const mongoUser = await User.findOne({ uid: decodedToken.uid });

    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      role: mongoUser?.role || decodedToken.role || 'donor',
      firstName: decodedToken.firstName || '',
      lastName: decodedToken.lastName || '',
      _id: mongoUser?._id,
    };
    next();
  } catch (error) {
    // If token is invalid, we just proceed as guest
    next();
  }
};

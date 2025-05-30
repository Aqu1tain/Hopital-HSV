import jwt from 'jsonwebtoken';
import crypto from 'crypto';

// Utilitaire : générer un code OTP à 6 chiffres
export function generateCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function hashCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

export function generateToken(payload, expiresIn = '8h') {
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET);
}
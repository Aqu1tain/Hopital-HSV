import express from 'express';
import { upload } from '../../config/multer.js';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  requestOtp, 
  logout, 
  verifyOtp, 
  signupPatient, 
  signupPractitioner,
  redirectHome 
} from '../../controllers/authController.js';

const router = express.Router();

// Auth routes
router.post('/request', requestOtp);
router.post('/logout', logout);
router.post('/verify', verifyOtp);

// Signup routes
router.post('/signup/patient', signupPatient);
router.post('/signup/practitioner', signupPractitioner);

// Protected routes
router.get('/redirect-home', authMiddleware, redirectHome);

export default router;
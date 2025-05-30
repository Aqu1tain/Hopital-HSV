import express from 'express';
import { upload } from '../../config/multer.js';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  testEmail, 
  getMe, 
  updateUser, 
  updateProfilePicture 
} from '../../controllers/userController.js';

const router = express.Router();

// Test email route
router.get('/test-email', testEmail);

// Protected user routes
router.get('/me', authMiddleware, getMe);
router.patch('/api/users/update', authMiddleware, updateUser);
router.post('/api/users/profile-picture', authMiddleware, upload.single('image'), updateProfilePicture);

export default router;
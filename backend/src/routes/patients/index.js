import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  updatePatient,
  getPatientMedicalHistory
} from '../../controllers/patientController.js';

const router = express.Router();

// All patient routes require authentication
router.use(authMiddleware);

// Patient profile management
router.patch('/update', updatePatient);
router.get('/medical-history', getPatientMedicalHistory);

export default router;
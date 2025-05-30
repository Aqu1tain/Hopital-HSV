import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  getPractitioners,
  getAvailablePractitioners,
  getPractitionerAvailability,
  getPractitionerAppointments,
  updatePractitioner
} from '../../controllers/practitionerController.js';

const router = express.Router();

// All practitioner routes require authentication
router.use(authMiddleware);

// Practitioner search and availability
router.get('/', getPractitioners);
router.get('/available', getAvailablePractitioners);
router.get('/:id/availability', getPractitionerAvailability);
router.get('/:id/appointments', getPractitionerAppointments);

// Practitioner profile management
router.patch('/update', updatePractitioner);

export default router;
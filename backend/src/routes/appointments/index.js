import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  getUpcomingAppointments,
  getPastAppointments,
  createAppointment,
  cancelAppointment,
  getDoctorAppointments,
  acceptAppointment,
  rejectAppointment
} from '../../controllers/appointmentController.js';

const router = express.Router();

// All appointment routes require authentication
router.use(authMiddleware);

// Appointment CRUD operations
router.get('/upcoming', getUpcomingAppointments);
router.get('/past', getPastAppointments);
router.post('/', createAppointment);
router.patch('/:id/cancel', cancelAppointment);

// Doctor specific routes
router.get('/doctor', getDoctorAppointments);
router.post('/:id/accept', acceptAppointment);
router.post('/:id/reject', rejectAppointment);

export default router;
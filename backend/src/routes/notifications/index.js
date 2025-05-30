import express from 'express';
import { authMiddleware } from '../../middleware/auth.js';
import { 
  getPatientNotifications,
  getPractitionerNotifications,
  getNotificationCount,
  cancelNotification,
  cancelAppointmentFromNotification,
  markAllNotificationsRead,
  markNotificationRead
} from '../../controllers/notificationController.js';

const router = express.Router();

// All notification routes require authentication
router.use(authMiddleware);

// Get notifications by role
router.get('/patient', getPatientNotifications);
router.get('/practitioner', getPractitionerNotifications);
router.get('/count', getNotificationCount);

// Notification actions
router.post('/:id/cancel', cancelNotification);
router.post('/:id/cancel-appointment', cancelAppointmentFromNotification);
router.post('/mark-all-read', markAllNotificationsRead);
router.post('/:id/mark-read', markNotificationRead);

export default router;
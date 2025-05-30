import express from 'express';
import authRoutes from './auth/index.js';
import userRoutes from './users/index.js';
import appointmentRoutes from './appointments/index.js';
import practitionerRoutes from './practitioners/index.js';
import patientRoutes from './patients/index.js';
import notificationRoutes from './notifications/index.js';

const router = express.Router();

// Mount routes
router.use('/auth', authRoutes);
router.use('/', userRoutes);
router.use('/api/appointments', appointmentRoutes);
router.use('/api/practitioners', practitionerRoutes);
router.use('/api/patients', patientRoutes);
router.use('/api/notifications', notificationRoutes);

export default router;
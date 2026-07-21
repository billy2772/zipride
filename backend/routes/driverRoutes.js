import express from 'express';
import { DriverController } from '../controllers/driverController.js';
import { requireAuth } from '../middleware/auth.js';
import { requireDriver } from '../middleware/driver.js';
import upload from '../middleware/upload.js';

const router = express.Router();

const docUploads = upload.fields([
  { name: 'licenseImage', maxCount: 1 },
  { name: 'rcBook', maxCount: 1 },
  { name: 'insurance', maxCount: 1 },
  { name: 'profilePhoto', maxCount: 1 },
  { name: 'selfie', maxCount: 1 }
]);

router.get('/profile', requireAuth, requireDriver, DriverController.getProfile);
router.put('/profile', requireAuth, requireDriver, DriverController.updateProfile);
router.get('/vehicle', requireAuth, requireDriver, DriverController.getVehicle);
router.post('/location', requireAuth, requireDriver, DriverController.updateLocation);
router.post('/upload-docs', requireAuth, requireDriver, docUploads, DriverController.uploadDocuments);

export default router;

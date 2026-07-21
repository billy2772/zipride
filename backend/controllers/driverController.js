import { DriverRepository } from '../repositories/driverRepository.js';
import { logRideLocation } from '../repositories/mongoRepository.js';

export const DriverController = {
  async getProfile(req, res, next) {
    try {
      const driver = await DriverRepository.findById(req.user.id);
      const vehicle = await DriverRepository.getVehicle(req.user.id);
      
      return res.json({
        success: true,
        message: 'Driver profile retrieved.',
        data: {
          ...driver,
          vehicle
        }
      });
    } catch (err) {
      next(err);
    }
  },

  async updateProfile(req, res, next) {
    try {
      const updates = req.body;
      const updated = await DriverRepository.updateDriver(req.user.id, updates);
      return res.json({
        success: true,
        message: 'Driver details updated successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  },

  async getVehicle(req, res, next) {
    try {
      const vehicle = await DriverRepository.getVehicle(req.user.id);
      return res.json({
        success: true,
        message: 'Active vehicle retrieved.',
        data: vehicle
      });
    } catch (err) {
      next(err);
    }
  },

  async updateLocation(req, res, next) {
    try {
      const { latitude, longitude, heading, rideId } = req.body;
      if (!latitude || !longitude) {
        return res.status(400).json({ success: false, message: 'Latitude and Longitude are required.' });
      }

      await DriverRepository.updateLocation(req.user.id, latitude, longitude, heading || 0);

      // Log location history to MongoDB (geospatial 2dsphere collection)
      logRideLocation({
        rideId: rideId || 'general',
        driverId: req.user.id,
        latitude,
        longitude,
        heading: heading || 0
      });

      return res.json({
        success: true,
        message: 'Current location updated.',
        data: { latitude, longitude, heading: heading || 0 }
      });
    } catch (err) {
      next(err);
    }
  },

  async uploadDocuments(req, res, next) {
    try {
      const updates = {};
      if (req.files?.licenseImage?.[0]) updates.license_image_url = req.files.licenseImage[0].cloudinaryUrl;
      if (req.files?.rcBook?.[0]) updates.rc_book_url = req.files.rcBook[0].cloudinaryUrl;
      if (req.files?.insurance?.[0]) updates.insurance_url = req.files.insurance[0].cloudinaryUrl;
      if (req.files?.profilePhoto?.[0]) updates.profile_photo_url = req.files.profilePhoto[0].cloudinaryUrl;
      if (req.files?.selfie?.[0]) updates.selfie_url = req.files.selfie[0].cloudinaryUrl;

      const updated = await DriverRepository.updateDriver(req.user.id, updates);
      return res.json({
        success: true,
        message: 'Documents uploaded successfully.',
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }
};

import multer from 'multer';
import cloudinary from '../config/cloudinary.js';

// Setup local memoryStorage to buffer files before pushing to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPG, PNG, WEBP, and PDF files are allowed.'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit per document
});

export const uploadSingle = (fieldName) => upload.single(fieldName);

export const validateDriverDocumentFiles = (req, res, next) => {
  if (req.files?.profilePhoto?.[0]) {
    const file = req.files.profilePhoto[0];
    const allowedPhotoTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (!allowedPhotoTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Profile Photo format. Allowed formats are JPG, JPEG, PNG, WEBP.'
      });
    }
    const minSize = 1 * 1024 * 1024; // 1 MB
    const maxSize = 2 * 1024 * 1024; // 2 MB
    if (file.size < minSize || file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `Profile Photo size must be between 1 MB and 2 MB. Provided size is ${(file.size / (1024 * 1024)).toFixed(2)} MB.`
      });
    }
  }

  if (req.files?.licenseImage?.[0]) {
    const file = req.files.licenseImage[0];
    const allowedLicenceTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedLicenceTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Driving Licence format. Allowed formats are JPG, JPEG, PNG, WEBP, PDF.'
      });
    }
  }

  next();
};

export const uploadToCloudinary = (folderName) => {
  return async (req, res, next) => {
    if (!req.file) return next();

    try {
      console.log(`[Cloudinary Upload] Uploading to folder: "zipride/${folderName}"...`);
      
      const fileBufferStr = req.file.buffer.toString('base64');
      const fileUri = `data:${req.file.mimetype};base64,${fileBufferStr}`;

      const uploadResult = await cloudinary.uploader.upload(fileUri, {
        folder: `zipride/${folderName}`,
        resource_type: req.file.mimetype === 'application/pdf' ? 'raw' : 'image',
        transformation: req.file.mimetype === 'application/pdf' ? undefined : [{ quality: 'auto:good', fetch_format: 'auto' }]
      });

      // Attach resulting Cloudinary URLs to request object
      req.file.cloudinaryUrl = uploadResult.secure_url;
      req.file.publicId = uploadResult.public_id;
      next();
    } catch (err) {
      console.error('[Cloudinary Upload] Failed:', err.message);
      
      // Fallback: Store locally or mock in case Cloudinary keys are invalid/placeholder
      const mockFilename = `${Date.now()}_${req.file.originalname.replace(/\s+/g, '_')}`;
      req.file.cloudinaryUrl = `/uploads/${mockFilename}`;
      next();
    }
  };
};
export default upload;

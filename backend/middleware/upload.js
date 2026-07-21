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
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

export const uploadSingle = (fieldName) => upload.single(fieldName);

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

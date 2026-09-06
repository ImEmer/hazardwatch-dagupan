import multer from 'multer';

const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, callback) => callback(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '')}`),
});

export const uploadPhoto = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, callback) => callback(null, /^image\/(jpeg|png|webp)$/.test(file.mimetype)),
});

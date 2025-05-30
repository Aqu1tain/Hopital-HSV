import multer from 'multer';

// Multer for file uploads (in-memory)
export const upload = multer({ storage: multer.memoryStorage() });
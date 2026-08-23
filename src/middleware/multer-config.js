import crypto from 'crypto';
import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { ensureUploadDirectory } from '../uploadStorage';

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
const IMAGE_TYPES = {
  'image/jpeg': {
    extensions: ['.jpg', '.jpeg'],
    storedExtension: '.jpg',
  },
  'image/png': {
    extensions: ['.png'],
    storedExtension: '.png',
  },
  'image/webp': {
    extensions: ['.webp'],
    storedExtension: '.webp',
  },
};

const imageFilter = (req, file, cb) => {
  const imageType = IMAGE_TYPES[file.mimetype];
  const originalExtension = path.extname(file.originalname).toLowerCase();

  if (!imageType || !imageType.extensions.includes(originalExtension)) {
    return cb(new RequestError('Only JPEG, PNG, or WebP image files are allowed', 415), false);
  }

  cb(null, true);
};

const uploadFilename = (req, file, cb) => {
  const storedExtension = IMAGE_TYPES[file.mimetype]?.storedExtension;
  if (!storedExtension) {
    cb(new RequestError('Unsupported image type', 415));
    return;
  }

  cb(null, `${file.fieldname}-${Date.now()}-${crypto.randomUUID()}${storedExtension}`);
};

const uploadDestination = (directoryName) => (req, file, cb) => {
  try {
    cb(null, ensureUploadDirectory(directoryName));
  } catch (error) {
    cb(new RequestError('Unable to prepare image storage', 500, error.message));
  }
};

const storage = multer.diskStorage({
  destination: uploadDestination('logos'),
  filename: uploadFilename,
});

const sendImageStorage = multer.diskStorage({
  destination: uploadDestination('sendImages'),
  filename: uploadFilename,
});

export const logoUpload = multer({
  storage: storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});
export const sendImageUpload = multer({
  storage: sendImageStorage,
  fileFilter: imageFilter,
  limits: {
    fileSize: MAX_IMAGE_SIZE,
    files: 1,
  },
});

const singleImageUpload = (upload, fieldName) => (req, res, next) => {
  upload.single(fieldName)(req, res, (error) => {
    if (!error) {
      next();
      return;
    }

    if (error instanceof multer.MulterError && error.code === 'LIMIT_FILE_SIZE') {
      next(new RequestError('Image must be 5 MB or smaller', 413));
      return;
    }

    if (error instanceof multer.MulterError) {
      next(new RequestError('Invalid image upload', 400, error.message));
      return;
    }

    next(error);
  });
};

export const uploadLogo = singleImageUpload(logoUpload, 'logo');
export const uploadSendImage = singleImageUpload(sendImageUpload, 'sendImage');

const hasExpectedSignature = (mimeType, header) => {
  if (mimeType === 'image/jpeg') {
    return header.length >= 3
      && header[0] === 0xff
      && header[1] === 0xd8
      && header[2] === 0xff;
  }

  if (mimeType === 'image/png') {
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    return header.length >= pngSignature.length
      && header.subarray(0, pngSignature.length).equals(pngSignature);
  }

  if (mimeType === 'image/webp') {
    return header.length >= 12
      && header.toString('ascii', 0, 4) === 'RIFF'
      && header.toString('ascii', 8, 12) === 'WEBP';
  }

  return false;
};

const removeUploadedFile = async (filePath) => {
  if (!filePath) return;

  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.error('Unable to remove rejected upload:', error.message);
    }
  }
};

export const validateUploadedImage = async (req, res, next) => {
  if (!req.file) {
    next();
    return;
  }

  let fileHandle;
  try {
    fileHandle = await fs.promises.open(req.file.path, 'r');
    const header = Buffer.alloc(12);
    const { bytesRead } = await fileHandle.read(header, 0, header.length, 0);

    if (!hasExpectedSignature(req.file.mimetype, header.subarray(0, bytesRead))) {
      await fileHandle.close();
      fileHandle = null;
      await removeUploadedFile(req.file.path);
      next(new RequestError('Uploaded file content is not a valid image', 415));
      return;
    }

    await fileHandle.close();
    next();
  } catch (error) {
    if (fileHandle) await fileHandle.close().catch(() => {});
    await removeUploadedFile(req.file.path);
    next(error instanceof RequestError
      ? error
      : new RequestError('Unable to validate uploaded image', 400, error.message));
  }
};

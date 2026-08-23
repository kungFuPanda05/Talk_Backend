import fs from 'fs';
import path from 'path';

export const uploadRoot = process.env.UPLOAD_ROOT
    ? path.resolve(process.env.UPLOAD_ROOT)
    : path.join(__dirname, 'public');

export const ensureUploadDirectory = (directoryName) => {
    const uploadDirectory = path.join(uploadRoot, directoryName);
    fs.mkdirSync(uploadDirectory, { recursive: true });
    return uploadDirectory;
};

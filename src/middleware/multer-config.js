// multer-config.js
import multer from 'multer';
import path from 'path';

// Filter to check if the uploaded file is an image
const imageFilter = (req, file, cb) => {
  if (!file.originalname.match(/\.(jpg|jpeg|png)$/i)) {
    return cb(new Error('Only image files are allowed!'), false);
  }
  cb(null, true);
};

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const logosPath = path.join(__dirname, '..', 'public', 'logos');
    console.log("Logospath: ", logosPath);
    cb(null, logosPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const logoUpload = multer({ storage: storage, fileFilter: imageFilter });

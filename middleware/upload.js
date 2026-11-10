const multer = require('multer');
const fs = require('fs');
const path = require('path');

const uploadDirectory = path.join(__dirname, '..', 'uploads');
fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage: storage });

module.exports = upload;

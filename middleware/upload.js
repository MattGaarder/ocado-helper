const multer = require('multer');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, Date.now() + '_' + file.originalname);
    }
});
const upload = multer({ storage: storage });

module.exports = upload;
// Define the storage configuration for uploaded files using multer.diskStorage(). This configuration determines where the uploaded files will be stored on the server. It takes an object with two functions: destination and filename.
// The destination function specifies the directory where the uploaded files will be saved. In this example, we set it to 'uploads/', which means the files will be stored in a folder named "uploads" in the root directory of your project. You can customize the destination path based on your requirements.
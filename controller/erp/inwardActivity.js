const multer = require('multer');
const path = require('path');
const { servError, success, falied, dataFound, noData } = require('../res');
const deleteAllFilesInDirectory = require('./fileHandling/deleteMiddleware');
const getImagesMiddleware = require('./fileHandling/getImagesMiddleware')


const storage = multer.diskStorage({
    destination: path.join(__dirname, 'fileHandling', 'uploads', 'inwardActivity'),
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

const upload = multer({ storage: storage });


const getInwardActivity = async (req, res) => {

    try {
        
        const machineOuternLocation =  path.join(__dirname, 'fileHandling', 'uploads', 'inwardActivity');
        const imageLinks = await getImagesMiddleware(machineOuternLocation, 'imageURL/inwardActivity/');

        if (Array.isArray(imageLinks)) {
            dataFound(res, imageLinks)
        } else {
            noData(res);
        }
    } catch (e) {
        servError(e, res)
    }
}

const InwardActivityControll = async (req, res) => {
    const uploadsDir = path.join(__dirname, 'fileHandling', 'uploads', 'inwardActivity');
    
    try {
        await deleteAllFilesInDirectory(uploadsDir);

        upload.single('image')(req, res, (err) => {
            if (err) {
                return servError(err, res);
            }
            if (!req.file) {
                return falied(res, 'No file selected');
            }

            success(res, 'Image Uploaded');
        });

    } catch (e) {
        servError(e, res);
    }
}

module.exports = {
    getInwardActivity,
    InwardActivityControll,
};

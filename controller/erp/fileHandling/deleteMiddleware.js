const fs = require('fs');
const path = require('path');


const isImageFile = (file) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'];
    const fileExtension = path.extname(file).toLowerCase();
    return imageExtensions.includes(fileExtension);
};


const deleteAllFilesInDirectory = (directoryPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, (err, files) => {
            if (err) return reject(err);

            const deletePromises = files
                .filter(isImageFile)
                .map(file => {
                    return new Promise((res, rej) => {
                        fs.unlink(path.join(directoryPath, file), err => {
                            if (err) return rej(err);
                            res();
                        });
                    });
                });

            Promise.all(deletePromises)
                .then(() => resolve())
                .catch(err => reject(err));
        });
    });
};

module.exports = deleteAllFilesInDirectory;

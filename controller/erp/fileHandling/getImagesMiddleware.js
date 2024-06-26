const fs = require('fs');
const path = require('path');
require('dotenv').config();
const domain = process.env.DOMAIN; 

const isImageFile = (file) => {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff'];
    const fileExtension = path.extname(file).toLowerCase();
    return imageExtensions.includes(fileExtension);
};

const getFileStats = (directoryPath, file) => {
    return new Promise((resolve, reject) => {
        fs.stat(path.join(directoryPath, file), (err, stats) => {
            if (err) return reject(err);

            resolve({
                fileName: file,
                modifiedTime: stats.mtime,
                // allInformations: stats,
                url: `${domain}imageURL/machineOutern/${file}`
            });
        });
    });
};

const getAllImagesFromDirectory = (directoryPath) => {
    return new Promise((resolve, reject) => {
        fs.readdir(directoryPath, async (err, files) => {
            if (err) return reject(err);

            const imageFiles = files.filter(isImageFile);
            try {
                const fileStats = await Promise.all(imageFiles.map(file => getFileStats(directoryPath, file)));
                resolve(fileStats);
            } catch (error) {
                reject(error);
            }
        });
    });
};

const getImagesMiddleware = async (directoryPath) => {
    try {
        const images = await getAllImagesFromDirectory(directoryPath);
        return images; 
    } catch (err) {
        console.log(err);
        return [];
    }
};

module.exports = getImagesMiddleware;

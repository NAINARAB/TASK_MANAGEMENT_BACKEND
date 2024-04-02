const sql = require("mssql");
const { dataFound, noData, servError, invalidInput } = require("./res")
const multer = require('multer');
const fs = require('fs');
const path = require('path');

let mime;

import('mime').then((module) => {
    mime = module.default;
}).catch(error => console.error('Failed to load the mime module', error));


const uploadDir = path.join(__dirname, '../uploads');

const ensureUploadDirExists = (dir) => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
};

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        ensureUploadDirExists(uploadDir);
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const fileName = new Date().toISOString().replace(/:/g, '-') + "_" + file.originalname;
        cb(null, fileName);
    },
});

const upload = multer({ storage: storage }).single('files');

const multerMiddleware = (req, res) => {
    return new Promise((resolve, reject) => {
        upload(req, res, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve();
            }
        });
    });
};



const ChatController = () => {

    const getTopics = async (req, res) => {
        try {
            const query = `
                SELECT 
                    d.Id,
                    d.Topic,
                    d.Description,
                    d.CreatedAt,
                    d.Project_Id,
    
                    (SELECT COUNT(Id) AS UserCount FROM tbl_Discussion_Group_Members WHERE Topic_Id = d.Id) AS InvolvedUsersCount,
                    (SELECT COUNT(Id) AS MessageCount FROM tbl_Discussion_Messages WHERE Topic_Id = d.Id) AS TotalMessages,
                    (SELECT COUNT(Id) AS DocumentCount FROM tbl_Discussion_Files WHERE Topic_Id = d.Id) AS DocumentsShared,
    
                    ISNULL(
                        (
                        SELECT 
                            dgm.User_Id AS UserId,
                            u.Name AS Name
                        FROM 
                            tbl_Discussion_Group_Members AS dgm
                            LEFT JOIN 
                            tbl_Users AS u ON dgm.User_Id = u.UserId
                        WHERE 
                            dgm.Topic_Id = d.Id 
                            FOR JSON PATH
                       ), 
                        '[]'
                       ) AS InvolvedUsers
                                          
                FROM 
                    tbl_Discussion_Topics AS d
                WHERE 
                    d.IsActive = 1
                ORDER BY 
                    d.CreatedAt DESC`;
            const request = new sql.Request();
            const result = await request.query(query);

            if (result.recordset.length > 0) {
                const parseJson = [];
                for (let obj of result.recordset) {
                    obj.InvolvedUsers = JSON.parse(obj?.InvolvedUsers);
                    parseJson.push(obj);
                }
                return dataFound(res, parseJson);
            } else {
                return noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    };

    const createTopics = async (req, res) => {
        try {
            const { Topic, Description } = req.body;

            if (!Topic || !Description) {
                return res.status(400).json({ success: false, message: 'Topic and description are required' });
            }

            const insertQuery = `
                INSERT INTO tbl_Discussion_Topics (Topic, Description, CreatedAt)
                VALUES (@topic, @description, GETDATE());
            `;

            const request = new sql.Request();
            request.input('topic', Topic);
            request.input('description', Description);

            const result = await request.query(insertQuery);

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                return res.status(201).json({ success: true, message: 'New discussion topic added successfully' });
            } else {
                return res.status(500).json({ success: false, message: 'Failed to create discussion topic' });
            }
        } catch (error) {
            console.error('Error creating discussion topic:', error);
            return res.status(500).json({ success: false, message: 'An error occurred while creating the discussion topic' });
        }
    };

    const updateTopics = async (req, res) => {
        try {
            const { Id, Topic, Description } = req.body;

            if (!Id || !Topic || !Description) {
                return invalidInput(res, 'Topic and Description are required');
            }

            const updateQuery = `
                UPDATE tbl_Discussion_Topics 
                SET Topic = @topic, Description = @description
                WHERE Id = @Id;
            `;

            const request = new sql.Request();
            request.input('topic', Topic);
            request.input('description', Description);
            request.input('Id', Id);

            const result = await request.query(updateQuery);

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                return dataFound(res, [], 'Changes Saved');
            } else {
                return failed(res, 'Failed To Save');
            }
        } catch (e) {
            return servError(e, res);
        }
    };

    const deleteTopics = async (req, res) => {
        try {
            const { Id } = req.body;

            if (!Id) {
                return invalidInput(res, 'Id required');
            }

            const deleteQuery = `
                UPDATE tbl_Discussion_Topics 
                SET IsActive = 0
                WHERE Id = @Id;
            `;

            const request = new sql.Request();
            request.input('Id', Id);

            const result = await request.query(deleteQuery);

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                return dataFound(res, [], 'Topic Deleted');
            } else {
                return failed(res, 'Failed To Delete');
            }
        } catch (e) {
            return servError(e, res);
        }
    }

    const postTeamMembers = async (req, res) => {
        const { Teams, Topic_Id } = req.body;

        if (!Array.isArray(Teams)) {
            return invalidInput(res, 'Teams Array is required');
        }

        if (!Topic_Id) {
            return invalidInput(res, 'Topic_Id is required');
        }

        try {
            const deleteQuery = `DELETE FROM tbl_Discussion_Group_Members WHERE Topic_Id = @topicId`;
            const deleteRequest = new sql.Request();
            deleteRequest.input('topicId', Topic_Id);
            await deleteRequest.query(deleteQuery);

            for (let user of Teams) {
                const insertQuery = `INSERT INTO tbl_Discussion_Group_Members (Topic_Id, User_Id) VALUES (@topicId, @userId)`;
                const insertRequest = new sql.Request();
                insertRequest.input('topicId', Topic_Id);
                insertRequest.input('userId', user.UserId);
                await insertRequest.query(insertQuery);
            }

            return dataFound(res, [], 'Changes Saved');
        } catch (e) {
            servError(e, res);
        }
    };

    const getTopicMessages = async (req, res) => {
        const { Topic_Id } = req.query;

        if (!Topic_Id) {
            return invalidInput(res, 'Topic_Id is required');
        }

        try {
            const getQuery = `
            SELECT 
              dm.*,
              u.Name
            FROM tbl_Discussion_Messages  AS dm
              LEFT JOIN tbl_Users AS u
              ON dm.User_Id = u.UserId
            WHERE Topic_Id = '${Topic_Id}'`

            const request = new sql.Request();
            const result = await request.query(getQuery);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postMessages = async (req, res) => {
        const { Topic_Id, User_Id, Message } = req.body;

        if (!Number(Topic_Id) || !Number(User_Id) || (!String(Message) && Message.length === 0)) {
            return invalidInput(res, 'Topic_Id, User_Id, Message is required');
        }

        try {
            const query = `
            INSERT INTO 
                tbl_Discussion_Messages 
                    (Topic_Id, User_Id, Message, CreatedAt) 
                VALUES 
                    (@topic, @user, @message, @createdAt)`;
            const request = new sql.Request();
            request.input('topic', sql.Int, Topic_Id);
            request.input('user', sql.Int, User_Id);
            request.input('message', sql.NVarChar(sql.MAX), Message);
            request.input('createdAt', sql.DateTime, new Date());

            const result = await request.query(query);

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                dataFound(res, [], 'Message Sent');
            } else {
                failed(res, 'Failed to send message');
            }
        } catch (e) {
            servError(e, res);
        }
    };

    const uploadFile = async (req, res) => {

        await multerMiddleware(req, res);
        const fileName = req?.file?.originalname;
        const filePath = req?.file?.path;
        const filetype = req?.file?.mimetype;
        const filesize = req?.file?.size

        const { Topic_Id, Project_Id, User_Id } = req.body;

        if (!Project_Id || !User_Id) {
            return invalidInput(res, 'Topic_Id, User_Id is required, Project_Id is optional');
        }

        if (!fileName || !filePath) {
            return invalidInput(res, 'Failed to upload File');
        }

        if (fileName.length > 255 || filePath.length > 255) {
            return invalidInput(res, 'File name or path too long');
        }

        try {
            const messageCreateQuery = `
            INSERT INTO 
                tbl_Discussion_Messages 
                    (Topic_Id, User_Id, Message, CreatedAt) 
                VALUES 
                    (@topic, @user, @message, @createdAt)`;
            const addMessageRequest = new sql.Request();
            addMessageRequest.input('topic', Topic_Id);
            addMessageRequest.input('user', User_Id);
            addMessageRequest.input('message', 'SHARED A DOCUMENT');
            addMessageRequest.input('createdAt', new Date());

            await addMessageRequest.query(messageCreateQuery);

            const insertQuery = `
                INSERT INTO tbl_Discussion_Files 
                    (Topic_Id, Project_Id, User_Id, File_Name, FIle_Path, File_Type, File_Size, CreatedAt) 
                VALUES 
                    (@topicId, @projectId, @userId, @filename, @filepath, @filetype, @filesize, @date)`;

            const request = new sql.Request();
            request.input('topicId', Topic_Id)
            request.input('projectId', Project_Id || 0);
            request.input('userId', User_Id);
            request.input('filename', fileName);
            request.input('filepath', filePath);
            request.input('filetype', filetype || 'Unknown File Type');
            request.input('filesize', filesize || 0);
            request.input('date', new Date());
            const result = await request.query(insertQuery);

            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                dataFound(res, [], 'File Uploaded Successfully');
            } else {
                failed(res, 'Failed to upload File');
            }
        } catch (e) {
            console.error(e);
            servError(e, res);
        }
    };

    const documentsListForTopic = async (req, res) => {
        const { Topic_Id } = req.query;

        if (!Number(Topic_Id)) {
            return invalidInput(res, 'Topic_Id is required');
        }

        try {

            const query = `
            SELECT 
            	df.Id AS FileId, 
            	df.File_Name AS FileName,
                df.File_Type AS FileType,
                df.File_Size AS FileSize,
                u.Name AS SharedBY,
                df.User_Id AS SenderId,
                df.CreatedAt AS SendDate
            FROM 
            	tbl_Discussion_Files AS df
            	LEFT JOIN 
            		tbl_Users AS u ON df.User_Id = u.UserId
            WHERE 
            	df.Topic_Id = '${Topic_Id}'
            ORDER BY 
                df.CreatedAt DESC`;

            const request = new sql.Request();
            const result = await request.query(query);

            if (result.recordset.length > 0) {
                return dataFound(res, result.recordset)
            } else {
                return noData(res)
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const downloadDocument = async (req, res) => {
        const { FileId } = req.query;
    
        if (!Number(FileId)) {
            return invalidInput(res, 'FileId is required'); 
        }
    
        try {
            const request = new sql.Request();
            request.input('fileid', FileId);
            const result = await request.query(`
                SELECT 
                    File_Name, FIle_Path 
                FROM 
                    tbl_Discussion_Files 
                WHERE 
                    Id = @fileid`);
    
            if (result.recordset.length > 0) {
                const { File_Name, FIle_Path } = result.recordset[0];
    
                if (fs.existsSync(FIle_Path)) {
                    res.setHeader('Content-Disposition', `attachment; filename="${File_Name}"`);
                    const mimeType = mime.getType(FIle_Path) || 'application/octet-stream';
                    res.setHeader('Content-Type', mimeType);
                    
                    const readStream = fs.createReadStream(FIle_Path);
                    readStream.pipe(res);
                } else {
                    return noData(res, 'File not found');
                }
            } else {
                return noData(res, 'File not found');
            }
        } catch (e) {
            servError(e, res);
        }
    };
    



    return {
        getTopics,
        createTopics,
        updateTopics,
        deleteTopics,
        postTeamMembers,
        getTopicMessages,
        postMessages,
        uploadFile,
        documentsListForTopic,
        downloadDocument
    }
}

module.exports = ChatController()
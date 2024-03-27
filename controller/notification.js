const sql = require('mssql');
const { invalidInput, servError, dataFound, noData, falied } = require('./res');


const NotificationController = () => {

    const getNotificartion = async (req, res) => {
        const { UserId } = req.query;

        if (!Number(UserId)) {
            return invalidInput(res, 'UserId is required');
        }

        try {
            const request = new sql.Request();
            request.input('Emp_Id', UserId);

            const result = await request.execute('Notification_List_By_Emp_Id');

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const postNotificartion = async (req, res) => {
        const { Title, Desc_Note, Emp_Id } = req.body;

        if (!Number(Emp_Id) || !Title || !Desc_Note) {
            return invalidInput(res, 'Title, Desc_Note, Emp_Id is required')
        }

        try {
            const request = new sql.Request();

            request.input('Emp_Id', Emp_Id);
            request.input('Title', Title);
            request.input('Desc_Note', Desc_Note);

            const result = await request.execute('Create_Notification_SP');

            if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
                dataFound(res, [], 'Notification Created')
            } else {
                falied(res, 'Failed to create notification')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getNotificartion,
        postNotificartion,
    }
}


module.exports = NotificationController()
const sql = require("mssql");
const { dataFound, noData, falied, servError, invalidInput, success } = require('./res');

const TaskPrarameter = () => {

    const getTaskParameters = async (req, res) => {
        try {
            const result = await sql.query(`SELECT * FROM tbl_Paramet_Master WHERE Del_Flag = 0`)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const addTaskPrarameter = async (req, res) => {
        const { Paramet_Name, Paramet_Data_Type } = req.body;

        if (!Paramet_Name || !Paramet_Data_Type) {
            return invalidInput(res, 'Paramet_Name, Paramet_Data_Type is required')
        }

        try {
            const checkRequest = new sql.Request();
            checkRequest.input('param', Paramet_Name);
            checkRequest.input('flag', 0)
            const checkExists = await checkRequest.query(`
            SELECT 
                Paramet_Name 
            FROM 
                tbl_Paramet_Master 
            WHERE 
                Paramet_Name = @param
                AND Del_Flag = @flag`
            )
            
            if (checkExists.recordset.length > 0) {
                return falied(res, 'Parameter Already Exists')
            }

            const insertQuery = `INSERT INTO tbl_Paramet_Master (Paramet_Name, Paramet_Data_Type, Del_Flag) VALUES (@name, @type, @del)`

            const request = new sql.Request()
            request.input('name', Paramet_Name);
            request.input('type', Paramet_Data_Type);
            request.input('del', 0)

            const result = await request.query(insertQuery);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Task Parameter Created')
            } else {
                falied(res, 'Failed to Create')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const editTaskPrarameter = async (req, res) => {
        const { Paramet_Id, Paramet_Name, Paramet_Data_Type } = req.body;

        if (isNaN(Paramet_Id) ||!Paramet_Name || !Paramet_Data_Type) {
            return invalidInput(res, 'Paramet_Name, Paramet_Data_Type is required')
        }

        try {
            const insertQuery = `
            UPDATE 
                tbl_Paramet_Master 
            SET 
                Paramet_Name = @name, 
                Paramet_Data_Type = @type 
            WHERE 
                Paramet_Id = @id`

            const request = new sql.Request();
            request.input('id', Paramet_Id)
            request.input('name', Paramet_Name);
            request.input('type', Paramet_Data_Type);

            const result = await request.query(insertQuery);

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved')
            } else {
                falied(res, 'Failed to Save Changes')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const delTaskParameter = async (req, res) => {
        const {Paramet_Id} = req.body;

        if (isNaN(Paramet_Id)) {
            return invalidInput(res, 'Paramet_Id is required')
        }

        try {
            const query = `
            UPDATE 
                tbl_Paramet_Master
            SET
                Del_Flag = 1
            WHERE
                Paramet_Id = @id`

            const request = new sql.Request()
            request.input('id', Paramet_Id)

            const result = await request.query(query)

            if (result.rowsAffected[0] && result.rowsAffected[0] > 0) {
                success(res, 'One Task Paramerter Removed!')
            } else {
                falied(res, 'Failed to Remove Task Paramerter')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getTaskParameters,
        addTaskPrarameter,
        editTaskPrarameter,
        delTaskParameter
    }
}

module.exports = TaskPrarameter();
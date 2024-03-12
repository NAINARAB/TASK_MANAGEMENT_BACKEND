const sql = require("mssql");
const { dataFound, noData, falied, servError, invalidInput } = require('../controller/res');

const workController = () => {

    const getTaskStartTime = async (req, res) => {
        const { Emp_Id } = req.query;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required');
        }

        try {
            const getTimeQuery = `SELECT TOP (1) * FROM tbl_Task_Start_Time WHERE Emp_Id = '${Emp_Id}'`
            const result = await sql.query(getTimeQuery);

            if (result.recordset.length > 0) {
                return dataFound(res, result.recordset)
            } else {
                return falied(res, 'no data');
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postStartTime = async (req, res) => {
        const { Emp_Id, Time, Task_Id, Sub_Task_Id, ForcePost } = req.body;

        if (!Emp_Id || (!Task_Id && !Sub_Task_Id) || !Time) {
            return invalidInput(res, 'Emp_Id, Time, Task_Id, Sub_Task_Id is required')
        }

        try {
            const checkExist = `SELECT * FROM tbl_Task_Start_Time WHERE Emp_Id='${Emp_Id}'`;
            const checkResult = await sql.query(checkExist);

            if (checkResult.recordset.length > 0 && ForcePost === 0) {
                return falied(res, 'Previous Task is Not Completed')
            } else {
                const insertTask = `INSERT INTO tbl_Task_Start_Time (Emp_Id, Time, Task_Id, Sub_Task_Id) VALUES ('${Emp_Id}', '${Time}', '${Task_Id}', '${Sub_Task_Id}')`;
                const result = await sql.query(insertTask);

                if (result.rowsAffected.length > 0) {
                    return dataFound(res, [], 'Task started')
                } else {
                    return falied(res, 'Failed to start Task')
                }
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const deleteTaskTime = async (req, res) => {
        const { Emp_Id, Mode } = req.body;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required')
        }

        try {
            if (Number(Mode) === 1) {
                const Query = `DELETE FROM tbl_Task_Start_Time WHERE Emp_Id = '${Emp_Id}'`;
                const result = await sql.query(Query);

                if (result.rowsAffected.length > 0) {
                    return dataFound(res, [], 'Records Saved')
                } else {
                    return falied(res, 'Failed to Save Task')
                }
            } else {
                return falied(res, 'Failed to Save')
            }


        } catch (e) {
            return servError(e, res)
        }
    }



    return {
        postStartTime,
        getTaskStartTime,
        deleteTaskTime,
    }
}

module.exports = workController()
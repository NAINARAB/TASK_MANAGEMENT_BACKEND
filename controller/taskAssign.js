const sql = require('mssql');
const { dataFound, noData, servError, invalidInput, falied } = require("./res");


const TaskAssignControl = () => {

    const getAssignedEmployeeForTask = async (req, res) => {
        const { Task_Levl_Id } = req.query;

        if (!Task_Levl_Id) {
            return invalidInput(res, 'Task_Levl_Id is required');
        }

        try {
            const getQuery = `
            SELECT 
                td.*,
                (SELECT Name FROM tbl_Users WHERE UserId = td.Assigned_Emp_Id) AS AssignedUser,
                (SELECT Name FROM tbl_Users WHERE UserId = td.Emp_Id) AS EmployeeName,
                (SELECT Task_Name FROM tbl_Task WHERE Task_Id = td.Task_Id) AS TaskNameGet
            FROM 
                tbl_Task_Details AS td
            WHERE 
                td.Task_Levl_Id = @taskid`

            const request = new sql.Request()
            request.input('taskid', Task_Levl_Id)

            const result = await request.query(getQuery)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const getEmployeeTasks = async (req, res) => {
        const { Emp_Id, reqDate } = req.query;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required');
        }

        try {
            // const getQuery = `
            // SELECT 
            //     td.*,
            //     (SELECT Name FROM tbl_Users WHERE UserId = td.Assigned_Emp_Id) AS AssignedUser,
            //     (SELECT Name FROM tbl_Users WHERE UserId = td.Emp_Id) AS EmployeeName,
            //     (SELECT Task_Name FROM tbl_Task WHERE Task_Id = td.Task_Id) AS TaskNameGet,
            //     (SELECT Project_Name FROM tbl_Project_Master WHERE Project_Id = td.Project_Id) AS ProjectGet

            // FROM 
            //     tbl_Task_Details AS td
            // WHERE 
            //     td.Emp_Id = @emp
            // AND 
            //     td.Est_Start_Dt <= @date
            // AND
            //     td.Est_End_Dt >= @date`

            const request = new sql.Request()
            request.input('Emp_Id', Emp_Id)
            request.input('Work_Date', reqDate)

            const result = await request.execute('Task_Search_By_Online_Emp_Id');

            if (result.recordset) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const todayTasks = async (req, res) => {
        const { Emp_Id } = req.query;

        if(!Number(Emp_Id)) {
            return invalidInput(res, 'Emp_Id is required')
        }

        try {
            const query = `
            SELECT 
                td.*,
                (SELECT Name FROM tbl_Users WHERE UserId = td.Assigned_Emp_Id) AS Assigned_Name,

                (SELECT Name FROM tbl_Users WHERE UserId = td.Emp_Id) AS EmployeeName,

                (
                    SELECT 
                        u.Name 
                    FROM 
                        tbl_Users AS u 
                    JOIN
                        tbl_Project_Master p
                        ON u.UserId = p.Project_Head 
                    WHERE 
                        p.Project_Id = td.Project_Id
                ) AS Project_Head_Name,

                (SELECT Task_Name FROM tbl_Task WHERE Task_Id = td.Task_Id) AS Task_Name,
                (SELECT Task_Desc FROM tbl_Task WHERE Task_Id = td.Task_Id) AS Task_Desc,
                (SELECT Project_Name FROM tbl_Project_Master WHERE Project_Id = td.Project_Id) AS Project_Name

            FROM 
                tbl_Task_Details AS td
            WHERE 
                td.Emp_Id = @emp
            AND 
                CONVERT(DATE, td.Est_Start_Dt) <= @date
            AND
                CONVERT(DATE, td.Est_End_Dt) >= @date
            ORDER BY 
                CONVERT(TIME, td.Sch_Time, 108)`

            const request = new sql.Request()
            request.input('emp', Emp_Id)
            request.input('date', new Date().toISOString().split('T')[0])

            const result = await request.query(query)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const assignTaskForEmployee = async (req, res) => {
        const {
            Project_Id, Sch_Id, Task_Levl_Id, Task_Id, Assigned_Emp_Id, Emp_Id, Sch_Period, Sch_Time,
            EN_Time, Est_Start_Dt, Est_End_Dt, Ord_By, Timer_Based
        } = req.body;

        if (!Project_Id || !Sch_Id || !Task_Levl_Id || !Task_Id || !Assigned_Emp_Id || !Emp_Id || !Sch_Period || !Sch_Time
            || !EN_Time || !Est_Start_Dt || !Est_End_Dt) {
            return invalidInput(res, `
            Project_Id, Sch_Id, Task_Levl_Id, Task_Id, Assigned_Emp_Id, Emp_Id, Sch_Period, Sch_Time,
            EN_Time, Est_Start_Dt, Est_End_Dt, Ord_By is required`)
        }

        try {

            const request = new sql.Request()
            request.input('Mode', 1)
            request.input('AN_No', '')
            request.input('Project_Id', Project_Id)
            request.input('Sch_Id', Sch_Id)
            request.input('Task_Levl_Id', Task_Levl_Id)
            request.input('Task_Id', Task_Id)
            request.input('Assigned_Emp_Id', Assigned_Emp_Id)
            request.input('Emp_Id', Emp_Id)
            request.input('Task_Assign_dt', new Date().toISOString().split('T')[0])
            request.input('Sch_Period', Sch_Period)
            request.input('Sch_Time', Sch_Time)
            request.input('EN_Time', EN_Time)
            request.input('Est_Start_Dt', Est_Start_Dt)
            request.input('Est_End_Dt', Est_End_Dt)
            request.input('Ord_By', Number(Ord_By) || 1)
            request.input('Timer_Based', Boolean(Number(Timer_Based)) ? 1 : 0)
            request.input('Invovled_Stat', 1)

            const result = await request.execute('Task_Assign_SP');

            if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
                dataFound(res, [], 'Task assigned')
            } else {
                noData(res, 'Failed to assign task')
            }


        } catch (e) {
            servError(e, res)
        }
    }

    const putAssignTaskForEmployee = async (req, res) => {
        const {
            AN_No, Project_Id, Sch_Id, Task_Levl_Id, Task_Id, Assigned_Emp_Id, Emp_Id, Task_Assign_dt, Sch_Period, Sch_Time,
            EN_Time, Est_Start_Dt, Est_End_Dt, Ord_By, Timer_Based, Invovled_Stat
        } = req.body;

        if (!AN_No || !Project_Id || !Sch_Id || !Task_Levl_Id || !Task_Id || !Assigned_Emp_Id || !Emp_Id || !Sch_Period || !Sch_Time
            || !EN_Time || !Est_Start_Dt || !Est_End_Dt) {
            return invalidInput(res, `
            AN_No, Project_Id, Sch_Id, Task_Levl_Id, Task_Id, Assigned_Emp_Id, Emp_Id, Sch_Period, Sch_Time,
            EN_Time, Est_Start_Dt, Est_End_Dt is required`)
        }

        try {

            const request = new sql.Request()
            request.input('Mode', 2)
            request.input('AN_No', AN_No)
            request.input('Project_Id', Project_Id)
            request.input('Sch_Id', Sch_Id)
            request.input('Task_Levl_Id', Task_Levl_Id)
            request.input('Task_Id', Task_Id)
            request.input('Assigned_Emp_Id', Assigned_Emp_Id)
            request.input('Emp_Id', Emp_Id)
            request.input('Task_Assign_dt', Task_Assign_dt || new Date().toISOString().split('T')[0])
            request.input('Sch_Period', Sch_Period)
            request.input('Sch_Time', Sch_Time)
            request.input('EN_Time', EN_Time)
            request.input('Est_Start_Dt', Est_Start_Dt)
            request.input('Est_End_Dt', Est_End_Dt)
            request.input('Ord_By', Number(Ord_By) || 1)
            request.input('Timer_Based', Boolean(Number(Timer_Based)) ? 1 : 0)
            request.input('Invovled_Stat', Boolean(Number(Invovled_Stat)) ? 1 : 0)

            const result = await request.execute('Task_Assign_SP');

            if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
                dataFound(res, [], 'Changes saved')
            } else {
                noData(res, 'Failed to save changes')
            }


        } catch (e) {
            servError(e, res)
        }
    }

    const getWorkedDetailsForTask = async (req, res) => {
        const { Task_Levl_Id } = req.query;

        if (!Task_Levl_Id) {
            return invalidInput(res, 'Task_Levl_Id is required')
        }

        try {
            const query = `
            SELECT
                wm.*,
                t.Task_Name,
                u.Name AS EmployeeName,
                s.Status AS WorkStatus,

                COALESCE(
                    (SELECT Timer_Based FROM tbl_Task_Details WHERE AN_No = wm.AN_No), 
                    0
                ) AS Timer_Based
                
            FROM 
                tbl_Work_Master AS wm
            LEFT JOIN 
                tbl_Task AS t ON t.Task_Id = wm.Task_Id
            LEFT JOIN
                tbl_Users AS u ON u.UserId = wm.Emp_Id
            LEFT JOIN
                tbl_Status AS s ON s.Status_Id = wm.Work_Status
                
            WHERE 
				wm.Task_Levl_Id = ${Task_Levl_Id}
                
            ORDER BY 
                wm.Start_Time`

            const result = await sql.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getAssignedEmployeeForTask,
        getEmployeeTasks,
        assignTaskForEmployee,
        putAssignTaskForEmployee,
        todayTasks,
        getWorkedDetailsForTask,
    }
}



module.exports = TaskAssignControl()
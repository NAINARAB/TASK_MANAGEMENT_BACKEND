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
        const { Emp_Id, Time, Task_Id, ForcePost } = req.body;

        if (!Emp_Id || !Task_Id || !Time) {
            return invalidInput(res, 'Emp_Id, Time, Task_Id is required')
        }

        try {
            const checkExist = `SELECT * FROM tbl_Task_Start_Time WHERE Emp_Id='${Emp_Id}'`;
            const checkResult = await sql.query(checkExist);

            if (checkResult.recordset.length > 0 && ForcePost === 0) {
                return falied(res, 'Previous Task is Not Completed')
            } else {
                const insertTask = `
                INSERT INTO 
                    tbl_Task_Start_Time 
                    (Emp_Id, Time, Task_Id) 
                VALUES 
                    (@emp, @time, @taskid)`;
                const request = new sql.Request();
                request.input('emp', Emp_Id)
                request.input('time', Time)
                request.input('taskid', Task_Id)
                const result = await request.query(insertTask);

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
                    return dataFound(res, [], 'Task cancelled')
                } else {
                    return falied(res, 'Failed to cancel')
                }
            } else {
                return falied(res, 'Failed to Save')
            }


        } catch (e) {
            return servError(e, res)
        }
    }


    const getEmployeeWorkedTask = async (req, res) => {
        const { Emp_Id, reqDate } = req.query;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required')
        }

        try {
            // const query = `
            // SELECT
            // 	wm.*,
            // 	p.Project_Name,
            // 	t.Task_Name,
            // 	u.Name AS EmployeeName,
            // 	s.Status AS WorkStatus,
			// 	td.Timer_Based
            // FROM 
            // 	tbl_Work_Master AS wm
            // LEFT JOIN
            // 	tbl_Project_Master AS p
            // 	ON p.Project_Id = wm.Project_Id
            // LEFT JOIN 
            // 	tbl_Task AS t
            // 	ON t.Task_Id = wm.Task_Id
            // LEFT JOIN
            // 	tbl_Users AS u
            // 	ON u.UserId = wm.Emp_Id
            // LEFT JOIN
            // 	tbl_Status AS s
            // 	ON s.Status_Id = wm.Work_Status
			// LEFT JOIN
			// 	tbl_Task_Details AS td
			// 	ON td.Task_Levl_Id = wm.Task_Levl_Id
            // WHERE 
            // 	wm.Emp_Id = '${Emp_Id}'
            // 	AND
            // 	CONVERT(DATE, wm.Work_DT) = CONVERT(DATE, '${reqDate || new Date()}')
            //     AND
			// 	wm.AN_No = td.AN_No
            // ORDER BY 
			// 	wm.Start_Time`;
            
            // const query = `
            // SELECT
            // 	wm.*,
            // 	p.Project_Name,
            // 	t.Task_Name,
            // 	u.Name AS EmployeeName,
            // 	s.Status AS WorkStatus,

			// 	(
			// 		SELECT 
			// 			ISNULL(
			// 				Timer_Based,
			// 				0
			// 			)
			// 		FROM 
			// 			tbl_Task_Details
			// 		WHERE
			// 			AN_No = wm.AN_No
			// 	) AS Timer_Based

            // FROM 
            // 	tbl_Work_Master AS wm
            // LEFT JOIN
            // 	tbl_Project_Master AS p
            // 	ON p.Project_Id = wm.Project_Id
            // LEFT JOIN 
            // 	tbl_Task AS t
            // 	ON t.Task_Id = wm.Task_Id
            // LEFT JOIN
            // 	tbl_Users AS u
            // 	ON u.UserId = wm.Emp_Id
            // LEFT JOIN
            // 	tbl_Status AS s
            // 	ON s.Status_Id = wm.Work_Status
			// LEFT JOIN
			// 	tbl_Task_Details AS td
			// 	ON td.Task_Levl_Id = wm.Task_Levl_Id
            // WHERE 
            // 	wm.Emp_Id = '${Emp_Id}'
            // 	AND
            // 	CONVERT(DATE, wm.Work_DT) = CONVERT(DATE, '${reqDate ? reqDate : new Date()}')
            //     AND
			// 	(wm.AN_No = td.AN_No OR wm.AN_No = NULL)
            // ORDER BY 
			// 	wm.Start_Time`;

            const query = `
            SELECT
                wm.*,
                p.Project_Name,
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
                tbl_Project_Master AS p ON p.Project_Id = wm.Project_Id
            LEFT JOIN 
                tbl_Task AS t ON t.Task_Id = wm.Task_Id
            LEFT JOIN
                tbl_Users AS u ON u.UserId = wm.Emp_Id
            LEFT JOIN
                tbl_Status AS s ON s.Status_Id = wm.Work_Status
            LEFT JOIN
                tbl_Task_Details AS td ON td.Task_Levl_Id = wm.Task_Levl_Id
                
            WHERE 
                wm.Emp_Id = '${Emp_Id}'
                AND CONVERT(DATE, wm.Work_DT) = CONVERT(DATE, '${reqDate ? reqDate : new Date()}')
                AND (wm.AN_No = td.AN_No OR wm.AN_No = 0)
                
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

    const postWorkedTask = async (req, res) => {
        const { Mode, Work_Id, Project_Id, Sch_Id, Task_Levl_Id, Task_Id, AN_No, Emp_Id, Work_Dt, Work_Done, Start_Time, End_Time, Work_Status } = req.body;
        
        if (!Project_Id || !Sch_Id || !Task_Levl_Id || !Task_Id || !Emp_Id || !Work_Done || !Start_Time || !End_Time || !Work_Status ) {
            return invalidInput(res, 'Project_Id, Sch_Id, Task_Levl_Id, Task_Id, Emp_Id, Work_Done, Start_Time, End_Time, Work_Status is required')
        }

        if (Number(Mode) === 2 && Number(Work_Id) === 0) {
            return invalidInput(res, 'Work_Id is required')
        }

        try {
            const request = new sql.Request()
            request.input('Mode', Mode || 1)
            request.input('Work_Id', Work_Id)
            request.input('Project_Id', Project_Id)
            request.input('Sch_Id', Sch_Id)
            request.input('Task_Levl_Id', Task_Levl_Id)
            request.input('Task_Id', Task_Id)
            request.input('AN_No', AN_No)
            request.input('Emp_Id', Emp_Id)
            request.input('Work_Dt', Work_Dt || new Date())
            request.input('Work_Done', Work_Done)
            request.input('Start_Time', Start_Time)
            request.input('End_Time', End_Time)
            request.input('Work_Status', Work_Status)
            request.input('Entry_By', Emp_Id)
            request.input('Entry_Date', new Date());

            const result = await request.execute('Work_SP')
            if (result.rowsAffected && result.rowsAffected[0] > 0) {
                const Query = `DELETE FROM tbl_Task_Start_Time WHERE Emp_Id = '${Emp_Id}'`;
                await sql.query(Query);
                dataFound(res, [], 'Work Saved');
            } else {
                falied(res, 'Failed to save work')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getAllWorkedDataOfEmp = async (req, res) => {
        const { Emp_Id } = req.query;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required')
        }

        try {
            const query = `
            SELECT
            	wm.*,
            	p.Project_Name,
            	t.Task_Name,
            	u.Name AS EmployeeName,
            	s.Status AS WorkStatus,
				td.Timer_Based
            FROM 
            	tbl_Work_Master AS wm
            LEFT JOIN
            	tbl_Project_Master AS p
            	ON p.Project_Id = wm.Project_Id
            LEFT JOIN 
            	tbl_Task AS t
            	ON t.Task_Id = wm.Task_Id
            LEFT JOIN
            	tbl_Users AS u
            	ON u.UserId = wm.Emp_Id
            LEFT JOIN
            	tbl_Status AS s
            	ON s.Status_Id = wm.Work_Status
			LEFT JOIN
				tbl_Task_Details AS td
				ON td.Task_Levl_Id = wm.Task_Levl_Id
            WHERE 
            	wm.Emp_Id = '${Emp_Id}'
            	AND
				wm.AN_No = td.AN_No
            ORDER BY 
				wm.Start_Time`;
            
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

    const getAllWorkedData = async (req, res) => {
        try {
            const query = `
            SELECT
                wm.*,
                p.Project_Name,
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
                tbl_Project_Master AS p ON p.Project_Id = wm.Project_Id
            LEFT JOIN 
                tbl_Task AS t ON t.Task_Id = wm.Task_Id
            LEFT JOIN
                tbl_Users AS u ON u.UserId = wm.Emp_Id
            LEFT JOIN
                tbl_Status AS s ON s.Status_Id = wm.Work_Status
            LEFT JOIN
                tbl_Task_Details AS td ON td.Task_Levl_Id = wm.Task_Levl_Id
                
            WHERE 
                (wm.AN_No = td.AN_No OR wm.AN_No = 0)
                
            ORDER BY 
                wm.Start_Time`;
            
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
        postStartTime,
        getTaskStartTime,
        deleteTaskTime,
        getEmployeeWorkedTask,
        postWorkedTask,
        getAllWorkedDataOfEmp,
        getAllWorkedData
    }
}

module.exports = workController()
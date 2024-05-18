const sql = require("mssql");
const { dataFound, noData, falied, servError, invalidInput, isValidDate } = require('../controller/res');

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

        if (isNaN(Emp_Id)) {
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
                ) AS Timer_Based,

                COALESCE(
                    (
                        SELECT
                            tp.*,
                            wpm.Current_Value,
                            pm.Paramet_Name,
                            pm.Paramet_Data_Type
                        FROM 
                            tbl_Task_Paramet_DT AS tp
                                
                            LEFT JOIN tbl_Paramet_Master AS pm 
                            ON pm.Paramet_Id = tp.Param_Id

                            LEFT JOIN tbl_Work_Paramet_DT AS wpm 
                            ON wpm.Work_Id = wm.Work_Id
                        WHERE
                            tp.Task_Id = wm.Task_Id
                            AND
                            tp.Param_Id = wpm.Param_Id
                        FOR JSON PATH
                    ), '[]'
                ) AS Param_Dts                
                
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
                AND CONVERT(DATE, wm.Work_DT) = CONVERT(DATE, '${isValidDate(reqDate) ? reqDate : new Date()}')
                AND (wm.AN_No = td.AN_No OR wm.AN_No = 0)
                
            ORDER BY 
                wm.Start_Time`
            const result = await sql.query(query);

            if (result.recordset.length > 0) {
                result.recordset.map(o => {
                    o.Param_Dts = JSON.parse(o?.Param_Dts)
                })
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const postWorkedTask = async (req, res) => {
        const { Mode, Work_Id, Project_Id, Sch_Id, Task_Levl_Id, Task_Id, AN_No, Emp_Id, Work_Dt, Work_Done, Start_Time, End_Time, Work_Status, Det_string } = req.body;

        if (!Project_Id || !Sch_Id || !Task_Levl_Id || !Task_Id || !Emp_Id || !Work_Done || !Start_Time || !End_Time || !Work_Status) {
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
            request.input('Det_string', Det_string);

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
        const { Emp_Id, Start, End, Task_Id } = req.query;

        if (!Emp_Id) {
            return invalidInput(res, 'Emp_Id is required')
        }

        try {
            let query = `
                SELECT
                    wm.*,
                    p.Project_Name,
                    t.Task_Name,
                    u.Name AS EmployeeName,
                    s.Status AS WorkStatus,
                    COALESCE(
                        (SELECT Timer_Based FROM tbl_Task_Details WHERE AN_No = wm.AN_No), 
                        0
                    ) AS Timer_Based,

					COALESCE((
						SELECT 
							wp.Current_Value,
							wp.Default_Value,
							wp.Param_Id,
							pm.Paramet_Name,
                            pm.Paramet_Data_Type
						FROM
							tbl_Work_Paramet_DT as wp
							LEFT JOIN tbl_Paramet_Master AS pm
							ON pm.Paramet_Id = wp.Param_Id
						WHERE 
							Work_Id = wm.Work_Id
						FOR JSON PATH
					), '[]') AS Parameter_Details

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
                    AND
                    wm.Emp_Id = '${Emp_Id}'`;

            if (Task_Id) {
                query += `
                AND
                wm.Task_Id = '${Task_Id}'
                `
            }

            if (Start && End) {
                query += `
                AND
                CONVERT(DATE, wm.Work_Dt) >= CONVERT(DATE, '${Start}')
                AND
                CONVERT(DATE, wm.Work_Dt) <= CONVERT(DATE, '${End}')`
            }

            query += `ORDER BY CONVERT(DATE, wm.Work_Dt) DESC, CONVERT(TIME, wm.Start_Time)`

            const result = await sql.query(query);

            if (result.recordset.length > 0) {
                const parsedResponse = result.recordset.map(o => ({
                    ...o,
                    Parameter_Details: JSON.parse(o?.Parameter_Details)
                }))
                dataFound(res, parsedResponse)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getAllWorkedData = async (req, res) => {
        const { Emp_Id, Project_Id, Task_Id, from, to } = req.query;
        try {
            let query = `
                SELECT
                    wm.*,
                    p.Project_Name,
                    t.Task_Name,
                    u.Name AS EmployeeName,
                    s.Status AS WorkStatus,

                    COALESCE(
                        (SELECT Timer_Based FROM tbl_Task_Details WHERE AN_No = wm.AN_No), 
                        0
                    ) AS Timer_Based,

					COALESCE((
						SELECT
							wpm.*,
							tpm.Paramet_Name,
							tpm.Paramet_Data_Type
						FROM
							tbl_Work_Paramet_DT AS wpm
							LEFT JOIN tbl_Paramet_Master AS tpm
							ON tpm.Paramet_Id = wpm.Param_Id 
						WHERE
							wpm.Work_Id = wm.Work_Id
						FOR JSON PATH
					), '[]') AS Work_Param

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
                    (wm.AN_No = td.AN_No OR wm.AN_No = 0)`;

            if (Emp_Id) {
                query += ` 
                AND wm.Emp_Id = '${Emp_Id}'`;
            }
            if (Boolean(Number(Project_Id))) {
                query += ` 
                AND wm.Project_Id = '${Project_Id}'`;
            }
            if (Boolean(Number(Task_Id))) {
                query += ` 
                AND wm.Task_Id = '${Task_Id}'`;
            }
            if (from && to) {
                query += ` 
                AND CONVERT(DATE, Work_Dt) >= CONVERT(DATE, '${from}')`;
                query += ` 
                AND CONVERT(DATE, Work_Dt) <= CONVERT(DATE, '${to}')`;
            }

            query += ` ORDER BY wm.Start_Time`;

            const result = await sql.query(query);

            if (result.recordset.length > 0) {
                const parsed = result.recordset.map(o => ({
                    ...o,
                    Work_Param: JSON.parse(o?.Work_Param)
                }))
                dataFound(res, parsed);
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    };

    const getAllGroupedWorkedData = async (req, res) => {
        const { Emp_Id, Project_Id, Task_Id, from, to } = req.query;
        try {

            let query = `
            SELECT 
            	tty.Task_Type_Id,
            	tty.Task_Type,
                    
            	COALESCE(
            		(
            			SELECT
            				wm.*,
                            p.Project_Name,
                            t.Task_Name,
                            u.Name AS EmployeeName,
                            s.Status AS WorkStatus,
                            COALESCE(
            					(
            						SELECT 
            							Timer_Based 
            						FROM 
            							tbl_Task_Details 
            						WHERE 
            							AN_No = wm.AN_No
            					), 0
            				) AS Timer_Based,

                            COALESCE((
                                SELECT
                                    wpm.*,
                                    tpm.Paramet_Name,
                                    tpm.Paramet_Data_Type
                                FROM
                                    tbl_Work_Paramet_DT AS wpm
                                    LEFT JOIN tbl_Paramet_Master AS tpm
                                    ON tpm.Paramet_Id = wpm.Param_Id 
                                WHERE
                                    wpm.Work_Id = wm.Work_Id
                                FOR JSON PATH
                            ), '[]') AS Work_Param
                        
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
            			AND
            				t.Task_Group_Id = tty.Task_Type_Id
            `

            if (Emp_Id) {
                query += ` 
                AND wm.Emp_Id = '${Emp_Id}'`;
            }
            if (Boolean(Number(Project_Id))) {
                query += ` 
                AND wm.Project_Id = '${Project_Id}'`;
            }
            if (Boolean(Number(Task_Id))) {
                query += ` 
                AND wm.Task_Id = '${Task_Id}'`;
            }
            if (from && to) {
                query += ` 
                AND 
                    CONVERT(DATE, Work_Dt) >= CONVERT(DATE, '${from}')
                AND 
                    CONVERT(DATE, Work_Dt) <= CONVERT(DATE, '${to}')`;
            }

            query += `
                        ORDER BY wm.Start_Time
                        FOR JSON PATH
            		), '[]'
            	) AS TASK_GROUP
            
            FROM 
            	tbl_Task_Type AS tty`;
            const result = await sql.query(query);

            if (result.recordset.length > 0) {

                const parsedResponse = result.recordset.map(o => ({
                    ...o,
                    TASK_GROUP: JSON.parse(o?.TASK_GROUP)
                }))

                const levelTwoParsed = parsedResponse.map(o => ({
                    ...o,
                    TASK_GROUP: o?.TASK_GROUP?.map(oo => ({
                        ...oo,
                        Work_Param: JSON.parse(oo?.Work_Param)
                    }))
                }))

                dataFound(res, levelTwoParsed);
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    };

    const taskWorkDetailsPieChart = async (req, res) => {
        const { Emp_Id, reqDate } = req.query;

        try {
            const query = `
            SELECT 
                CONVERT(DATE, wm.Work_Dt) AS Work_Date,
                t.Task_Name,
                emp.Name AS Employee_Name,
                SUM(DATEDIFF(MINUTE, wm.Start_Time, wm.End_Time)) AS Total_Worked_Minutes
            FROM
                tbl_Work_Master AS wm
            LEFT JOIN
                tbl_Task AS t ON t.Task_Id = wm.Task_Id
            LEFT JOIN
                tbl_Users AS emp ON emp.UserId = wm.Emp_Id
            WHERE
                t.Task_Id != 2
            `;

            if (Number(Emp_Id)) {
                query += `
                AND wm.Emp_Id = '${Emp_Id}'
                `
            }
            if (reqDate) {
                query += `
                AND wm.Work_Dt = '${reqDate}'
                `
            }

            query += `
            GROUP BY
                CONVERT(DATE, wm.Work_Dt),
                t.Task_Name,
                emp.Name
            ORDER BY
                Work_Date
            `

            const request = new sql.Request();
            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const taskWorkDetailsBarChart = async (req, res) => { 
        const { Emp_Id, Task_Id, From, To } = req.query;

        if (isNaN(Task_Id) || !isValidDate(From) || !isValidDate(To)) {
            return invalidInput(res, 'Task_Id, From, To is required, Emp_Id is optional')
        }

        try {
            let query = `
            SELECT 
                CONVERT(DATE, wm.Work_Dt) AS Work_Dt,
                t.Task_Id,
                t.Task_Name,
                wm.Emp_Id,
                emp.Name AS Employee_Name,
                wm.Start_Time,
                wm.End_Time,
                DATEDIFF(MINUTE, wm.Start_Time, wm.End_Time) AS Worked_Minutes 
            FROM
                tbl_Work_Master AS wm
                LEFT JOIN tbl_Task AS t 
                ON t.Task_Id = wm.Task_Id
                LEFT JOIN tbl_Users AS emp 
                ON emp.UserId = wm.Emp_Id
            WHERE
                t.Task_Id = '${Task_Id}'
                AND	CONVERT(DATE, wm.Work_Dt) >= CONVERT(DATE, '${From}')
                AND	CONVERT(DATE, wm.Work_Dt) <= CONVERT(DATE, '${To}')
            `;

            if (Number(Emp_Id)) {
                query +=`AND wm.Emp_Id = '${Emp_Id}'`
            }
            query += `ORDER BY CONVERT(DATE, wm.Work_Dt)`;

            const request = new sql.Request()
            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const EmployeeTaskDropDown = async (req, res) => {
        const {Emp_Id} = req.query;

        if (isNaN(Emp_Id)) {
            return invalidInput(res, 'Emp_Id is Required');
        }

        try {
            const query = `
            SELECT 
            	DISTINCT(wm.Task_Id),
            	COALESCE(t.Task_Name, 'unknown task') AS Task_Name
            FROM
            	tbl_Task_Details AS wm
            	LEFT JOIN tbl_Task AS t
            	ON t.Task_Id = wm.Task_Id
            WHERE
            	wm.Emp_Id = @emp`;
            
            const request = new sql.Request();
            request.input('emp', Emp_Id);

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }


    return {
        postStartTime,
        getTaskStartTime,
        deleteTaskTime,
        getEmployeeWorkedTask,
        postWorkedTask,
        getAllWorkedDataOfEmp,
        getAllWorkedData,
        getAllGroupedWorkedData,
        taskWorkDetailsPieChart,
        taskWorkDetailsBarChart,
        EmployeeTaskDropDown,
    }
}

module.exports = workController()
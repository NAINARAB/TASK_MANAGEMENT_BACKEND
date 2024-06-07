const sql = require('mssql');
const { invalidInput, servError, dataFound, noData, falied } = require('./res');



const DashboardRouter = () => {

    const getDashboardData = async (req, res) => {
        const { UserType, Emp_Id } = req.query;

        if ((isNaN(UserType) && !UserType) || !Emp_Id) {
            return invalidInput(res, 'UserType, Emp_Id is required');
        }

        try {
            const isAdmin = (Number(UserType) === 1 || Number(UserType) === 0 || Number(UserType) === 2);

            const adminQuery = `
                SELECT 

                (
                    SELECT 
                        COUNT(UserId) 
                    FROM 
                        tbl_Users 
                    WHERE 
                        UserId != 0 AND UDel_Flag = 0 AND UserTypeId = 3
                ) AS EmployeeCounts,
                
                (
                    SELECT 
                        COUNT(UserId) 
                    FROM 
                        tbl_Users 
                    WHERE 
                        UserId != 0 AND UDel_Flag = 0 AND UserTypeId != 3
                ) AS OtherUsers,
                
                (
                    SELECT
                        COUNT(Project_Id)
                    FROM 
                        tbl_Project_Master
                    WHERE 
                        Project_Status != 3 AND Project_Status != 4 
                ) AS ActiveProjects,
                
                (
                    SELECT
                        COUNT(Project_Id)
                    FROM 
                        tbl_Project_Master
                ) AS AllProjects,
                
                (
                    SELECT 
                        COUNT(Sch_Id)
                    FROM 
                        tbl_Project_Schedule
                    WHERE 
                        Sch_Status != 3 AND Sch_Status != 4 AND Sch_Del_Flag = 0
                ) AS ActiveSchedule,
                
                (
                    SELECT 
                        COUNT(Sch_Id)
                    FROM 
                        tbl_Project_Schedule
                    WHERE
                        Sch_Del_Flag = 0
                ) AS AllSchedule,
                
                (
                    SELECT 
                        COUNT(A_Id)
                    FROM 
                        tbl_Project_Sch_Task_DT
                    WHERE
                        Task_Sch_Del_Flag = 0
                ) AS TaskInvolved,
                
                (
                    SELECT
                        DISTINCT(COUNT(Task_Levl_Id))
                    FROM 
                        tbl_Task_Details
                    WHERE
                        Invovled_Stat = 1
                ) AS TaskAssigned,
                
                (
                    SELECT
                        DISTINCT(COUNT(Task_Levl_Id))
                    FROM
                        tbl_Work_Master
                    WHERE
                        Work_Status = 3
                        AND
                        Project_Id != 1
                ) AS TaskCompleted,
                
                (
                    SELECT
                        SUM(Tot_Minutes)
                    FROM 
                        tbl_Work_Master
                    WHERE
                        Work_Status = 3
                        AND
                        Project_Id != 1
                ) AS TotalMinutes,

                (
                    SELECT
                        COUNT(Task_Levl_Id)
                    FROM 
                        tbl_Task_Details
                    WHERE 
                        CONVERT(DATE, Est_Start_Dt) <= CONVERT(DATE, GETDATE())
                        AND
                        CONVERT(DATE, Est_End_Dt) >= CONVERT(DATE, GETDATE())
                ) AS TodayTasks,

                (
                    SELECT
                        COUNT(Task_Levl_Id)
                    FROM 
                        tbl_Work_Master
                    WHERE
                        CONVERT(DATE, Work_Dt) = CONVERT(DATE, GETDATE())
                        AND
                        Work_Status = 3
                ) AS TodayTaskCompleted`;

            const employeeQuery = `
            SELECT 
	
	            (
	            	SELECT
	            		DISTINCT(COUNT(Task_Levl_Id))
	            	FROM 
	            		tbl_Task_Details
	            	WHERE
	            		Invovled_Stat = 1
	            		AND
	            		Emp_Id = ${Emp_Id}
	            ) AS TotalTasks,
                
	             (
	            	SELECT
	            		DISTINCT(COUNT(Task_Levl_Id))
                    FROM
	            		tbl_Work_Master
	            	WHERE
	            		Work_Status = 3
	            		AND
	            		Emp_Id = ${Emp_Id}
	            ) AS TaskCompleted,

                (
	            	SELECT
	            		SUM(Tot_Minutes)
                    FROM 
	            		tbl_Work_Master
	            	WHERE
	            		Work_Status = 3
	            	AND
	            		Emp_Id = ${Emp_Id}
	            ) AS WorkedMinutes,
                
	            (
	            	SELECT
	            		COUNT(Task_Levl_Id)
	            	FROM 
	            		tbl_Task_Details
	            	WHERE 
	            		CONVERT(DATE, Est_Start_Dt) <= CONVERT(DATE, GETDATE())
	            		AND
                        CONVERT(DATE, Est_End_Dt) >= CONVERT(DATE, GETDATE())
	            		AND
	            		Emp_Id = ${Emp_Id}
	            ) AS TodayTasks,
                
	            (
	            	SELECT
	            		COUNT(Task_Levl_Id)
	            	FROM 
	            		tbl_Work_Master
                    WHERE
	            		CONVERT(DATE, Work_Dt) = CONVERT(DATE, GETDATE())
                        AND
                        Work_Status = 3
	            		AND
	            		Emp_Id = ${Emp_Id}
	            ) AS TodayTaskCompleted`

            const result = await sql.query(isAdmin ? adminQuery : employeeQuery)

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getTallyWorkDetails = async (req, res) => {
        const { UserId, From, To } = req.query;

        if (isNaN(UserId)) {
            return invalidInput(res, 'UserId is required');
        }

        try {
            const request = new sql.Request();
            request.input('User_Mgt_Id', UserId);
            request.input('Fromdate', From ? new Date(From).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
            request.input('Todate', To ? new Date(To).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);

            const result = await request.execute('Transaction_User_Count_List_By_Emp_Id');

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    // const getUserByAuth = async (req, res) => {
    //     const { Auth } = req.query;

    //     if (!Auth) {
    //         return invalidInput(res, 'Auth is required');
    //     }

    //     try {
    //         const query = `
    //         SELECT
    //         	u.*,
    //         	COALESCE(
    //         		ut.UserType,
    //         		'UnKnown UserType'
    //         	) AS UserType,
    //         	COALESCE(
    //         		b.BranchName,
    //         		'Unknown Branch'
    //         	) AS BranchName,
    //         	COALESCE(
    //         		c.Company_id,
    //         		'0'
    //         	) AS Company_id,
                
    //         	(
    //         		SELECT 
    //         			TOP (1)
    //         			UserId,
    //         			SessionId,
    //         			InTime
    //         		FROM
    //         			tbl_User_Log
    //         		WHERE
    //         			UserId = u.UserId
    //         		ORDER BY
    //         			InTime DESC
    //         			FOR JSON PATH
    //         	) AS session
                
    //         FROM 
    //         	tbl_Users AS u
    //         LEFT JOIN
    //         	tbl_User_Type AS ut
    //         	ON ut.Id = u.UserTypeId
    //         LEFT JOIN
    //         	tbl_Business_Master AS b
    //         	ON b.BranchId = u.BranchId
    //         LEFT JOIN
    //         	tbl_Company_Master AS c
    //         	ON c.Company_id = b.Company_id
                
    //         WHERE
    //         	Autheticate_Id = '${Auth}'
    //         `;

    //         const result = await sql.query(query);

    //         if (result.recordset.length > 0) {
    //             result.recordset[0].session = result.recordset[0].session ? JSON.parse(result.recordset[0].session) : [{
    //                 UserId: result.recordset[0].UserId, SessionId: new Date(), InTime: new Date()
    //             }]
    //             return dataFound(res, result.recordset)
    //         } else {
    //             return falied(res, 'User Not Found')
    //         }
    //     } catch (e) {
    //         servError(e, res)
    //     }
    // }

    const getUserByAuth = async (req, res) => {
        const { Auth } = req.query;

        if (!Auth) {
            return invalidInput(res, 'Auth required');
        }

        try {
            const query = `
            SELECT
                u.UserTypeId,
                u.UserId,
                u.UserName,
                u.Password,
                u.BranchId,
                b.BranchName,
                u.Name,
                ut.UserType,
                u.Autheticate_Id,
                u.Company_Id AS Company_id,
                c.Company_Name,

                (
                    SELECT 
                        TOP (1)
                        UserId,
                        SessionId,
                        InTime
                    FROM
                        tbl_User_Log
                    WHERE
                        UserId = u.UserId
                    ORDER BY
                        InTime DESC
                        FOR JSON PATH
                )  AS session

            FROM tbl_Users AS u

            LEFT JOIN tbl_Branch_Master AS b
            ON b.BranchId = u.BranchId

            LEFT JOIN tbl_User_Type AS ut
            ON ut.Id = u.UserTypeId

            LEFT JOIN tbl_Company_Master AS c
            ON c.Company_id = u.Company_Id

            WHERE u.Autheticate_Id = @auth AND UDel_Flag= 0`;

            const request = new sql.Request();
            request.input('auth', Auth)

            const result = await request.query(query);

            if (result.recordset.length > 0) {
                result.recordset[0].session = result.recordset[0].session ? JSON.parse(result.recordset[0].session) : [{
                    UserId: result.recordset[0].UserId, SessionId: new Date(), InTime: new Date()
                }]
                return dataFound(res, result.recordset)
            } else {
                return falied(res, 'User Not Found')
            }
        } catch (e) {
            servError(e, res);
        }
    }


    const getEmployeeAbstract = async (req, res) => {
        const { UserId } = req.query;

        if (isNaN(UserId)) {
            return invalidInput(res, 'UserId is required')
        }

        try {
            const query = `
            SELECT 
            	u.UserId,
            	u.Name,
            	u.UserTypeId,
            	ut.UserType,
            	u.BranchId,
            	b.BranchName,

            	COALESCE((
            		SELECT 
            			DISTINCT td.Project_Id,
            			p.Project_Name
                
            		FROM
            			tbl_Task_Details AS td
            			LEFT JOIN tbl_Project_Master AS p
            			ON p.Project_Id = td.Project_Id
            		WHERE
            			td.Emp_Id = u.UserId
            		FOR JSON PATH
            	), '[]') AS Projects,
            
            	COALESCE((
            		SELECT 
            			td.Task_Id,
            			t.Task_Name,
                        t.Task_Desc,
            			td.AN_No,
            			CONVERT(DATE, td.Est_Start_Dt) AS Est_Start_Dt,
            			CONVERT(DATE, td.Est_End_Dt) AS Est_End_Dt,
            			td.Sch_Time,
            			td.EN_Time,
            			td.Sch_Period,
            			td.Timer_Based,

                        COALESCE((
							SELECT 
								tpd.*,
								tpdtpm.Paramet_Name,
								tpdtpm.Paramet_Data_Type
							FROM
								tbl_Task_Paramet_DT AS tpd
								LEFT JOIN tbl_Paramet_Master AS tpdtpm
								ON tpdtpm.Paramet_Id = tpd.Param_Id
							WHERE
								tpd.Task_Id = td.Task_Id
							FOR JSON PATH
						), '[]') AS Task_Param,

            			COALESCE((
            				SELECT
            					wk.Work_Id,
            					wk.Work_Dt,
            					wk.Work_Done,
            					wk.Start_Time,
            					wk.End_Time,
            					wk.Tot_Minutes,
            					wk.Work_Status,
            					s.Status AS StatusGet,

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
            							wp.Work_Id = wk.Work_Id
            						FOR JSON PATH
								), '[]') AS Parameter_Details

            				FROM
            					tbl_Work_Master AS wk
            					LEFT JOIN tbl_Status AS s
            					ON s.Status_Id = wk.Work_Status
            				WHERE
            					wk.AN_No = td.AN_No
            				FOR JSON PATH
            			), '[]') AS Work_Details
                    
            		FROM
            			tbl_Task_Details AS td
            			LEFT JOIN tbl_Task AS t
            			ON td.Task_Id = t.Task_Id
            		WHERE
            			td.Emp_Id = u.UserId
            		FOR JSON PATH
            	), '[]') AS AssignedTasks
            
            FROM
            	tbl_Users AS u
            	LEFT JOIN tbl_User_Type AS ut ON ut.Id = u.UserTypeId
            	LEFT JOIN tbl_Branch_Master AS b ON b.BranchId = u.BranchId
            WHERE
            	u.UserId = @user
            `;

            const request = new sql.Request()
            request.input('user', UserId)

            const result = await request.query(query);

            if (result.recordset.length > 0) {

                const levelOneParsed = result.recordset.map(o => ({
                    ...o,
                    Projects: JSON.parse(o.Projects), 
                    AssignedTasks: JSON.parse(o.AssignedTasks),
                    WorkDetails: o?.WorkDetails ? JSON.parse(o?.WorkDetails) : []
                }))

                const levelTwoParsed = levelOneParsed.map(o => ({
                    ...o,

                    AssignedTasks: o?.AssignedTasks?.map(ao => ({
                        ...ao,
                        Work_Details: JSON.parse(ao?.Work_Details),
                        Task_Param: JSON.parse(ao?.Task_Param)
                    })),

                    WorkDetails: Array.isArray(o?.WorkDetails) ? o?.WorkDetails?.map(wo => ({
                        ...wo,
                        Parameter_Details: JSON.parse(wo?.Parameter_Details)
                    })) : []

                }))

                const levelThreeParsed = levelTwoParsed.map(o => ({
                    ...o,
                    
                    AssignedTasks: o?.AssignedTasks?.map(ao => ({
                        ...ao,
                        Work_Details: ao?.Work_Details?.map(wo => ({
                            ...wo,
                            Parameter_Details: JSON.parse(wo?.Parameter_Details)
                        }))
                    }))
                }))

                dataFound(res, levelThreeParsed)

            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const getERPDashboardData = async (req, res) => {
        const { Fromdate, Company_Id } = req.query;

        if(!Fromdate || (isNaN(Company_Id) && !Company_Id)) {
            return invalidInput(res, 'Fromdate, Company_Id is required')
        }

        try {
            const request = new sql.Request();
            request.input('Fromdate', Fromdate);
            request.input('Company_Id', Company_Id);

            const result = await request.execute('Dashboard_Online_Report_VW');

            if (result.recordsets) {
                dataFound(res, result.recordsets) 
            } else {
                noData(res)
            }

        } catch (e) { 
            servError(e, res) 
        }
    }

    return {
        getDashboardData,
        getTallyWorkDetails,
        getUserByAuth,
        getEmployeeAbstract,
        getERPDashboardData,
    }
}

module.exports = DashboardRouter()
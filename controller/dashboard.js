const sql = require('mssql');
const { invalidInput, servError, dataFound, noData, falied } = require('./res');



const DashboardRouter = () => {

    const getDashboardData = async (req, res) => {
        const { UserType, Emp_Id } = req.query;

        if (UserType === undefined || !Emp_Id) {
            return invalidInput(res, 'UserType, Emp_Id is required');
        }

        try {
            const isAdmin = (Number(UserType) === 1 || Number(UserType) === 0);

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

    const getUserByAuth = async (req, res) => {
        const { Auth } = req.query;

        if (!Auth) {
            return invalidInput(res, 'Auth is required');
        }

        try {
            const query = `
            SELECT
            	u.*,
            	COALESCE(
            		ut.UserType,
            		'UnKnown UserType'
            	) AS UserType,
            	COALESCE(
            		b.BranchName,
            		'Unknown Branch'
            	) AS BranchName,
            	COALESCE(
            		c.Company_id,
            		'0'
            	) AS Company_id,
                
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
            	) AS session
                
            FROM 
            	tbl_Users AS u
            LEFT JOIN
            	tbl_User_Type AS ut
            	ON ut.Id = u.UserTypeId
            LEFT JOIN
            	tbl_Business_Master AS b
            	ON b.BranchId = u.BranchId
            LEFT JOIN
            	tbl_Company_Master AS c
            	ON c.Company_id = b.Company_id
                
            WHERE
            	Autheticate_Id = '${Auth}'
            `;

            const result = await sql.query(query);

            if (result.recordset.length > 0) {
                result.recordset[0].session = result.recordset[0].session ? JSON.parse(result.recordset[0].session) : [{
                    UserId: result.recordset[0].UserId, SessionId: new Date(), InTime: new Date()
                }]
                return dataFound(res, result.recordset)
            } else {
                return falied(res, 'User Not Found')
            }
        } catch (e) {
            servError(e, res)
        }
    }

    return {
        getDashboardData,
        getUserByAuth,
    }
}

module.exports = DashboardRouter()
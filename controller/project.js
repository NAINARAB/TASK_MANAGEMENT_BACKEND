const sql = require("mssql");
const { storecall } = require("../config/store");
const resFun = require('./res')


const projectController = () => {

    const getProjectDropDown = async (req, res) => {

        try {
          const result = await storecall('exec Project_List_Online_Filter');
    
          if (Array.isArray(result)) {
            return res.json({ success: true, message: '', data: result })
          } else {
            return res.json({ success: true, message: 'no data', data: [] })
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
      }
    
      const getProject = async (req, res) => {
    
        try {
          const result = await storecall('exec Project_vw');
    
          if (Array.isArray(result)) {
            return res.json({ success: true, message: '', data: result })
          } else {
            return res.json({ success: true, message: 'no data', data: [] })
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
      }
    
      const postProject = async (req, res) => {
        const { Project_Name, Project_Desc, Base_Type, Project_Head, Est_Start_Dt, Est_End_Dt, Project_Status, Entry_By } = req.body;
    
        if (!Project_Name) {
          return res.status(400).json({ success: false, message: 'Project_Name is required', data: [] });
        }
    
        try {
          const request = new sql.Request();
          request.input('Mode', 1);
          request.input('Project_Id', 0);
          request.input('Project_Name', Project_Name);
          request.input('Project_Desc', Project_Desc);
          request.input('Base_Type', Number(Base_Type));
          request.input('Project_Head', Project_Head);
          request.input('Est_Start_Dt', Est_Start_Dt);
          request.input('Est_End_Dt', Est_End_Dt);
          request.input('Project_Status', Project_Status);
          request.input('Entry_By', Entry_By);
          request.input('Entry_Date', new Date());
    
          const result = await request.execute('Project_SP');
    
          if (result.rowsAffected.length > 0) {
            res.status(200).json({ success: true, message: 'Project added successfully', data: [] });
          } else {
            res.status(400).json({ success: false, message: 'Failed to add project', data: [] });
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
      };
    
      const editProject = async (req, res) => {
        const { Project_Id, Project_Name, Project_Desc, Base_Type, Project_Head, Est_Start_Dt, Est_End_Dt, Project_Status, Entry_By } = req.body;
    
        if (!Project_Id || !Project_Name) {
          return res.status(400).json({ success: false, message: 'Project_Id, Project_Name is Required', data: [] });
        }
    
        try {
          const request = new sql.Request();
          request.input('Mode', 2);
          request.input('Project_Id', Project_Id);
          request.input('Project_Name', Project_Name);
          request.input('Project_Desc', Project_Desc);
          request.input('Base_Type', Base_Type);
          request.input('Project_Head', Project_Head);
          request.input('Est_Start_Dt', Est_Start_Dt);
          request.input('Est_End_Dt', Est_End_Dt);
          request.input('Project_Status', Project_Status);
          request.input('Entry_By', Entry_By);
          request.input('Entry_Date', new Date());
    
          const result = await request.execute('Project_SP');
    
          if (result.rowsAffected.length > 0) {
            res.status(200).json({ success: true, message: 'Changes Saved!', data: [] });
          } else {
            res.status(400).json({ success: false, message: 'Failed to Save', data: [] });
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
      }
    
      const deleteProject = async (req, res) => {
        const { Project_Id } = req.body;
    
        if (!Project_Id) {
          return res.status(400).json({ success: false, message: 'Invalid Project_Id', data: [] });
        }
    
        try {
          const request = new sql.Request();
          request.input('Mode', 3);
          request.input('Project_Id', Project_Id);
          request.input('Project_Name', 0);
          request.input('Project_Desc', 0);
          request.input('Base_Type', 0);
          request.input('Project_Head', 0);
          request.input('Est_Start_Dt', 0);
          request.input('Est_End_Dt', 0);
          request.input('Project_Status', 0);
          request.input('Entry_By', 0);
          request.input('Entry_Date', 0);
    
          const result = await request.execute('Project_SP');
    
          if (result.rowsAffected.length > 0) {
            res.status(200).json({ success: true, message: 'Project Deleted!', data: [] });
          } else {
            res.status(400).json({ success: false, message: 'Failed to Delete', data: [] });
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
      }

      const getProjectAbstract = async (req, res) => {
        try {
          const request = new sql.Request();
          const result = await request.query(`
          SELECT 
            p.Project_Id, 
            p.Project_Name, 
            p.Est_Start_Dt, 
            p.Est_End_Dt,

            (SELECT COUNT(Sch_Id) FROM tbl_Project_Schedule WHERE Project_Id = p.Project_Id) AS SchedulesCount,

            (
          	SELECT 
          			COUNT(t.Task_Id) 
              FROM 
          			tbl_Project_Schedule AS s
          		JOIN 
          			tbl_Project_Sch_Task_DT AS t 
          			ON s.Sch_Id = t.Sch_Id
              WHERE s.Project_Id = p.Project_Id
            ) AS TasksInvolved,
              
          	(
          		SELECT
          			DISTINCT COUNT(Emp_Id)
          		FROM 
          			tbl_Task_Details
          		WHERE 
          			Project_Id = p.Project_Id
          	) AS EmployeesInvolved,
            
          	(
          		SELECT 
          			COUNT(Task_Id) AS InvolvedTasksCompleted
              FROM 
          			tbl_Task_Details
              WHERE 
          			Project_Id = p.Project_Id 
                AND 
                Task_Status = 3 
          	) AS CompletedTasks
            
          FROM 
              tbl_Project_Master AS p`);

          if (result.recordset.length > 0) {
            resFun.dataFound(res, result.recordset)
          } else {
            resFun.noData(res)
          }
        } catch (e) {
          resFun.servError(e, res)
        }
      }

      const getTasksInProject = async (req, res) => {
        const { Project_Id } = req.query;

        if (!Project_Id) {
          return resFun.invalidInput(res, 'Project_Id is required')
        }

        try {
          const request = new sql.Request();
          request.input('Project_Id', Project_Id);

          const result = await request.execute('Task_List_By_Project_Id');

          if (result) {
            resFun.dataFound(res, result)
          } 
        } catch (e) {
          resFun.servError(e, res)
        }
      } 


      return {
        getProjectDropDown,
        getProject,
        postProject,
        editProject,
        deleteProject,
        getProjectAbstract,
        getTasksInProject,
      }
}

module.exports = projectController()
const sql = require("mssql");
const { dataFound, noData, servError, invalidInput } = require('../controller/res');

const taskModule = () => {

  const getTaskDropDown = async (req, res) => {
    try {
      const getQuery = `SELECT Task_Id, Task_Name FROM tbl_Task ORDER BY Task_Name`

      const request = new sql.Request()
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

  const getTasks = async (req, res) => {

    try {
      const result = await sql.query(`
      SELECT 
	      t.*,

		    COALESCE((
			    SELECT 
			    	Task_Name
			    FROM
			    	tbl_Task
			    WHERE
			    	Task_Id = t.Under_Task_Id
		    ), 'PRIMARY TASK') AS Under_Task,
      
		    COALESCE((
			    SELECT 
			    	Task_Type
			    FROM
			    	tbl_Task_Type
			    WHERE
			    	Task_Type_Id = t.Task_Group_Id
		    ), 'Unknown') AS Task_Group,
	
	      COALESCE((
	      	SELECT 
            param.PA_Id,
            param.Task_Id,
            param.Param_Id AS Paramet_Id,
            param.Default_Value,
            pm.Paramet_Name,
            pm.Paramet_Data_Type
	      	FROM
	      		tbl_Task_Paramet_DT AS param
            LEFT JOIN tbl_Paramet_Master AS pm
            ON pm.Paramet_Id = param.Param_Id
	      	WHERE
	      		Task_Id = t.Task_Id
	      	FOR JSON PATH
	      ), '[]') AS Det_string

      FROM 
        tbl_Task AS t

      ORDER BY 
        CONVERT(DATE, t.Entry_Date) DESC`)

      if (result.recordset.length > 0) {
        const parsed = result.recordset.map(o => ({
          ...o,
          Det_string: JSON.parse(o?.Det_string)
        }))
        return dataFound(res, parsed)
      } else {
        return noData(res)
      }
    } catch (err) {
      return servError(err, res)
    }
  }

  const createTask = async (req, res) => {
    const { Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By, Det_string } = req.body;

    if (!Task_Name || !Task_Desc || isNaN(Under_Task_Id) || isNaN(Task_Group_Id) || !Entry_By) {
      return invalidInput(res, 'Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By is required')
    }

    try {
      const request = new sql.Request();

      request.input('Mode', 1);
      request.input('Task_Id', 0);
      request.input('Task_Name', Task_Name);
      request.input('Task_Desc', Task_Desc);
      request.input('Under_Task_Id', Under_Task_Id)
      request.input('Entry_By', Entry_By);
      request.input('Entry_Date', new Date());
      request.input('Task_Group_Id', Task_Group_Id);
      request.input('Det_string', Det_string || '')

      const result = await request.execute('Task_SP');
      console.log(result);

      if (result.rowsAffected.length > 0 && result.recordset[0].Task_Id) {

        return dataFound(res, [], 'Task Created');
      } else {
        return res.status(400).json({ data: [], message: 'Failed to create Task', success: false })
      }

    } catch (e) {
      return servError(e, res)
    }
  };

  const editTask = async (req, res) => {
    const { Task_Id, Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By, Det_string } = req.body;

    if (isNaN(Task_Id) || !Task_Name || !Task_Desc || isNaN(Under_Task_Id) || isNaN(Task_Group_Id) || isNaN(Entry_By)) {
      return invalidInput(res, 'Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By is required')
    }

    try {
      const request = new sql.Request();

      request.input('Mode', 2);
      request.input('Task_Id', Task_Id);
      request.input('Task_Name', Task_Name);
      request.input('Task_Desc', Task_Desc);
      request.input('Under_Task_Id', Under_Task_Id)
      request.input('Entry_By', Entry_By);
      request.input('Entry_Date', new Date());
      request.input('Task_Group_Id', Task_Group_Id)
      request.input('Det_string', Det_string || '')

      const result = await request.execute('Task_SP');

      if (result.rowsAffected.length > 0) {
        return dataFound(res, [], 'Task Updated');
      } else {
        return res.status(400).json({ data: [], message: 'Failed to create Task', success: false })
      }

    } catch (e) {
      return servError(e, res)
    }
  }

  const deleteTask = async (req, res) => {
    const { Task_Id } = req.body;

    if (!Task_Id) {
      return invalidInput(res, 'Task_Id is required')
    }

    try {
      const request = new sql.Request();

      request.input('Mode', 3);
      request.input('Task_Id', Task_Id);
      request.input('Task_Name', '');
      request.input('Task_Desc', '');
      request.input('Under_Task_Id', '')
      request.input('Entry_By', '');
      request.input('Entry_Date', '');

      const result = await request.execute('Task_SP');

      if (result.rowsAffected.length > 0) {
        return dataFound(res, [], 'One Task Deleted');
      } else {
        return res.status(400).json({ data: [], message: 'Failed to Delete Task', success: false })
      }

    } catch (e) {
      return servError(e, res)
    }
  }

  const getMyTasks = async (req, res) => {
    const { Branch, Emp_Id } = req.query;

    if (!Branch || !Emp_Id) {
      return invalidInput(res, 'Branch, Emp_Id is required');
    }

    try {
      const request = new sql.Request();
      request.input('Branch', Branch);
      request.input('Emp_Id', Emp_Id);

      const result = await request.execute('Task_Search_By_Online_Emp_Id');

      if (result.recordset.length > 0) {
        return dataFound(res, result.recordset)
      } else {
        return noData(res)
      }
    } catch (e) {
      return servError(e, res);
    }
  }

  const getTaskAssignedUsers = async (req, res) => {

    try {
      const query = `
      SELECT 
      	td.Emp_Id AS UserId,
      	u.Name
      FROM 
        tbl_Work_Master AS td
      	LEFT JOIN tbl_Users AS u
      	ON u.UserId = td.Emp_Id
      GROUP BY
      	td.Emp_Id,
      	u.Name`;

      const result = await sql.query(query);

      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    } catch (e) {
      servError(e, res);
    }
  }

  const getFilteredUsersBasedOnTasks = async (req, res) => {
    const { Task_Id } = req.query;

    if (!Task_Id) {
      return invalidInput(res, 'Task_Id is required');
    }

    try {
      const query = `
      SELECT 
      	td.Emp_Id,
      	u.Name
      FROM 
        tbl_Work_Master AS td
      	LEFT JOIN tbl_Users AS u
      	ON u.UserId = td.Emp_Id
      WHERE 
      	td.Task_Id = @task_id
      GROUP BY
      	td.Emp_Id,
      	u.Name`;
      const request = new sql.Request();
      request.input('task_id', Task_Id);

      const result = await request.query(query);

      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    } catch (e) {
      servError(e, res)
    }
  }

  const getAssignedTasks = async (req, res) => {
    try {
      const query = `
      SELECT
      	td.Task_Id,
      	t.Task_Name
      FROM
        tbl_Work_Master AS td
      	LEFT JOIN tbl_Task AS t
      	ON t.Task_Id = td.Task_Id
      GROUP BY
      	td.Task_Id,
      	t.Task_Name`;

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
    getTaskDropDown,
    getTasks,
    createTask,
    editTask,
    deleteTask,
    getMyTasks,
    getTaskAssignedUsers,
    getFilteredUsersBasedOnTasks,
    getAssignedTasks,
  }
}

module.exports = taskModule();
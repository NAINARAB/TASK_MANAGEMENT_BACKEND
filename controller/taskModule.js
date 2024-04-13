const sql = require("mssql");
const { dataFound, noData, falied, servError, invalidInput } = require('../controller/res');
const { storecall } = require("../config/store");

const taskModule = () => {

  const getTaskDropDown = async (req, res) => {
    try {
      const getQuery = `SELECT Task_Id, Task_Name FROM tbl_Task`

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
      const request = new sql.Request()

      const result = await request.execute('Task_Search_Online');
      if (result.recordset.length > 0) {
        return dataFound(res, result.recordset)
      } else {
        return noData(res)
      }
    } catch (err) {
      return servError(err, res)
    }
  }

  const createTask = async (req, res) => {
    const { Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By } = req.body;

    if (!Task_Name || !Task_Desc || isNaN(Number(Under_Task_Id)) || isNaN(Task_Group_Id) || !Entry_By) {
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
      request.input('Task_Group_Id', Task_Group_Id)

      const result = await request.execute('Task_SP');

      if (result.rowsAffected.length > 0) {
        return dataFound(res, [], 'Task Created');
      } else {
        return res.status(400).json({ data: [], message: 'Failed to create Task', success: false })
      }

    } catch (e) {
      return servError(e, res)
    }
  };

  const editTask = async (req, res) => {
    const { Task_Id, Task_Name, Task_Desc, Under_Task_Id, Task_Group_Id, Entry_By } = req.body;

    if ( isNaN(Task_Id) || !Task_Name || !Task_Desc || isNaN(Under_Task_Id) || isNaN(Task_Group_Id) || isNaN(Entry_By) ) {
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

  // oldCode

  
  const assignEmployeeForTask = async (req, res) => {
    const { Task_Id, Sub_Task_Id, Emp_Id, Task_Assign_dt, Prity, Sch_Time, EN_Time, Ord_By, Timer_Based, Assigned_Emp_Id } = req.body;

    const requiredVariables = ['Task_Id', 'Sub_Task_Id', 'Emp_Id', 'Task_Assign_dt', 'Prity', 'Sch_Time', 'EN_Time', 'Ord_By', 'Assigned_Emp_Id'];

    const missingVariables = Object.keys(req.body).filter(variable =>
      requiredVariables.includes(variable) && !req.body[variable]
    );

    if (missingVariables.length > 0) {
      const missingVariablesString = missingVariables.join(', ');
      return invalidInput(res, `${missingVariablesString} is/are required`);
    }


    const checkEmpAlredyAssigned = `SELECT COUNT(*) AS INVOLVED FROM tbl_Task_Details WHERE Task_Id = '${Task_Id}' AND T_Sub_Task_Id = '${Sub_Task_Id}' AND Emp_Id = '${Emp_Id}'`;

    try {
      const count = await storecall(checkEmpAlredyAssigned);
      if (Array.isArray(count) && count[0].INVOLVED > 0) {
        return falied(res, 'Employee Already Assigned To This Task')
      }

      const request = new sql.Request();
      request.input('Mode', 1);
      request.input('Task_Id', Task_Id);
      request.input('T_Sub_Task_Id', Sub_Task_Id || 0);
      request.input('Emp_Id', Emp_Id);
      request.input('Task_Assign_dt', Task_Assign_dt);
      request.input('Prity', Prity);
      request.input('Sch_Time', Sch_Time);
      request.input('EN_Time', EN_Time);
      request.input('Ord_By', Ord_By);
      request.input('Timer_Based', Timer_Based || 0);
      request.input('Assigned_Emp_Id', Assigned_Emp_Id);

      const result = await request.execute('Task_Assign_SP');

      if (result.rowsAffected.length > 0) {
        dataFound(res, [], 'One Task Assigned!');
      } else {
        return falied(res, 'Failed to assign Task, Please try again')
      }

    } catch (e) {
      return servError(e, res)
    }
  }

  const editAssignEmployeeForTask = async (req, res) => {
    const { Id, Sub_Task_Id, Emp_Id, Task_Assign_dt, Prity, Sch_Time, Ord_By, Timer_Based, Assigned_Emp_Id } = req.body;

    if ((!Id && !Sub_Task_Id) || !Emp_Id || !Task_Assign_dt || !Prity || !Sch_Time || !Ord_By || !Assigned_Emp_Id) {
      return invalidInput(res, 'Id, Sub_Task_Id, Emp_Id, Task_Assign_dt, Prity, Sch_Time, Ord_By, Assigned_Emp_Id is required')
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 2);
      request.input('Id', Id);
      request.input('T_Sub_Task_Id', Sub_Task_Id);
      request.input('Emp_Id', Emp_Id);
      request.input('Task_Assign_dt', Task_Assign_dt);
      request.input('Prity', Prity);
      request.input('Sch_Time', Sch_Time);
      request.input('Ord_By', Ord_By);
      request.input('Timer_Based', Timer_Based || 0);
      request.input('Assigned_Emp_Id', Assigned_Emp_Id)

      const result = await request.execute('Task_Assign_SP_Update');

      if (result.rowsAffected.length > 0) {
        dataFound(res, [], 'Changes Saved!');
      } else {
        return falied(res, 'Failed to Save Changes, Please try again')
      }

    } catch (e) {
      return servError(e, res)
    }
  }

  const deleteAssignEmployeeForTask = async (req, res) => {
    const { Id, T_Sub_Task_Id, Emp_Id } = req.body;

    if ((!Id && !T_Sub_Task_Id) || !Emp_Id) {
      return invalidInput(res, 'Id, T_Sub_Task_Id, Emp_Id is required')
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 3);
      request.input('Id', Id);
      request.input('T_Sub_Task_Id', T_Sub_Task_Id);
      request.input('Emp_Id', Emp_Id);
      request.input('Task_Assign_dt', '');
      request.input('Prity', '');
      request.input('Sch_Time', '');
      request.input('Ord_By', '');
      request.input('Timer_Based', '');
      request.input('Assigned_Emp_Id', '');

      const result = await request.execute('Task_Assign_SP_Update');

      if (result.rowsAffected.length > 0) {
        dataFound(res, [], 'Employee Removed From Assigned Task!');
      } else {
        return falied(res, 'Failed to Save Changes, Please try again')
      }

    } catch (e) {
      return servError(e, res)
    }
  }

  const removeAssignedEmp = async (req, res) => {
    try {
      const { modifiedDetails, mode } = req.body;
      const sq = `exec Task_Assign_SP_Update @Mode=${mode}, @Id='${modifiedDetails.Id}', @T_Sub_Task_Id='${modifiedDetails.T_Sub_Task_Id}', @Emp_Id='${modifiedDetails.Emp_Id}', 
                @Task_Assign_dt='${modifiedDetails.Task_Assign_dt}', @Prity='${modifiedDetails.Prity}', @Sch_Time='${modifiedDetails.Sch_Time}', 
                @Ord_By='${modifiedDetails.Ord_By}', @Timer_Based='${modifiedDetails.Timer_Based}';`

      const request = new sql.Request();
      const result = await request.query(sq);
      if (result.rowsAffected[0] > 0) {
        res.status(200).json({});
      } else {
        res.status(400).json({});
      }
    } catch (err) {
      return res.status(500).send({ data: [], message: err })
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


  return {
    getTaskDropDown,
    getTasks,
    createTask,
    editTask,
    deleteTask,
    assignEmployeeForTask,
    editAssignEmployeeForTask,
    deleteAssignEmployeeForTask,
    removeAssignedEmp,
    getMyTasks,
  }
}

module.exports = taskModule();
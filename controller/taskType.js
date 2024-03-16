const sql = require("mssql");
const { storecall } = require("../config/store");
const resFun = require('./res')


const taskTypeControlelr = () => {

  const taskTypeDropDown = async (req, res) => {
    try {
      const sq = `exec Task_Type_Online_Filter`
      const result = await storecall(sq);
      if (Array.isArray(result)) {
        return res.status(200).send({ message: "data found", data: result, success: true });
      } else {
        return res.status(404).send({ message: "data not found", data: [], success: true })
      }

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error', data: [] });
    }
  }

  const newTaskTypeDropDown = async (req, res) => {
    try {
      const query = `SELECT Task_Type_Id, Task_Type FROM tbl_Task_Type WHERE Task_Type_Id != 0 ORDER BY Task_Type_Id`;

      const request = new sql.Request();
      const result = await request.query(query);

      if (result.recordset.length > 0) {
        resFun.dataFound(res, result.recordset)
      } else {
        resFun.noData(res)
      }
    } catch (e) {
      resFun.servError(e, res)
    }
  }

  const getTaskTyepe = async (req, res) => {

    try {
      const sq = `exec Task_Type_Vw`
      const result = await storecall(sq);
      if (Array.isArray(result)) {
        return res.status(200).send({ message: "data found", data: result, success: true });
      } else {
        return res.status(404).send({ message: "data not found", data: [], success: true })
      }

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error', data: [] });
    }
  }

  const postTaskType = async (req, res) => {
    const { Task_Type } = req.body;

    if (!Task_Type) {
      return res.status(400).json({ success: false, message: 'Task_Type is required', data: [] });
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 1);
      request.input('Task_Type_Id', 0);
      request.input('Task_Type', Task_Type);

      const result = await request.execute('Task_Type_SP');

      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ success: true, message: 'Task type added successfully', data: [] });
      } else {
        res.status(400).json({ success: false, message: 'Failed to add task type' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  const editTaskType = async (req, res) => {
    const { Task_Type_Id, Task_Type } = req.body;
    console.log(req.body)

    if (!Task_Type_Id || !Task_Type) {
      return res.status(400).json({ success: false, message: 'Task_Type_Id, Task_Type is required', data: [] });
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 2);
      request.input('Task_Type_Id', Task_Type_Id);
      request.input('Task_Type', Task_Type);

      const result = await request.execute('Task_Type_SP');

      if (result.rowsAffected.length > 0) {
        res.status(200).json({ success: true, message: 'Task type updated successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to update task type' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };

  const deleteTaskType = async (req, res) => {
    const { Task_Type_Id } = req.body;

    if (!Task_Type_Id) {
      return resFun.invalidInput(res, 'Task_Type_Id is required');
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 3);
      request.input('Task_Type_Id', Task_Type_Id);
      request.input('Task_Type', 0);

      const result = await request.execute('Task_Type_SP');

      if (result.rowsAffected[0] > 0) {
        res.status(200).json({ success: true, message: 'Task type deleted successfully' });
      } else {
        res.status(400).json({ success: false, message: 'Failed to delete task type' });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  };


  return {
    newTaskTypeDropDown,
    taskTypeDropDown,
    getTaskTyepe,
    postTaskType,
    editTaskType,
    deleteTaskType
  }
}

module.exports = taskTypeControlelr()
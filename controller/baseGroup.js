const sql = require("mssql");
const { storecall } = require("../config/store");


const baseGroupMaster = () => {

  const getBaseGroup = async (req, res) => {

    try {
      const result = await storecall('exec Base_Group_VW');

      if (Array.isArray(result) && result.length > 0) {
        return res.status(200).json({ message: " data found", data: result, success: true });
      } else {
        return res.status(200).json({ message: "data not found", data: [], success: true })
      }

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Internal Server Error', data: [], success: false });
    }
  }

  const postBaseGroup = async (req, res) => {
    const { Base_Group_Name } = req.body;

    try {
      const request = new sql.Request();
      request.input('Mode', 1);
      request.input('Base_Group_Id', 0);
      request.input('Base_Group_Name', Base_Group_Name);

      const result = await request.execute('Base_Group_SP');

      if (result.recordset.length > 0) {
        return res.status(200).json({ message: "Base Group Created", data: result, success: true });
      } else {
        return res.status(200).json({ message: "Failed to create", data: result, success: true });
      }

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Internal Server Error', data: [], success: false });
    }
  }

  const editBaseGroup = async (req, res) => {
    const { Base_Group_Id, Base_Group_Name } = req.body;

    if (!Base_Group_Id || !Base_Group_Name) {
      return res.status(400).json({ message: 'Base_Group_Id, Base_Group_Name is required', data: [], success: false })
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 2);
      request.input('Base_Group_Id', Base_Group_Id);
      request.input('Base_Group_Name', Base_Group_Name);

      const result = await request.execute('Base_Group_SP');

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: "Changes Saved!", data: result, success: true });
      } else {
        return res.status(200).json({ message: "Failed to save", data: result, success: true });
      }

    } catch (e) {
      console.log(e);
      return res.status(500).json({ message: 'Internal Server Error', data: [], success: false });
    }
  }

  const deleteBaseGroup = async (req, res) => {
    const { Base_Group_Id } = req.body;

    if (!Base_Group_Id) {
      return res.status(400).json({ message: 'Base_Group_Id, is required', data: [], success: false });
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 3);
      request.input('Base_Group_Id', Base_Group_Id);
      request.input('Base_Group_Name', 0);

      const result = await request.execute('Base_Group_SP');

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: 'Deleted', data: [], success: true });
      } else {
        return res.status(400).json({ message: 'Failed to delete', data: [], success: false });
      }

    } catch (e) {
      console.log(e);
      res.status(500).json({ message: 'Internal Server Error', data: [], success: false });
    }
  }

  return {
    getBaseGroup,
    postBaseGroup,
    editBaseGroup,
    deleteBaseGroup
  }
}

module.exports = baseGroupMaster()
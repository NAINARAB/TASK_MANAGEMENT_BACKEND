const sql = require("mssql");
const { success, falied, servError, dataFound, noData } = require("./res");


const userTypeMaster = () => {

  const getUserType = async (req, res) => {

    try {

      const result = await sql.query('SELECT Id, UserType, Alias FROM tbl_User_Type WHERE IsActive = 1');

      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }

    } catch (e) {
      servError(e, res)
    }

  }

  const postUserType = async (req, res) => {
    const { UserType } = req.body;
    try {
      const request = new sql.Request();
      request.input('Mode', 1);
      request.input('Id', 0);
      request.input('UserType', UserType);
      const result = await request.execute('User_Type_SP');

      if (result.rowsAffected[0] > 0) {
        success(res, 'User Type Created')
      } else {
        falied(res, 'Failed to create')
      }

    } catch (e) {
      servError(e, res)
    }
  }

  const editUserType = async (req, res) => {
    const { Id, UserType } = req.body;

    if (!Id || !UserType) {
      return res.status(404).json({ message: "Id, UserType is required", data: [], success: false })
    }
    try {
      const request = new sql.Request();
      request.input('Mode', 2);
      request.input('Id', Id);
      request.input('UserType', UserType);
      const result = await request.execute('User_Type_SP');

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: "Changes Saved", data: [], success: true })
      } else {
        return res.status(404).json({ message: "Failed to Save!", data: [], success: false });
      }

    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: "Internal Server Error", data: [], success: false });
    }
  }

  const deleteUserType = async (req, res) => {
    const { Id } = req.body;

    if (!Id) {
      return res.status(400).json({ message: 'Id is required', data: [], success: false });
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 3);
      request.input('Id', Id);
      request.input('UserType', 0);
      const result = await request.execute('User_Type_SP');

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: "User Type Deleted", data: [], success: true })
      } else {
        return res.status(400).json({ message: "Failed to Delete", data: [], success: false });
      }

    } catch (err) {
      console.log(err)
      return res.status(500).json({ message: "Internal Server Error", data: [], success: false });
    }
  }

  return {
    getUserType,
    postUserType,
    editUserType,
    deleteUserType
  }
}

module.exports = userTypeMaster()
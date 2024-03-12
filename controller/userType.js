const sql = require("mssql");
const { storecall } = require("../config/store");


const userTypeMaster = () => {

    const getUserType = async (req, res) => {
        const getQuery = `SELECT * FROM tbl_User_Type WHERE T_Del_Flag = 0`
        try {
          const userType = await storecall(getQuery);
          if (Array.isArray(userType)) {
            return res.json({ data: userType, success: true, message: 'Data found' })
          } else {
            return res.json({ data: [], success: false, message: 'no records' })
          }
        } catch (e) {
          console.error(e);
          res.status(500).json({ success: false, message: 'Internal server error', data: [] });
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
            return res.status(200).json({ message: "User Type Created", data: [], success: true })
          } else {
            return res.status(404).json({ message: "Failed to create", data: [], success: false });
          }
    
        } catch (err) {
          console.log(err)
          return res.status(500).json({ message: "Internal Server Error", data: [], success: false });
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
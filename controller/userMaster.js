const sql = require("mssql");
const { storecall } = require("../config/store");
var CryptoJS = require("crypto-js");
const { invalidInput, servError, dataFound, noData, success, falied, checkIsNumber } = require("./res");


function md5Hash(input) {
  return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex);
}


const userMaster = () => {

  const getUsers = async (req, res) => {
    const { User_Id, Company_id, Branch_Id } = req.query;

    if (!User_Id || !Company_id || !Branch_Id) {
      return res.status(404).send({ message: "User_Id, Company_id, Branch_Id is Required", data: [], success: false });
    }

    try {
      const request = new sql.Request();
      request.input('User_Id', User_Id);
      request.input('Company_id', Company_id);
      request.input('Branch_Name', Branch_Id);

      const result = await request.execute('Users_vw');

      if (result.recordset.length > 0) {
        res.status(200).json({ success: true, data: result.recordset, message: 'data found' });
      } else {
        res.status(400).json({ success: false, message: 'data not found', data: [] });
      }
    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error', data: [] });
    }
  };

  const postUser = async (req, res) => {
    const { Name, UserName, UserTypeId, Password, BranchId, Company_Id } = req.body;

    if (!Name || !UserName || !checkIsNumber(UserTypeId) || !Password || !checkIsNumber(BranchId) || !checkIsNumber(Company_Id)) {
      return res.status(400).json({ success: false, message: 'Name, UserName, UserTypeId, Password, BranchId and Company_Id is required', data: [] });
    }

    try {
      // const checkTable = await storecall(`SELECT UserId FROM tbl_Users WHERE UserName = '${UserName}'`)
      const checkTable = (await new sql.Request()
        .input('UserName', UserName)
        .query('SELECT UserId FROM tbl_Users WHERE UserName = @UserName')
      ).recordset

      if (checkTable.length > 0) {
        return res.status(400).json({ success: false, message: 'Mobile Number is already exist', data: [] });
      }

      const request = new sql.Request();
      request.input('Mode', 1);
      request.input('UserId', 0);
      request.input('Name', Name);
      request.input('UserName', UserName);
      request.input('UserTypeId', UserTypeId);
      request.input('Password', md5Hash(Password));
      request.input('BranchId', BranchId);
      request.input('Company_Id', Company_Id)

      const result = await request.execute('UsersSP');

      if (result.rowsAffected[0] > 0) {
        return res.json({ data: [], success: true, message: "User created" })
      } else {
        return res.json({ data: [], success: false, message: "Failed to create" })
      }

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  }

  const editUser = async (req, res) => {
    const { UserId, Name, UserName, UserTypeId, Password, BranchId, Company_Id } = req.body;

    const isMd5Hash = /^[a-fA-F0-9]{32}$/.test(Password);
    const passwordToUse = isMd5Hash ? Password : md5Hash(Password);

    if (!UserId || !Name || !UserName || !UserTypeId || !Password || !BranchId || !Company_Id) {
      return res.status(400).json({ success: false, message: 'UserId, Name, UserName, UserTypeId, Password, BranchId, Company_Id is required', data: [] });
    }

    try {
      const checkTable = await storecall(`SELECT UserId FROM tbl_Users WHERE UserName = '${UserName}' AND UserId != '${UserId}'`)
      if (Array.isArray(checkTable) && checkTable.length > 0) {
        return res.status(400).json({ success: false, message: 'Mobile Number is already exist', data: [] });
      }

      const request = new sql.Request();
      request.input('Mode', 2);
      request.input('UserId', UserId);
      request.input('Name', Name);
      request.input('UserName', UserName);
      request.input('UserTypeId', UserTypeId);
      request.input('Password', passwordToUse);
      request.input('BranchId', BranchId);
      request.input('Company_Id', Company_Id)


      const result = await request.execute('UsersSP');

      if (result.rowsAffected[0] > 0) {
        return res.json({ data: [], success: true, message: "Changes Saved!" })
      } else {
        return res.json({ data: [], success: true, message: "Failed to save changes" })
      }

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error', data: [] });
    }
  }

  const deleteUser = async (req, res) => {
    const { UserId } = req.body;

    if (!UserId) {
      return res.status(400).json({ success: false, message: 'UserId is required', data: [] });
    }

    try {
      const request = new sql.Request();
      request.input('Mode', 3);
      request.input('UserId', UserId);
      request.input('Name', 0);
      request.input('UserName', 0);
      request.input('UserTypeId', 0);
      request.input('Password', 0);
      request.input('BranchId', 0);
      request.input('Company_Id', 0);

      const result = await request.execute('UsersSP');

      if (result.rowsAffected[0] > 0) {
        return res.json({ data: [], success: true, message: "User deleted" })
      } else {
        return res.json({ data: [], success: true, message: "Failed to delete" })
      }

    } catch (e) {
      console.error(e);
      res.status(500).json({ success: false, message: 'Internal server error', data: [] });
    }
  }

  const userDropdown = async (req, res) => {
    try {
      const result = await storecall("exec Project_Head_Online_Filter");
      if (Array.isArray(result)) {
        return res.status(200).send({ message: "Filterout Project head", data: result, success: true });
      } else {
        return res.status(200).json({ data: [], message: 'data not found', success: true })
      }

    } catch (err) {
      return res.status(500).send(err)
    }
  };

  const employeeDropDown = async (req, res) => {
    try {
      const result = await sql.query('SELECT UserId, Name FROM tbl_Users WHERE UserTypeId = 3 AND UDel_Flag = 0')

      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    } catch (e) {
      servError(e, res);
    }
  }

  const seletUsersName = async (req, res) => {
    const { AllUser, BranchId } = req.query;

    // if (!AllUser || !BranchId) {
    //   return invalidInput(res, 'AllUser, BranchId is required');
    // }

    try {
      let exeQuery = '';
      if (Boolean(AllUser)) {
        exeQuery = `SELECT UserId, Name FROM tbl_Users WHERE UDel_Flag = 0 AND UserId != 0`;
      } else {
        exeQuery = `SELECT UserId, Name FROM tbl_Users WHERE BranchId = '${BranchId}' AND UDel_Flag = 0 AND UserId != 0`;
      }

      const result = await sql.query(exeQuery);

      if (result.recordset.length > 0) {
        result.recordset.map(o => {
          o.UserId = parseInt(o.UserId)
        })
        dataFound(res, result.recordset);
      } else {
        noData(res, 'No Users Found');
      }
    } catch (e) {
      servError(e, res)
    }
  }

  const changePassword = async (req, res) => {
    const { oldPassword, newPassword, userId } = req.body;

    if (!oldPassword || !newPassword || !userId) {
      return invalidInput(res, 'oldPassword, newPassword, userId are required');
    }

    const checkPassword = `SELECT Password, UserName FROM tbl_Users WHERE UserId = @userId`;
    const request = new sql.Request().input('userId', userId);

    try {
      const result = await request.query(checkPassword);

      if (result.recordset[0] && result.recordset[0].Password === md5Hash(oldPassword)) {
        const UserName = result.recordset[0].UserName;
        const changePassword = new sql.Request();

        changePassword.input('Mode', 2);
        changePassword.input('UserName', UserName)
        changePassword.input('password', md5Hash(newPassword));

        const changePasswordResult = await changePassword.execute('Change_Paswword_SP');

        if (changePasswordResult.rowsAffected && changePasswordResult.rowsAffected[0] > 0) {
          success(res, 'Password Updated')
        } else {
          falied(res, 'Failed To Change Password')
        }

      } else {
        falied(res, 'Current password does not match');
      }
    } catch (e) {
      servError(e, res);
    }
  }

  const getAllUserDropdown = async (req, res) => {

    try {
      const result = await sql.query('SELECT UserId, Name FROM tbl_Users WHERE UDel_Flag = 0')
      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    }
    catch (e) {
      servError(e, res);
    }
  }

  const getEmployeeDropdown = async (req, res) => {

    try {
      const result = await sql.query('SELECT UserId, Name FROM tbl_Users WHERE UserTypeId = 3 AND UDel_Flag = 0')
      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    }
    catch (e) {
      servError(e, res);
    }

  }

  const getSalesPersonDropdown = async (req, res) => {

    try {
      const result = await sql.query('SELECT UserId, Name FROM tbl_Users WHERE UserTypeId = 6 AND UDel_Flag = 0')
      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    }
    catch (e) {
      servError(e, res);
    }

  }

  const getAllUserCompanyBasedDropdown = async (req, res) => {
    const { Company_id } = req.query;

    if (isNaN(Company_id)) {
      return invalidInput(res, 'Company_id is required')
    }

    try {
      const result = await sql.query(`SELECT UserId, Name FROM tbl_Users WHERE Company_Id = '${Company_id}' AND UDel_Flag = 0`)
      if (result.recordset.length > 0) {
        dataFound(res, result.recordset)
      } else {
        noData(res)
      }
    }
    catch (e) {
      servError(e, res);
    }
  }

  return {
    getUsers,
    postUser,
    editUser,
    deleteUser,
    userDropdown,
    employeeDropDown,
    seletUsersName,
    changePassword,
    getAllUserDropdown,
    getEmployeeDropdown,
    getAllUserCompanyBasedDropdown,
    getSalesPersonDropdown,
  }
}

module.exports = userMaster()
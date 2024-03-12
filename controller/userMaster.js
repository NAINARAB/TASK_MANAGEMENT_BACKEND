const sql = require("mssql");
const { storecall } = require("../config/store");
var CryptoJS = require("crypto-js");
const { invalidInput, servError, dataFound, noData } = require("./res");


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
    const { Name, UserName, UserTypeId, Password, BranchId } = req.body;

    if (!Name || !UserName || !UserTypeId || !Password || !BranchId) {
      return res.status(400).json({ success: false, message: 'Name, UserName, UserTypeId, Password and BranchId is required', data: [] });
    }

    try {
      const checkTable = await storecall(`SELECT UserId FROM tbl_Users WHERE UserName = '${UserName}'`)
      if (Array.isArray(checkTable) && checkTable.length > 0) {
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
    const { UserId, Name, UserName, UserTypeId, Password, BranchId } = req.body;

    const isMd5Hash = /^[a-fA-F0-9]{32}$/.test(Password);
    const passwordToUse = isMd5Hash ? Password : md5Hash(Password);

    if (!UserId || !Name || !UserName || !UserTypeId || !Password || !BranchId) {
      return res.status(400).json({ success: false, message: 'UserId, Name, UserName, UserTypeId, Password and BranchId is required', data: [] });
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

  const seletUsersName = async (req, res) => {
    const { AllUser, BranchId } = req.query;

    if (!AllUser || !BranchId) {
      return invalidInput(res, 'AllUser, BranchId is required');
    }

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

  return {
    getUsers,
    postUser,
    editUser,
    deleteUser,
    userDropdown,
    seletUsersName
  }
}

module.exports = userMaster()
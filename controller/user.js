const { isObject } = require("lodash");
const sql = require("mssql");
let { storecall } = require("../config/store");
const moment = require("moment");
var CryptoJS = require("crypto-js");
const { falied } = require("./res");


function md5Hash(input) {
  return CryptoJS.MD5(input).toString(CryptoJS.enc.Hex);
}

function dataFound(res, data, message) {
  return res.status(200).json({ data: data, message: message || 'Data Found', success: true });
}

function noData(res, message) {
  return res.status(200).json({ data: [], success: true, message: message || 'No data' })
}

function servError(e, res, message) {
  console.log(e);
  return res.status(500).json({ data: [], success: false, message: message || "Server error" })
}

function invalidInput(res, message) {
  return res.status(400).json({ data: [], success: false, message: message || 'Invalid request' })
}

const usercontroller = () => {

  // Raj code t

  const getPermission = async (req, res) => {
    try {
      let { UserId, MenuId, SubMenuId } = req.query;

      if (!UserId, !MenuId, !SubMenuId) {
        return res.status(400).json({ data: [], success: false, message: "UserId, MenuId, SubMenuId is required" });
      }

      const sq = `exec Qry_GetUserRights @UserId='${UserId}', @MenuId='${MenuId}', @SubMenuId='${SubMenuId}';`
      let r = await storecall(sq);
      if (Array.isArray(r)) {
        return res.status(200).json({ message: "View Assign Employee List sucessfully", data: r[0] })
      } else {
        return res.status(404).json({ message: "View Assign Employee List sucessfully", data: {} })
      }

    } catch (err) {
      return res.status(500).json({ message: err, data: {} })
    }
  }


  const getEmpProjects = async (req, res) => {
    const { FromDate, EmpId } = req.query;

    if (!FromDate || !EmpId) {
      return res.status(400).json({ data: [], success: false, message: 'FromDate, EmpId is required' });
    }

    try {

      const getTasksSP = new sql.Request();
      getTasksSP.input('Fromdate', FromDate);
      getTasksSP.input('Emp_Id', EmpId);

      const result = await getTasksSP.execute('Project_Search_By_Online_Emp_Id');

      if (result.recordset.length > 0) {
        return dataFound(res, result.recordset)
      } else {
        return noData(res)
      }
    } catch (e) {
      return servError(e, res);
    }
  }

  const getEmpTasks = async (req, res) => {
    const { FromDate, EmpId, Branch } = req.query;

    if (!FromDate || !EmpId || !Branch) {
      return res.status(400).json({ data: [], success: false, message: 'FromDate, EmpId, Branch is required' });
    }

    try {

      const getTasksSP = new sql.Request();
      getTasksSP.input('Fromdate', FromDate);
      getTasksSP.input('Emp_Id', EmpId);
      getTasksSP.input('Branch', Branch);

      const result = await getTasksSP.execute('Task_Search_By_Online_Emp_Id');

      if (result.recordset.length > 0) {
        return dataFound(res, result.recordset)
      } else {
        return noData(res)
      }

    } catch (e) {
      return servError(e, res);
    }
  }


  const authUser = async (req, res) => {
    const { AuthId } = req.query;

    if (!AuthId) {
      return invalidInput(res, 'Invalid Auth ID');
    }

    try {
      const result = await storecall(`SELECT * FROM tbl_Users WHERE Autheticate_Id = '${AuthId}'`);
      if (result?.length > 0) {
        return res.status(200).json({ isValidUser: true, message: 'valid Token', success: true });
      } else {
        return res.status(404).json({ isValidUser: false, message: 'invalid token', success: false });
      }
    } catch (e) {
      return servError(e, res)
    }
  }


  const login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ data: {}, success: false, message: 'Invalid username or password' })
    }
    console.log(username, md5Hash(password))

    try {

      const query = `
        SELECT
          u.UserTypeId,
          u.UserId,
          u.UserName,
          u.Password,
          u.BranchId,
          b.BranchName,
          u.Name,
          ut.UserType,
          u.Autheticate_Id,
          u.Company_id,
          c.Company_Name

        FROM tbl_Users AS u

        LEFT JOIN tbl_Branch_Master AS b
        ON b.BranchId = u.BranchId

        LEFT JOIN tbl_User_Type AS ut
        ON ut.Id = u.UserTypeId

        LEFT JOIN tbl_Company_Master AS c
        ON c.Company_id = u.Company_Id

        WHERE UserName = @UserName AND Password = @Password AND UDel_Flag= 0`;

      const loginReq = new sql.Request();
      loginReq.input('UserName', String(username).trim());
      loginReq.input('Password', md5Hash(password));

      const loginResult = await loginReq.query(query);


      // const loginSP = new sql.Request();
      // loginSP.input('UserName', username);
      // loginSP.input('Password', md5Hash(password));

      // const result = await loginSP.execute('Qry_GetUser');

      if (loginResult.recordset.length > 0) {
        const userInfo = loginResult.recordset[0];
        const ssid = `${Math.floor(100000 + Math.random() * 900000)}${moment().format('DD-MM-YYYY hh:mm:ss')}`;

        const sessionSP = new sql.Request();
        sessionSP.input('Id', 0);
        sessionSP.input('UserId', userInfo.UserId);
        sessionSP.input('SessionId', ssid);
        sessionSP.input('LogStatus', 1);
        sessionSP.input('APP_Type', 1);

        const sessionResult = await sessionSP.execute('UserLogSP');

        if (sessionResult.recordset.length === 1) {
          res.status(200).json({
            user: userInfo, sessionInfo: sessionResult.recordset[0], success: true, message: 'login Successfully'
          });
        }
      } else {
        res.status(400).json({ data: {}, success: false, message: 'Invalid username or password' });
      }
    } catch (e) {
      console.log(e)
      res.status(500).json({ data: {}, success: false, message: 'Internal Server Error' })
    }
  }

  const workstatus = async (req, res) => {
    try {
      const result = await storecall("exec Status_List");
      if (Array.isArray(result) && result?.length > 0) {
        return dataFound(res, result)
      } else {
        return noData(res, 'data not found');
      }
    } catch (e) {
      return servError(e, res, 'Internal Server Error')
    }
  };

  const getMenu = async (req, res) => {
    const { Auth } = req.query;

    if (!Auth) {
      return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'Invalid Auth', success: false });
    }

    try {
      const request = new sql.Request();
      request.input('Autheticate_Id', Auth)

      const result = await request.execute('User_Rights_Side');
      if (result.recordsets.length > 0) {
        return res.status(200).json({ MainMenu: result.recordsets[0], SubMenu: result.recordsets[1], message: 'no Data', success: true });
      } else {
        return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'no Data', success: true });
      }
    } catch (e) {
      console.log(e)
      return res.status(500).json({ MainMenu: [], SubMenu: [], message: 'Server Error', success: false });
    }
  }

  const getUserAuthorization = async (req, res) => {
    const { Auth } = req.query;

    if (!Auth) {
      return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'Invalid Auth', success: false });
    }

    try {
      const request = new sql.Request();
      request.input('Autheticate_Id', Auth)

      const result = await request.execute('User_Rights_Online');
      if (result.recordsets.length > 0) {
        return res.status(200).json({ MainMenu: result.recordsets[0], SubMenu: result.recordsets[1], message: 'no Data', success: true });
      } else {
        return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'no Data', success: true });
      }
    } catch (e) {
      console.log(e)
      return res.status(500).json({ MainMenu: [], SubMenu: [], message: 'Server Error', success: false });
    }
  }

  const getMenuByUserType = async (req, res) => {
    const { UserType } = req.query;

    if (!UserType) {
      return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'Invalid UserType', success: false });
    }

    try {
      const request = new sql.Request();
      request.input('UserTypeId', UserType)

      const result = await request.execute('User_Rights_By_User_Type');
      if (result.recordsets.length > 0) {
        return res.status(200).json({ MainMenu: result.recordsets[0], SubMenu: result.recordsets[1], message: 'no Data', success: true });
      } else {
        return res.status(400).json({ MainMenu: [], SubMenu: [], message: 'no Data', success: true });
      }
    } catch (e) {
      return res.status(500).json({ MainMenu: [], SubMenu: [], message: 'Server Error', success: false });
    }
  }


  const getTaskStatus = async (req, res) => {
    try {
      const result = await storecall("exec Status_List_NEW");
      if (Array.isArray(result) && result.length > 0) {
        return dataFound(res, result)
      } else {
        return noData(res)
      }
    } catch (e) {
      return servError(e, res)
    }
  }

  const modifyUserRights = async (req, res) => {
    const { MenuId, MenuType, User, ReadRights, AddRights, EditRights, DeleteRights, PrintRights } = req.body;

    try {
      const transaction = new sql.Transaction();

      await transaction.begin();

      const deleteQuery = `DELETE FROM tbl_User_Rights WHERE User_Id = @UserId AND Menu_Id = @MenuId AND Menu_Type = @MenuType`;
      await transaction.request()
        .input('UserId', User)
        .input('MenuId', MenuId)
        .input('MenuType', MenuType)
        .query(deleteQuery);

      const insertQuery = `INSERT INTO tbl_User_Rights (User_Id, Menu_Id, Menu_Type, Read_Rights, Add_Rights, Edit_Rights, Delete_Rights, Print_Rights) 
            VALUES (@UserId, @MenuId, @MenuType, @ReadRights, @AddRights, @EditRights, @DeleteRights, @PrintRights)`;
      const result = await transaction.request()
        .input('UserId', User)
        .input('MenuId', MenuId)
        .input('MenuType', MenuType)
        .input('ReadRights', ReadRights)
        .input('AddRights', AddRights)
        .input('EditRights', EditRights)
        .input('DeleteRights', DeleteRights)
        .input('PrintRights', PrintRights)
        .query(insertQuery);

      await transaction.commit();

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: 'Changes saved successfully.', success: true });
      } else {
        return res.status(400).json({ message: 'Failed to save changes.', success: false });
      }
    } catch (e) {
      await transaction.rollback();
      return servError(e, res)
    }
  }

  const modifyUserTypeRights = async (req, res) => {
    const { MenuId, MenuType, UserType, ReadRights, AddRights, EditRights, DeleteRights, PrintRights } = req.body;

    try {
      const transaction = new sql.Transaction();

      await transaction.begin();

      const deleteQuery = `DELETE FROM tbl_User_Type_Rights WHERE User_Type_Id = @UserTypeId AND Menu_Id = @MenuId AND Menu_Type = @MenuType`;
      await transaction.request()
        .input('UserTypeId', UserType)
        .input('MenuId', MenuId)
        .input('MenuType', MenuType)
        .query(deleteQuery);

      const insertQuery = `INSERT INTO tbl_User_Type_Rights (User_Type_Id, Menu_Id, Menu_Type, Read_Rights, Add_Rights, Edit_Rights, Delete_Rights, Print_Rights) 
          VALUES (@UserTypeId, @MenuId, @MenuType, @ReadRights, @AddRights, @EditRights, @DeleteRights, @PrintRights)`;
      const result = await transaction.request()
        .input('UserTypeId', UserType)
        .input('MenuId', MenuId)
        .input('MenuType', MenuType)
        .input('ReadRights', ReadRights)
        .input('AddRights', AddRights)
        .input('EditRights', EditRights)
        .input('DeleteRights', DeleteRights)
        .input('PrintRights', PrintRights)
        .query(insertQuery);

      await transaction.commit();

      if (result.rowsAffected[0] > 0) {
        return res.status(200).json({ message: 'Changes saved successfully.', success: true });
      } else {
        return res.status(400).json({ message: 'Failed to save changes.', success: false });
      }
    } catch (e) {
      await transaction.rollback();
      return servError(e, res)
    }
  }

  const projectInvolved = async (req, res) => {
    const { User_Id } = req.query;

    if (!User_Id) {
      return invalidInput(res, 'User_Id is required');
    }

    try {
      const request = new sql.Request();
      request.input('User_Id', User_Id);

      const result = await request.execute('Project_List')

      if (result.recordset.length > 0) {
        return dataFound(res, result.recordset)
      } else {
        return noData(res)
      }
    } catch (err) {
      return servError(e, res)
    }
  }


  //Raj code f






  const filterouttaskid = async (req, res) => {
    try {
      let r = await storecall("exec Task_List_Online_Filter");
      return res.status(200).send({
        message: "Filterout Taskid",
        data: r,
      });

    } catch (err) {
      return res.status(500).send(err)
    }

  };

  const filteroutempid = async (req, res) => {
    try {
      let r = await storecall("exec Users_List_Online_Filter");
      return res.status(200).send({
        message: "Filterout Emp_id",
        data: r,
      });

    } catch (err) {
      return res.status(500).send(err)

    }

  };





  const updatepassword = async (req, res) => {
    try {
      let data = req.body


      console.log(data.username, "////?????")
      let c,

        errorflag = true
      var bytes = CryptoJS.AES.decrypt(data.password, 'ly4@&gr$vnh905RyB>?%#@-(KSMT');
      var originalText = bytes.toString(CryptoJS.enc.Utf8);

      c = await storecall("exec Qry_GetUsers");
      console.log(originalText, ">>>>old pswd >>>>")

      for (let [key, val] of Object.entries(c)) {
        if (
          val.UserName == data.username &&
          val.Password == originalText
        ) {
          console.log(val);
          errorflag = false
          var bytes = CryptoJS.AES.decrypt(data.newpassword, 'ly4@&gr$vnh905RyB>?%#@-(KSMT');
          var restpswdoriginalText = bytes.toString(CryptoJS.enc.Utf8);

          // newpassword
          // return res.status(400).json({ message : "correct Uername or password" });
          console.log(restpswdoriginalText, "...new passwd")
          let r = await storecall(
            "exec Change_Paswword_SP @Mode='" +
            2 +
            "', @UserName='" +
            data.username +
            "', @Password='" +
            restpswdoriginalText +
            "';"
          );

          // console.log(r, "}}}}}}}}");
          return res.status(201).send({ message: "New Password created Sucessfully " })
        }
      } if (errorflag) {
        return res.status(400).json({ message: "Please Enter valid Old password" });
      }


    } catch (err) {
      res.status(500).json({ error: err });
    }
  };


  const notificationlist = async (req, res) => {
    let data = req.body
    if (data.unread == true) {
      try {
        let data = req.body
        let request = new sql.Request();
        let r = await request.query("exec Notification_List_By_Emp_Id @Emp_Id='" +
          data.emp_id +
          "';");
        res.status(200).send({ message: "View count and particular Notification", specificnotification: r.recordsets[0], count: r.recordsets[1] })
      } catch (err) {
        res.status(500).send(err)
      }
    } else {
      try {
        let data = req.body
        var request = new sql.Request();
        await storecall("exec Update_Notification_SP @Emp_Id='" +
          data.emp_id + "';");

        let r = await request.query("exec Notification_List_By_Emp_Id @Emp_Id='" +
          data.emp_id +
          "';");

        res.status(200).send({ message: "View Notification List", allnotification: r.recordsets[2] })

      } catch (err) {
        res.status(500).send(err)
      }
    }
  }

  const createnotification = async (req, res) => {
    try {
      let data = req.body;

      let r = await storecall("exec Create_Notification_SP @Title='" +
        data.tittle +
        "',@Desc_Note='" +
        data.description +
        "',@Emp_Id='" +
        data.emp_id +
        "';");

      console.log(typeof (r), "KKKKK")

      if (isObject(r)) {
        return res.status(401).send({ message: "Incorrect Syntax " })
      }
      return res.status(201).send({ message: "New Notification created sucesssfully", data: r })
      // let isArray = function(a){
      //   return (!!a) && (a.constructor === Array);
      // }
      console.log(isArray(r), "//////")

      // if(isArray(r)){
      //  return res.status(201).send({ message: "New Notification created sucesssfully", data: r })
      // }
      // else{
      //   return res.status(400).send({
      //     message: "Incorrect Syntax",
      //     data: r
      //   })
      //  }



    } catch (err) {
      res.status(500).json({ error: err })
    }

  }


  const projectreviewandfilter = async (req, res) => {

    try {
      let data = req.body
      var request = new sql.Request();

      let r = await request.query("exec Project_Review_Search @Branch='" +
        data.branch_id +
        "',@Fromdate='" +
        data.from_date +
        "',@Todate='" +
        data.to_date +
        "',@Task_Id='" +
        data.task_id +
        "',@Task_Type_Id='" +
        data.task_type_id +
        "',@Emp_Id='" +
        data.emp_id +
        "',@Project_Id='" +
        data.project_id +
        "',@Project_Head_Id='" +
        data.project_head_id +
        "',@Base_Group='" +
        data.base_group +
        "',@Status='" +
        data.status +
        "';");
      console.log(r, "/////????")
      let isArray = function (a) {
        return (!!a) && (a.constructor === Array);
      }
      console.log(isArray(r.recordsets), "//////")

      if (isArray(r.recordsets)) {
        return res.status(200).send({
          message: "Project Review list or filterout sucesssfull",
          // data:r.recordsets
          maintask: r.recordsets[1],
          subtask: r.recordsets[2],
          Employee: r.recordsets[3]
        })

      }
      else {
        return res.status(400).send({
          message: "Incorrect Syntax",
          data: r.recordsets
        })
      }




    } catch (err) {
      return res.status(500).send({ error: err })

    }




  }


  const projectreviewandfilteremployeebased = async (req, res) => {

    try {
      let data = req.body
      var request = new sql.Request();

      let r = await request.query("exec Project_Review_Search @Branch='" +
        data.branch_id +
        "',@Fromdate='" +
        data.from_date +
        "',@Todate='" +
        data.to_date +
        "',@Task_Id='" +
        data.task_id +
        "',@Task_Type_Id='" +
        data.task_type_id +
        "',@Emp_Id='" +
        data.emp_id +
        "',@Project_Id='" +
        data.project_id +
        "',@Project_Head_Id='" +
        data.project_head_id +
        "',@Base_Group='" +
        data.base_group +
        "',@Status='" +
        data.status +
        "';");
      console.log(r, "/////????")
      let Employee = r.recordsets[3]

      const groupedData = {};

      Employee.forEach(item => {
        const empName = item.Emp_Name;

        if (!groupedData[empName]) {
          groupedData[empName] = [];
        }

        const newItem = {
          Id: groupedData[empName].length + 1,
          Base_Group_Name: item.Base_Group_Name,
          Base_Type: item.Base_Type,
          Branch_Id: item.Branch_Id,
          Emp_Id: item.Emp_Id,
          Emp_Name: item.Emp_Name,
          End_Time: item.End_Time,
          Entry_By: item.Entry_By,
          Entry_Date: item.Entry_Date,
          Est_End_Dt: item.Est_End_Dt,
          Est_Start_Dt: item.Est_Start_Dt,
          Filter_Search_Task_Id: item.Filter_Search_Task_Id,
          Project_Head: item.Project_Head,
          Project_Id: item.Project_Id,
          Project_Name: item.Project_Name,
          Status_Work: item.Status_Work,
          Sub_Task: item.Sub_Task,
          Sub_Task_Desc: item.Sub_Task_Desc,
          Sub_Task_Id: item.Sub_Task_Id,
          Task_Desc: item.Task_Desc,
          Task_Id: item.Task_Id,
          Task_Name: item.Task_Name,
          Task_No: item.Task_No,
          Task_Stat_Id: item.Task_Stat_Id,
          Task_Type: item.Task_Type,
          UserName: item.UserName
        };

        groupedData[empName].push(newItem);
      });
      console.log(groupedData, "groupedData==")

      const employees = Object.keys(groupedData).map(empName => {
        console.log(empName, ":::::::")
        return {
          Employee: empName,
          Emp_id: groupedData[empName][0].Emp_Id,
          Details: groupedData[empName]
        };
      });

      console.log(employees);



      let isArray = function (a) {
        return (!!a) && (a.constructor === Array);
      }
      console.log(isArray(r.recordsets), "//////")

      if (isArray(r.recordsets)) {
        return res.status(200).send({
          message: "Project Review list or filterout sucesssfull",
          data: employees
          //   maintask: r.recordsets[1],
          //   subtask: r.recordsets[2],
          //   Employee: r.recordsets[3]
        })

      }
      else {
        return res.status(400).send({
          message: "Incorrect Syntax",
          data: r.recordsets
        })
      }




    } catch (err) {
      return res.status(500).send({ error: err })

    }




  }


  const postLocation = async (req, res) => {
    const { Emp_Id, Latitude, Logitude, Web_URL } = req.body;

    if (!Emp_Id || !Latitude || !Logitude || !Web_URL) {
      return invalidInput(res, 'Emp_Id, Latitude, Logitude, Web_URL is required')
    }

    try {
      const postQuery = `
      INSERT INTO tbl_Tacking_Test 
        (Emp_Id, W_Date, Latitude, Logitude, Web_URL) 
      VALUES 
        (@emp, @date, @latitude, @longitude, @url)`

      const request = new sql.Request()
      request.input('emp', Emp_Id)
      request.input('date', new Date())
      request.input('latitude', Latitude)
      request.input('longitude', Logitude)
      request.input('url', Web_URL)

      const result = await request.query(postQuery);

      if (result && result.rowsAffected && result.rowsAffected[0] > 0) {
        dataFound(res, [], "Location Noted")
      } else {
        falied(res, 'Failed to Save Location')
      }
    } catch (e) {
      servError(e, res)
    }
  }

  const getLocationByEmpAndDate = async (req, res) => {
    const { Emp_Id, W_Date } = req.query;

    if (!Number(Emp_Id) || !W_Date) {
      return invalidInput(res, 'Emp_Id, W_Date is required')
    }

    try {

      const query = `
      SELECT 
	    	* 
	    FROM 
	    	tbl_Tacking_Test
	    WHERE 
	    	W_Date >= @start
	    	AND 
	    	W_Date <= @end
	    	AND 
	    	Emp_Id = 1`

      const request = new sql.Request()

      request.input('emp', Emp_Id)
      request.input('start', new Date(W_Date).toISOString().split('T')[0] + ' 00:00:00.000')
      request.input('end', new Date(W_Date).toISOString().split('T')[0] + ' 23:59:59.999')

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




  return {
    updatepassword,

    filterouttaskid,
    filteroutempid,
    notificationlist,

    createnotification,
    projectreviewandfilter,
    projectreviewandfilteremployeebased,


    // raj code 
    login,
    workstatus,
    projectInvolved,
    getTaskStatus,

    getPermission,

    getEmpProjects,
    getEmpTasks,

    authUser,
    getMenu,
    getUserAuthorization,
    getMenuByUserType,

    modifyUserRights,
    modifyUserTypeRights,
    postLocation,
    getLocationByEmpAndDate,
  };
};

module.exports = usercontroller();

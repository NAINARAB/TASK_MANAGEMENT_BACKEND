const { falied, invalidInput, servError } = require('../res');

const sql = require('mssql')

const dbconnect = async (req, res, next) => {
  const Db = req.get('Db');
  
  if (!Db) {
    return invalidInput(res, 'Db-ID is required')
  }
  
  let config = {
    driver: "SQL Server",
    stream: false,
    options: {
      trustedConnection: true,
      trustServerCertificate: true,
      enableArithAbort: true,
      requestTimeout: 60000,
    }
  };

  try {
    const fetchDbdata = new sql.Request();
    fetchDbdata.input('Id', sql.Int, Db);

    const result = await fetchDbdata.execute('Company_List_By_Id')

    if (result.recordset[0]) {
      config.server = result.recordset[0].IP_Address;
      config.database = result.recordset[0].SQL_DB_Name;
      config.user = result.recordset[0].SQL_User_Name;
      config.password = result.recordset[0].SQL_Pass;
      config.Tally_Company_Id = result.recordset[0].Tally_Company_Id;
      config.Tally_Guid = result.recordset[0].Tally_Guid;
      const DYNAMICDB = new sql.ConnectionPool(config);

      try {
        await DYNAMICDB.connect();
        req.db = DYNAMICDB;
        req.dbID = Db;
        req.config = config;
        next();
      } catch (e) {
        return servError(e, res, 'Db connection Failed')
      }

    } else {
      return falied(res, 'Invalid Db Id');
    }

  } catch (e) {
    servError(e, res, 'Db connection Failed');
  }
};

module.exports =  dbconnect
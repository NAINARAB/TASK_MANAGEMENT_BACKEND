const sql = require("mssql");


const storecall = async (callsp) => {
  try {
    const request = new sql.Request();
    const r = await request.query(callsp);
    return r.recordset;
  } catch (error) {
    console.log(error, "Internal server error mooooo");
    return error
  }
};



module.exports = { storecall };

var sql = require("mssql");

const config = {
  server: "103.235.104.114",
  database: "SMT_SUDEEKHA",
  driver: "SQL Server",
  user: "SMT_USER",
  password: "z6F@d6k31",
  stream: false,
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
};

sql.connect(config, function (err) {
  if (err) {
    console.log(err);
  } else {
    console.log("connected Sucessfully -----");  
  }
});
 
module.exports.config;

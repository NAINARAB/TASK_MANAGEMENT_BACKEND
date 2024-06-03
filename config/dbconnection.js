const sql = require("mssql");
require('dotenv').config();

// const config = {
//   server: "103.235.104.114",
//   database: "SMT_SUDEEKHA",
//   driver: "SQL Server",
//   user: "SMT_USER",
//   password: "z6F@d6k31",
//   stream: false,
//   options: {
//     trustedConnection: true,
//     trustServerCertificate: true,
//     requestTimeout: 60000,
//   },
// };

// const config = {
//   server: "103.235.104.114",
//   database: "SMT_TASK_TEST",
//   driver: "SQL Server",
//   user: "task_admin",
//   password: "3fE26%c1g",
//   stream: false,
//   options: {
//     trustedConnection: true,
//     trustServerCertificate: true,
//     requestTimeout: 60000,
//   },
// };

const config = {
  server: process.env.SERVER,
  database: process.env.DATABASE,
  driver: "SQL Server",
  user: process.env.USER,
  password: process.env.PASSWORD,
  stream: false,
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
    requestTimeout: 60000,
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

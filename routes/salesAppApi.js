const express = require('express');
const SARouter = express.Router();


const SalesPersonAttendance = require('../controller/salesAppApis/attendance')


SARouter.get('/SaleApp/myAttendanceHistory', SalesPersonAttendance.getSalesPersonAttendance)
SARouter.get('/SaleApp/salesPersons', SalesPersonAttendance.getSalesPersonDropDown)



module.exports = SARouter;
const express = require('express');
const TallyReports = express.Router();


const QPayReport = require('../controller/TallyReports/qPayReport');



TallyReports.get('/TallyReports/qPay', QPayReport.getQpayData);




module.exports = TallyReports;
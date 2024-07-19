const express = require('express');
const TallyReports = express.Router();


const QPayReport = require('../controller/TallyReports/qPayReport');
const dbconnect = require('../controller/erp/otherDB');



TallyReports.get('/TallyReports/qPay', QPayReport.getQpayData);
TallyReports.get('/TallyReports/productBased', dbconnect, QPayReport.productBasedSalesDetails);

TallyReports.get('/TallyReports/qpay/columnVisiblity', QPayReport.getQPayColumns)
TallyReports.post('/TallyReports/qpay/columnVisiblity', QPayReport.postColumnVisiblity)

TallyReports.get('/TallyReports/qPay/salesTransaction', QPayReport.getSalesData)




module.exports = TallyReports;
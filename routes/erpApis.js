const express = require('express');
const ERPRouter = express.Router();


const CustomerMaster = require('../controller/erp/customerMaster');
const userMaster = require('../controller/userMaster');
const company = require('../controller/company');
const SOA = require('../controller/erp/SOA');
const dbconnect = require('../controller/erp/otherDB')


// Customers
ERPRouter.get('/customer', CustomerMaster.getCustomer);
ERPRouter.post('/customer', CustomerMaster.postCustomer);
ERPRouter.put('/customer', CustomerMaster.editCustomer);
ERPRouter.get('/isCustomer', CustomerMaster.isCustomer);

// Users
ERPRouter.get('/user/employee/dropdown', userMaster.getEmployeeDropdown);
ERPRouter.get('/user/allUser/dropdown', userMaster.getAllUserDropdown);
ERPRouter.get('/user/salesPerson/dropdown', userMaster.getSalesPersonDropdown);
ERPRouter.get('/user/CompanyBased/dropdown', userMaster.getAllUserCompanyBasedDropdown);

// Company Authorize
ERPRouter.get('/company/companysAccess', company.getMYCompanyAccess);
ERPRouter.post('/company/companysAccess', company.postCompanyAccess);

// customerAPIs

ERPRouter.get('/getBalance', SOA.getBalance);
ERPRouter.get('/StatementOfAccound', SOA.StatementOfAccound);
ERPRouter.get('/paymentInvoiceList', SOA.paymentInvoiceList);
ERPRouter.get('/invoiceDetails', SOA.invoiceDetails);
ERPRouter.get('/customerSalesReport', SOA.customerSalesReport);


// stock Report

ERPRouter.get('/stockReport', dbconnect, SOA.stockReport)

// purchase Report

ERPRouter.get('/PurchaseOrderReportCard', dbconnect, SOA.purchaseReport)


module.exports = ERPRouter;
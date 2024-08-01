const express = require('express');
const ERPRouter = express.Router();


const CustomerMaster = require('../controller/erp/customerMaster');
const userMaster = require('../controller/userMaster');
const company = require('../controller/company');
const SOA = require('../controller/erp/SOA');
const EmployeeController = require('../controller/erp/employee')
const dbconnect = require('../controller/erp/otherDB');
const dbconnectDBidPass = require('../controller/erp/otherDBidPass');
const { manualPayment, PaymentHistory, manualPaymentVerification } = require('../controller/erp/payment');
const driverActivities = require('../controller/erp/driverActivities')
const GodownActivity = require('../controller/erp/godownActivity');
const DeliveryActivity = require('../controller/erp/deliveryActivity');
const StaffActivity = require('../controller/erp/staffActivity');
const { MachineOuternControll, getMachineOuternController } = require('../controller/erp/machineOutrn');
const { getInwardActivity, InwardActivityControll } = require('../controller/erp/inwardActivity');
const WGCheckController = require('../controller/erp/WGCheckActivity');
const dataEntryAttendance = require('../controller/erp/dataEntryAttendance');
const ReportTemplate = require('../controller/erp/reportTemplate');
// const getImagesMiddleware = require('../controller/erp/fileHandling/getImagesMiddleware');


// Customers
ERPRouter.get('/customer', CustomerMaster.getCustomer);
ERPRouter.post('/customer', CustomerMaster.postCustomer);
ERPRouter.put('/customer', CustomerMaster.editCustomer);
ERPRouter.get('/isCustomer', CustomerMaster.isCustomer);
ERPRouter.get('/BankDetails', CustomerMaster.BankDetails);

// Users
ERPRouter.get('/user/employee/dropdown', userMaster.getEmployeeDropdown);
ERPRouter.get('/user/allUser/dropdown', userMaster.getAllUserDropdown);
ERPRouter.get('/user/salesPerson/dropdown', userMaster.getSalesPersonDropdown);
ERPRouter.get('/user/CompanyBased/dropdown', userMaster.getAllUserCompanyBasedDropdown);

// Company Authorize
ERPRouter.get('/company/companysAccess', company.getMYCompanyAccess);
ERPRouter.post('/company/companysAccess', company.postCompanyAccess);

// Employee Master

ERPRouter.get('/emp-designation', EmployeeController.emp_designation);
ERPRouter.get('/employee', EmployeeController.employeeGet);
ERPRouter.post('/employee', EmployeeController.employeePost);
ERPRouter.put('/employee', EmployeeController.employeePut);



// customerAPIs
ERPRouter.get('/getBalance', SOA.getBalance);
ERPRouter.get('/StatementOfAccound', SOA.StatementOfAccound);
ERPRouter.get('/paymentInvoiceList', SOA.paymentInvoiceList);
ERPRouter.get('/invoiceDetails', SOA.invoiceDetails);
ERPRouter.get('/customerSalesReport', SOA.customerSalesReport);
ERPRouter.get('/salesInfo', SOA.salesInfo);


// stock Report
ERPRouter.get('/stockReport', dbconnect, SOA.stockReport);
ERPRouter.get('/tally-test-api', SOA.externalAPI);




// purchase Report
ERPRouter.get('/PurchaseOrderReportCard', dbconnect, SOA.purchaseReport);



// payment apis
ERPRouter.get('/PaymentHistory', PaymentHistory);
ERPRouter.post('/manualPayment', manualPayment);
ERPRouter.post('/manualPaymentVerification', manualPaymentVerification);



// Driver Activities
ERPRouter.get('/driverActivities', driverActivities.optimizedQuery);
ERPRouter.get('/driverActivities/view2', driverActivities.newDriverActivity);
ERPRouter.get('/driverActivities/tripBased', driverActivities.TripBasedReport);
ERPRouter.get('/driverActivities/timeBased', driverActivities.timeBasedReport);
ERPRouter.get('/driverActivities/drivers', driverActivities.getDrivers);
ERPRouter.post('/driverActivities', driverActivities.addDriverActivities);
ERPRouter.put('/driverActivities', driverActivities.editDriverActivity);


// Godown Activities
ERPRouter.get('/godownActivities', GodownActivity.getGodownActivity)
ERPRouter.get('/godownActivities/abstract', GodownActivity.getGodownAbstract)
ERPRouter.post('/godownActivities', GodownActivity.postGWActivity)
ERPRouter.put('/godownActivities', GodownActivity.updateGWActivity)


// Delivery Activities
ERPRouter.get('/deliveryActivities', DeliveryActivity.getDeliveryReport)
ERPRouter.get('/deliveryActivities/abstract', DeliveryActivity.getLastDelivery)
ERPRouter.post('/deliveryActivities', DeliveryActivity.addDeliveryReport)
ERPRouter.put('/deliveryActivities', DeliveryActivity.updateDeliveryActivity)


// Staff Activities
ERPRouter.get('/staffActivities', StaffActivity.getStaffActivityNew)
ERPRouter.get('/staffActivities/staffBased', StaffActivity.getStaffBasedNew);
ERPRouter.get('/staffActivities/staffs', StaffActivity.getUniqueStaff)
ERPRouter.post('/staffActivities', StaffActivity.postStaffActivity)
ERPRouter.put('/staffActivities', StaffActivity.editStaffActivity)


// Machine Outern Activities
ERPRouter.get('/machineOutern', getMachineOuternController)
ERPRouter.post('/machineOutern', MachineOuternControll)


// Inward Activity
ERPRouter.get('/inwardActivity', getInwardActivity)
ERPRouter.post('/inwardActivity', InwardActivityControll)


// Weight Check Activity
ERPRouter.get('/weightCheckActivity/getStaffs', WGCheckController.getStaffs)
ERPRouter.get('/weightCheckActivity/getItems', WGCheckController.getItems)
ERPRouter.get('/weightCheckActivity', WGCheckController.getWGChecking)
ERPRouter.post('/weightCheckActivity', WGCheckController.addWGCheckActivity)
ERPRouter.put('/weightCheckActivity', WGCheckController.editWGCheckActivity)


// Data Entry Attendance
ERPRouter.get('/dataEntryAttendance', dataEntryAttendance.getAttendanceNew)
ERPRouter.post('/dataEntryAttendance', dataEntryAttendance.insertAttendance)
ERPRouter.put('/dataEntryAttendance', dataEntryAttendance.updateAttendance)


ERPRouter.get('/reportTablesAndColumns', ReportTemplate.getTablesandColumnsForReport);

ERPRouter.get('/reportTemplate', ReportTemplate.getTemplates);
ERPRouter.post('/reportTemplate/executeQuery', dbconnect, ReportTemplate.executeTemplateSQL);
ERPRouter.post('/reportTemplate', ReportTemplate.insertTemplate);
ERPRouter.put('/reportTemplate', ReportTemplate.updateTemplate);
ERPRouter.delete('/reportTemplate', ReportTemplate.deleteTemplate);




module.exports = ERPRouter;
const express = require('express');
const ERPRouter = express.Router();


const CustomerMaster = require('../controller/erp/customerMaster');


// Customers
ERPRouter.get('/customer', CustomerMaster.getCustomer);
ERPRouter.post('/customer', CustomerMaster.postCustomer);
ERPRouter.put('/customer', CustomerMaster.editCustomer);
ERPRouter.get('/isCustomer', CustomerMaster.isCustomer);

module.exports = ERPRouter;
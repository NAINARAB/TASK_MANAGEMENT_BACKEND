
const sql = require('mssql');
const { invalidInput, dataFound, noData, servError } = require('../res');

const CustomerAPIs = () => {

    // CusReportRoute.get('/api/getBalance', );

    const getBalance = async (req, res) => {
        const { UserId } = req.query;

        try {
            if (!UserId) {
                return res.status(400).json({ data: [], status: 'Failure', message: 'UserId is required', isCustomer: false });
            }

            const getCustDetails = `SELECT Cust_Id FROM tbl_Customer_Master WHERE User_Mgt_Id = '${UserId}'`;
            const result = await sql.query(getCustDetails);

            if (result.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Not Found', isCustomer: false });
            }

            const Cust_Id = result.recordset[0].Cust_Id;

            const GetCustDetails = new sql.Request();
            GetCustDetails.input('Cust_Id', Cust_Id);

            const CustInfo = await GetCustDetails.execute('Customer_Deatils_By_Cust_Id');

            if (CustInfo.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Details Not Found', isCustomer: true });
            }

            const recordsetArray = await Promise.all(CustInfo.recordset.map(async (obj) => {
                const GetBalance = new sql.Request();
                GetBalance.input('Cust_Id', Cust_Id);
                GetBalance.input('Cust_Details_Id', obj.Cust_Details_Id);

                try {
                    const ResData = await GetBalance.execute('Online_OS_Debtors_Reort_VW');
                    return ResData.recordset;
                } catch (e) {
                    console.error(e);
                    res.status(422).json({ data: [], status: 'Failure', message: '', isCustomer: true });
                    throw e;
                }
            }));

            const flattenedArray = recordsetArray.flat();

            res.status(200).json({ data: flattenedArray, status: 'Success', message: '', isCustomer: true });
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'Internal Server Error', status: 'Failure', data: [] });
        }
    }

    // CusReportRoute.get('/api/StatementOfAccound', )

    const StatementOfAccound = async (req, res) => {
        const { Cust_Id, Acc_Id, Company_Id, Fromdate, Todate } = req.query;

        if ((!Cust_Id) || (!Acc_Id) || (!Company_Id) || (!Fromdate) || (!Todate)) {
            return res.status(400).json({ status: 'Failure', message: 'Cust_Id, Acc_Id, Company_Id, Fromdate, Todate are Required', data: [] });
        }

        const GetStatement = new sql.Request();
        GetStatement.input('Cust_Id', Cust_Id);
        GetStatement.input('Acc_Id', Acc_Id);
        GetStatement.input('Company_Id', Company_Id);
        GetStatement.input('Fromdate', Fromdate);
        GetStatement.input('Todate', Todate);

        try {
            const ResData = await GetStatement.execute('Online_Statement_Of_Accounts_VW');
            if (ResData && ResData.recordset.length > 0) {
                res.status(200).json({ data: ResData.recordset, status: 'Success', message: 'Found' })
            } else {
                res.status(200).json({ data: [], status: 'Success', message: 'No Rows Selected' })
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'Internal Server Error', status: 'Failure', data: [] });
        }
    }

    // CusReportRoute.get('/api/paymentInvoiceList', );

    const paymentInvoiceList = async (req, res) => {
        const { UserId } = req.query;

        try {
            if (!UserId) {
                return res.status(400).json({ status: 'Failure', message: 'UserId is required', data: [], isCustomer: false });
            }

            const getCustDetails = `SELECT Cust_Id FROM tbl_Customer_Master WHERE User_Mgt_Id = '${UserId}'`;
            const result = await sql.query(getCustDetails);

            if (result.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Not Found', isCustomer: false });
            }

            const Cust_Id = result.recordset[0].Cust_Id;

            const GetCustDetails = new sql.Request();
            GetCustDetails.input('Cust_Id', Cust_Id);
            const CustInfo = await GetCustDetails.execute('Customer_Deatils_By_Cust_Id');

            if (CustInfo.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Details Not Found', isCustomer: true });
            }

            const recordsetArray = await Promise.all(CustInfo.recordset.map(async (obj) => {
                const getPaymentDetails = new sql.Request();
                getPaymentDetails.input('Cust_Id', obj.Cust_Id);
                getPaymentDetails.input('Acc_Id', obj.Customer_Ledger_Id);
                getPaymentDetails.input('Company_Id', obj.Company_Id);

                try {
                    const ResData = await getPaymentDetails.execute('Online_Payment_Invoice_List');
                    return ResData.recordset;
                } catch (e) {
                    console.error(e);
                    return [];
                }
            }));

            const flattenedArray = recordsetArray.flat();
            res.status(200).json({ data: flattenedArray, status: 'Success', message: '', isCustomer: true });

        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'Internal Server Error', status: 'Failure', data: [], isCustomer: true });
        }
    }

    // CusReportRoute.get('/api/invoiceDetails', );

    const invoiceDetails = async (req, res) => {
        const { Company_Id, UserId, Invoice_No } = req.query;

        if (!Company_Id || !UserId || !Invoice_No) {
            return res.status(400).json({ data: [], status: "Failure", message: '' });
        }

        try {
            const getCustDetails = `SELECT Cust_Id FROM tbl_Customer_Master WHERE User_Mgt_Id = '${UserId}'`;
            const result = await sql.query(getCustDetails);

            if (result.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Not Found', isCustomer: false });
            }

            const Cust_Id = result.recordset[0].Cust_Id;
            // console.log(Cust_Id)

            const request = new sql.Request();
            request.input('Cust_Id', Cust_Id);
            request.input('Company_Id', Company_Id);
            request.input('Invoice_No', Invoice_No);

            const invoiceResult = await request.execute('Online_Sales_Print');

            if (invoiceResult.recordsets) {
                res.status(200).json({ data: invoiceResult.recordsets, status: 'Success', message: 'data found' })
            } else {
                res.status(200).json({ data: [], status: 'Success', message: 'No data' })
            }

        } catch (e) {
            console.error(e);
            res.status(500).json({ data: [], status: "Failure", message: "Server error" })
        }
    }

    // CusReportRoute.get('/api/customerSalesReport', );

    const customerSalesReport = async (req, res) => {
        const { UserId } = req.query;

        try {
            if (!UserId) {
                return res.status(400).json({ data: [], status: 'Failure', message: 'UserId is required', isCustomer: false });
            }

            const getCustDetails = `SELECT Cust_Id FROM tbl_Customer_Master WHERE User_Mgt_Id = '${UserId}'`;
            const result = await sql.query(getCustDetails);

            if (result.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Not Found', isCustomer: false });
            }

            const Cust_Id = result.recordset[0].Cust_Id;

            const GetCustDetails = new sql.Request();
            GetCustDetails.input('Cust_Id', Cust_Id);

            const CustInfo = await GetCustDetails.execute('Customer_Deatils_By_Cust_Id');

            if (CustInfo.recordset.length === 0) {
                return res.status(404).json({ data: [], status: 'Failure', message: 'Customer Details Not Found', isCustomer: true });
            }

            const recordsetArray = await Promise.all(CustInfo.recordset.map(async (obj) => {
                const GetBalance = new sql.Request();
                GetBalance.input('Cust_Id', Cust_Id);
                GetBalance.input('Cust_Details_Id', obj.Cust_Details_Id);

                try {
                    const ResData = await GetBalance.execute('Online_Sales_Reort_VW');
                    return ResData.recordset;
                } catch (e) {
                    console.error(e);
                    return { error: e };
                }
            }));

            const hasError = recordsetArray.some(item => item.error);

            if (hasError) {
                return res.status(422).json({ data: [], status: 'Failure', message: '', isCustomer: true });
            }

            const flattenedArray = recordsetArray.flat();

            res.status(200).json({ data: flattenedArray, status: 'Success', message: '', isCustomer: true });
        } catch (e) {
            console.log(e);
            res.status(500).json({ message: 'Internal Server Error', status: 'Failure', data: [], isCustomer: false });
        }
    }

    // CusReportRoute.get('/api/salesInfo', )

    const salesInfo = async (req, res) => {
        const { Cust_Id, Acc_Id, Company_Id } = req.query;

        if (!Cust_Id || !Acc_Id || !Company_Id) {
            return res.status(400).json({ data: [], status: "Failure", message: 'Cust_Id, Acc_Id, Company_Id is require' });

        }

        try {
            const request = new sql.Request();
            request.input('Cust_Id', Cust_Id);
            request.input('Acc_Id', Acc_Id)
            request.input('Company_Id', Company_Id);

            const result = await request.execute('Online_Sales_Statement');

            if (result.recordset.length) {
                res.status(200).json({ data: result.recordset, status: 'Success', message: 'data found' })
            } else {
                res.status(200).json({ data: [], status: 'Success', message: 'No data' })
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ data: [], status: "Failure", message: "Server error" })
        }
    }

    // losRoute.get('/api/stockReport', dbconnect, authenticateToken, )

    const stockReport = async (req, res) => {
        const { ReportDate } = req.query;
        const guid = req.config.Tally_Guid;
        const company_id = req.config.Tally_Company_Id;

        if (!ReportDate) {
            return invalidInput(res, 'Report Date is Required')
        }

        try {
            const DynamicDB = new sql.Request(req.db);
            DynamicDB.input('guid', guid);
            DynamicDB.input('Company_Id', company_id.toString());
            DynamicDB.input('Fromdate', ReportDate);

            const StockReport = await DynamicDB.execute('Stouck_Abstract_Oinline_Search_New');

            if (StockReport && StockReport.recordset.length > 0) {
                StockReport.recordset.map(obj => {
                    obj.product_details = JSON.parse(obj.product_details)
                })
                return dataFound(res, StockReport.recordset)
            } else {
                return noData(res)
            }
        } catch (e) {
            servError(e, res)
        } finally {
            req.db.close()
        }
    }

    // purchaseOrederReport.get('/api/PurchaseOrderReportCard', dbconnect, authenticateToken, )

    const purchaseReport = async (req, res) => {
        try {
            const { Report_Type, Fromdate, Todate } = req.query;
            const guid = req.config.Tally_Guid;
    
            const DynamicDB = new sql.Request(req.db);
            DynamicDB.input('Report_Type', Report_Type);
            DynamicDB.input('Guid', guid);
            DynamicDB.input('Fromdate', Fromdate)
            DynamicDB.input('Todate', Todate);
    
            const result = await DynamicDB.execute('Purchase_Order_Online_Report');
            if (Number(Report_Type) !== 3) {
                result.recordset.map(obj => {
                    obj.product_details = JSON.parse(obj.product_details)
                    obj.product_details.map(o => {
                        o.product_details_1 = JSON.parse(o.product_details_1)
                    })
                })
            } else {
                result.recordset.map(o => {
                    o.Order_details = JSON.parse(o.Order_details)
                })
            }
            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const salesReport = async (req, res) => {
        const { Fromdate, Todate } = req.query;
        try {
    
            const DynamicDB = new sql.Request(req.db)
                .input('Fromdate', Fromdate)
                .input('To_date', Todate)
                .execute('Avg_Live_Sales_Report')
    
            const result = await DynamicDB;

            if (result.recordsets[0].length > 0 && result.recordsets[1].length > 0) {
                dataFound(res, result.recordsets[1], 'dataFound', { ledgerDetails: result.recordsets[0] })
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const porductBasedSalesResult = async (req, res) => {
        const { Fromdate, Todate } = req.query;

        try {
    
            const DynamicDB = new sql.Request(req.db)
                .input('Fromdate', Fromdate)
                .input('To_date', Todate)
                .execute('Avg_Live_Sales_Report_1')
    
            const result = await DynamicDB;
            if (result.recordsets[0].length > 0) {
                dataFound(res, result.recordsets[0], 'dataFound', {LOSAbstract: result.recordsets[1]})
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }


    const externalAPI = async (req, res) => {
        try {
            const { Fromdate, Todate } = req.query;

            if (!Fromdate, !Todate) {
                return invalidInput(res, 'Fromdate, Todate is required')
            }
    
            const DynamicDB = new sql.Request();
            DynamicDB.input('Company_Id', 5);
            DynamicDB.input('Vouche_Id', 0);
            DynamicDB.input('Fromdate', Fromdate)
            DynamicDB.input('Todate', Todate);
    
            const result = await DynamicDB.execute('Online_Sales_API');
            if (result.recordset.length > 0) {
                const sales = JSON.parse(result.recordset[0]?.SALES)
                dataFound(res, sales)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }



    return {
        getBalance,
        StatementOfAccound,
        paymentInvoiceList,
        invoiceDetails,
        customerSalesReport,
        salesInfo,
        stockReport,
        purchaseReport,
        salesReport,
        porductBasedSalesResult,
        externalAPI,
    }
}

module.exports = CustomerAPIs()

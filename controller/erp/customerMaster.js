const sql = require('mssql')
const crypto = require('crypto');
const { servError, dataFound, noData, invalidInput, falied, success } = require('../res');

function md5Hash(input) {
    return crypto.createHash('md5').update(input).digest('hex');
}

const CustomerMaster = () => {

    const getCustomer = async (req, res) => {
        try {
            const customerGet = `
                SELECT 
                    cus.*, 
                    u.Name AS NameGet, 
                    ut.UserType AS UserTypeGet, 
                    e.Name AS EnteyByGet, 
                    case when cus1.Customer_name is null then 'Primary' else cus1.Customer_name end as underGet
                FROM tbl_Customer_Master AS cus 
                JOIN tbl_Users as u
                    ON cus.User_Mgt_Id = u.UserId
                JOIN tbl_User_Type as ut
                    ON cus.User_Type_Id = ut.Id
                JOIN tbl_Users as e
                    ON cus.Entry_By = e.UserId
                LEFT JOIN tbl_Customer_Master cus1
                    ON cus.Under_Id = cus1.Cust_Id
                ORDER BY cus.Customer_name ASC`;
    
            const result = await sql.query(customerGet)
            if (result && result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postCustomer = async (req, res) => {
        const { data } = req.body;
        const md5Password = md5Hash('123456');
    
        if (!data || typeof data !== 'object') {
            return invalidInput(res, 'data is required');
        }
    
        try {
    
            if (data.Gstin) {
                const queryCheckGstin = `
                SELECT 
                    COUNT(*) AS count 
                FROM 
                    tbl_Customer_Master 
                WHERE 
                    Gstin = '${data?.Gstin}'`;
                const GstResult = await sql.query(queryCheckGstin);
    
                if (GstResult.recordset[0].count > 0) {
                    return falied(res, 'Gstin is Already Exists');
                }
            }
    
    
            const checkmobile = `SELECT UserName from tbl_Users WHERE UserName = '${data?.Mobile_no}' AND UDel_Flag = 0`;
            const checkResult = await sql.query(checkmobile);
    
            if (checkResult.recordset.length > 0) {
                return falied(res, 'Mobile Number Already Exists');
            }
    
            const newuser = new sql.Request();
            newuser.input('Mode', 1);
            newuser.input('UserId', 0);
            newuser.input('Name', data.Customer_name);
            newuser.input('UserName', data.Mobile_no);
            newuser.input('UserTypeId', data.User_Type_Id);
            newuser.input('Password', md5Password);
            newuser.input('BranchId', 0);
            newuser.input('Company_Id', 0);
    
            const result = await newuser.execute('UsersSP');
    
            if (result.recordset.length > 0) {
                const createdUserId = result.recordset[0][''];
    
                const getMaxCustIdQuery = 'SELECT ISNULL(MAX(Cust_Id), 0) + 1 AS NextCustId FROM tbl_Customer_Master';
                const maxCustIdResult = await sql.query(getMaxCustIdQuery);
                const nextCustId = maxCustIdResult.recordset[0].NextCustId;
    
    
                let zeros;
                if (createdUserId < 10) {
                    zeros = '000';
                } else if (createdUserId < 100) {
                    zeros = '00';
                } else if (createdUserId < 1000) {
                    zeros = '0';
                }
                const Cust_No = data.Branch_Id + zeros + nextCustId
    
                const newCustomer = new sql.Request();
    
                const insertCustomer = `INSERT INTO tbl_Customer_Master 
                        (Cust_Id, Cust_No, Customer_name, Contact_Person, Mobile_no, Email_Id, Address1, 
                        Address2, Address3, Address4, Pincode, State, Country, Gstin, Under_Id, User_Mgt_Id, 
                        User_Type_Id, Entry_By, Entry_Date)
                        VALUES 
                        (@Cust_Id, @Cust_No, @Customer_name, @Contact_Person, @Mobile_no, @Email_Id, @Address1, 
                        @Address2, @Address3, @Address4, @Pincode, @State, @Country, @Gstin, @Under_Id, @User_Mgt_Id, @User_Type_Id, 
                        @Entry_By, GETDATE())`;
    
    
                newCustomer.input('Cust_Id', nextCustId);
                newCustomer.input('Cust_No', Cust_No);
                newCustomer.input('Customer_name', data.Customer_name);
                newCustomer.input('Contact_Person', data.Contact_Person);
                newCustomer.input('Mobile_no', data.Mobile_no);
                newCustomer.input('Email_Id', data.Email_Id);
                newCustomer.input('Address1', data.Address1);
                newCustomer.input('Address2', data.Address2);
                newCustomer.input('Address3', data.Address3);
                newCustomer.input('Address4', data.Address4);
                newCustomer.input('Pincode', data.Pincode);
                newCustomer.input('State', data.State);
                newCustomer.input('Country', data.Country);
                newCustomer.input('Gstin', data.Gstin);
                newCustomer.input('Under_Id', data.Under_Id);
                newCustomer.input('User_Mgt_Id', createdUserId);
                newCustomer.input('User_Type_Id', data.User_Type_Id);
                newCustomer.input('Entry_By', data.Entry_By);
    
                const cuctomerCreateResult = await newCustomer.query(insertCustomer);
                if (cuctomerCreateResult.rowsAffected[0] > 0) {
                    success(res, 'Customer created successfully');
                } else {
                    falied(res, 'Customer Creation Failed')
                }
            } else {
                falied(res, 'User Creation Failed');
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const editCustomer = async (req, res) => {
        const { data } = req.body;
    
        if (!data || typeof data !== 'object') {
            return invalidInput(res, 'data is required');
        }
    
        try {
            
            if (data.Gstin) {
                const queryCheckGstin = `
                SELECT 
                    COUNT(*) AS count 
                FROM 
                    tbl_Customer_Master 
                WHERE 
                    Gstin = '${data?.Gstin}' 
                    AND 
                    Cust_Id != '${data?.Cust_Id}'`;
    
                const GstResult = await sql.query(queryCheckGstin);
                
                if (GstResult.recordset[0].count > 0) {
                    return falied(res, 'Gstin is Already Exists');
                }
    
            }
    
            const checkmobile = `
            SELECT 
                UserName 
            FROM 
                tbl_Users 
            WHERE 
                UserName = '${data?.Mobile_no}' AND 
                UDel_Flag = 0 AND 
                UserId != '${data.User_Mgt_Id}'`;
            const checkResult = await sql.query(checkmobile);
    
            if (checkResult.recordset.length > 0) {
                return falied(res, 'Mobile Number Already Exists');
            }
    
            const selectPassword = `SELECT Password from tbl_Users WHERE UserId = '${data.User_Mgt_Id}'`;
            const passwordResult = await sql.query(selectPassword);
            const Password = passwordResult.recordset[0].Password;
    
            const newuser = new sql.Request();
            newuser.input('Mode', 2);
            newuser.input('UserId', data.User_Mgt_Id);
            newuser.input('Name', data.Customer_name);
            newuser.input('UserName', data.Mobile_no);
            newuser.input('UserTypeId', data.User_Type_Id);
            newuser.input('Password', Password);
            newuser.input('BranchId', 0);
            newuser.input('Company_Id', 0);

    
            const result = await newuser.execute('UsersSP');
    
            if (result.recordset.length > 0) {
    
                const updateCustomerQuery = `
                    UPDATE tbl_Customer_Master 
                    SET 
                        Customer_name = @Customer_name,
                        Mobile_no = @Mobile_no,
                        User_Type_Id = @UserTypeId,
                        Contact_Person = @Contact_Person,
                        Email_Id = @Email_Id,
                        Gstin = @Gstin,
                        Under_Id = @UnderId,
                        Pincode = @Pincode,
                        State = @State,
                        Address1 = @Address1,
                        Address2 = @Address2,
                        Address3 = @Address3,
                        Address4 = @Address4
                    WHERE Cust_Id = @Cust_Id`;
    
                const newCustomer = new sql.Request();
                newCustomer.input('Customer_name', data.Customer_name);
                newCustomer.input('Mobile_no', data.Mobile_no);
                newCustomer.input('UserTypeId', data.User_Type_Id);
                newCustomer.input('Contact_Person', data.Contact_Person);
                newCustomer.input('Email_Id', data.Email_Id);
                newCustomer.input('Gstin', data.Gstin);
                newCustomer.input('UnderId', data.Under_Id);
                newCustomer.input('Pincode', data.Pincode);
                newCustomer.input('State', data.State);
                newCustomer.input('Address1', data.Address1);
                newCustomer.input('Address2', data.Address2);
                newCustomer.input('Address3', data.Address3);
                newCustomer.input('Address4', data.Address4);
                newCustomer.input('Cust_Id', data.Cust_Id);
    
                const cuctomerUpdateResult = await newCustomer.query(updateCustomerQuery);
                if (cuctomerUpdateResult.rowsAffected[0] > 0) {
                    success(res, 'Changes Saved');
                } else {
                    falied(res, 'Failed to Save');
                }
    
            } else {
                falied(res, 'User Update Failed');
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const isCustomer = async (req, res) => {
        const { UserId } = req.query;

        try {
            if (!UserId) {
                return invalidInput(res, 'UserId is Required');
            }
    
            const checkCustomer = `SELECT Cust_Id FROM tbl_Customer_Master WHERE User_Mgt_Id = '${UserId}'`;
            const result = await sql.query(checkCustomer);
    
            if (result.recordset.length === 0) {
                res.status(200).json({ data: [], success: false, message: 'Not a Customer', isCustomer: false });
            } else {
                res.status(200).json({ data: result.recordset, success: true, message: 'Customer Found', isCustomer: true });
            }
    
        } catch (e) {
            servError(e, res);
        }
    }


    return {
        getCustomer,
        postCustomer,
        editCustomer,
        isCustomer,
    }
}

module.exports = CustomerMaster()
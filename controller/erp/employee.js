const sql = require('mssql')
const crypto = require('crypto');
const { dataFound, noData, servError, invalidInput, falied, success } = require('../res');

function md5Hash(input) {
    return crypto.createHash('md5').update(input).digest('hex');
}

const EmployeeController = () => {

    const emp_designation = async (req, res) => {
        try {
            const selectDesignation = `select Designation_Id as id, Designation from tbl_Employee_Designation where Designation_Id != 0`
            const result = await sql.query(selectDesignation);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const employeeGet = async (req, res) => {
        try {
            const getEmp = `
            SELECT 
                e.*, 
                d.Designation AS Designation_Name, 
                b.BranchName, 
                u.Name AS CreaterName
            FROM 
                tbl_Employee_Master AS e
            JOIN 
                tbl_Employee_Designation as d
                ON e.Designation = d.Designation_Id
            JOIN 
                tbl_Users as u
                ON e.Entry_By = u.UserId
            JOIN 
                tbl_Branch_Master as b
                ON e.Branch = b.BranchId
            ORDER BY 
                e.Emp_Id`;

            const result = await sql.query(getEmp);

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const employeePost = async (req, res) => {
        const { data } = req.body;
        let userId = '';
        let empcode = '';
        let zeros = 0;
        let maxId = 0;
        let Company_id;

        try {
            const getBranchCode = new sql.Request().input('branch', data?.branch).query(`SELECT BranchCode, Company_id FROM tbl_Branch_Master WHERE BranchId = @branch`);
            const branchResult = await getBranchCode;

            if (branchResult.recordset.length > 0) {
                empcode = branchResult.recordset[0]?.BranchCode;
                Company_id = branchResult.recordset[0]?.Company_id;
            } else {
                return invalidInput(res, 'Branch not Found')
            }

            const checkResult = new sql.Request().input('mobile', data.mobile).query(`SELECT UserName FROM tbl_Users WHERE UserName = @mobile AND UDel_Flag = 0`);

            if ((await checkResult).recordset.length > 0) {
                return invalidInput(res, 'Mobile or UserName is Already Exists')
            }

            const result = await sql.query('SELECT COALESCE(MAX(Emp_Id), 0) AS MaxValue FROM tbl_Employee_Master');
            maxId = result.recordset[0]['MaxValue'] != 0 ? parseInt(result.recordset[0]['MaxValue']) + 1 : 1;

            if (maxId < 10) {
                zeros = '000';
            } else if (maxId < 100) {
                zeros = '00';
            } else if (maxId < 1000) {
                zeros = '0';
            }

            const transaction = new sql.Transaction();

            try {
                await transaction.begin();

                const newuser = new sql.Request(transaction);
                newuser.input('Mode', 1);
                newuser.input('UserId', 0);
                newuser.input('Name', data.empname);
                newuser.input('UserName', data.mobile);
                newuser.input('UserTypeId', 3);
                newuser.input('Password', md5Hash('123456'));
                newuser.input('BranchId', parseInt(data.branch));
                newuser.input('Company_Id', data?.Company_id)

                const userCreation = await newuser.execute('UsersSP');

                if (userCreation.recordset[0]['']) {
                    userId = userCreation.recordset[0][''];
                } else {
                    await transaction.rollback();
                    return falied(res, 'Error while Creating User');
                }

                const empCreation = new sql.Request(transaction)
                    .input('Emp_Id', maxId)
                    .input('Branch', data.branch)
                    .input('Emp_Code', `${empcode}${zeros}${maxId}`)
                    .input('Emp_Name', data.empname)
                    .input('Designation', data.designation)
                    .input('DOB', data.dob ? new Date(data.dob) : new Date())
                    .input('DOJ', data.doj ? new Date(data.doj) : new Date())
                    .input('Address_1', data.address1)
                    .input('Address_2', data.address2)
                    .input('City', data.city)
                    .input('Country', 'India')
                    .input('Pincode', data.pincode)
                    .input('Mobile_No', data.mobile)
                    .input('Education', data.education)
                    .input('Fathers_Name', data.father)
                    .input('Mothers_Name', data.mother)
                    .input('Spouse_Name', data.spouse)
                    .input('Sex', data.gender)
                    .input('Emp_Religion', data.religion)
                    .input('Salary', data.salary)
                    .input('Total_Loan', data.total_loan)
                    .input('Salary_Advance', data.salary_advance)
                    .input('Due_Loan', data.due_loan)
                    .input('User_Mgt_Id', userId)
                    .input('Entry_By', data.enter_by)
                    .query(
                        `
                    INSERT INTO tbl_Employee_Master
                        (
                            Emp_Id, Branch, Emp_Code, Emp_Name, Designation, DOB, DOJ, Address_1, Address_2, City,
                            Country, Pincode, Mobile_No, Education, Fathers_Name, Mothers_Name, Spouse_Name,
                            Sex, Emp_Religion, Salary, Total_Loan, Salary_Advance, Due_Loan, User_Mgt_Id, Entry_By, Entry_Date
                        )
                    VALUES
                        (
                            @Emp_Id, @Branch, @Emp_Code, @Emp_Name, @Designation, @DOB, @DOJ, @Address_1, @Address_2, @City,
                            @Country, @Pincode, @Mobile_No, @Education, @Fathers_Name, @Mothers_Name, @Spouse_Name,
                            @Sex, @Emp_Religion, @Salary, @Total_Loan, @Salary_Advance, @Due_Loan, @User_Mgt_Id, @Entry_By, GETDATE()
                        ) `
                    )


                if ((await empCreation).rowsAffected[0] > 0) {
                    await transaction.commit();
                    return success(res, 'New Employee Created')
                } else {
                    await transaction.rollback();
                    return falied(res, 'Employee Creation Failed')
                }
            } catch (ee) {
                await transaction.rollback();
                return servError(ee, res)
            }


        } catch (e) {
            servError(e, res);
        }
    }

    const employeePut = async (req, res) => {
        const { data, ID } = req.body;
        const dob = data.dob ? data.dob : null;
        const doj = data.doj ? data.doj : null;
        let zeros = '';
        let empcode = '';
        let Company_id = '';

        try {
            const getBranchCode = new sql.Request().input('branch', data?.branch).query(`SELECT BranchCode, Company_id FROM tbl_Branch_Master WHERE BranchId = @branch`);
            const branchResult = await getBranchCode;

            if (branchResult.recordset.length > 0) {
                empcode = branchResult.recordset[0]?.BranchCode;
                Company_id = branchResult.recordset[0]?.Company_id;
            } else {
                return invalidInput(res, 'Branch not Found')
            }

            const checkResult = new sql.Request()
                .input('mobile', data.mobile)
                .input('empId', data?.user_manage_id)
                .query(`SELECT UserName FROM tbl_Users WHERE UserName = @mobile AND UDel_Flag = 0 AND UserId != @empId`);

            if ((await checkResult).recordset.length > 0) {
                return invalidInput(res, 'Mobile or UserName is Already Exists')
            }

            if (ID < 10) {
                zeros = '000';
            } else if (ID < 100) {
                zeros = '00';
            } else if (ID < 1000) {
                zeros = '0';
            }

            const transaction = new sql.Transaction();

            try {
                await transaction.begin();

                const newuser = new sql.Request(transaction);
                newuser.input('Mode', 2);
                newuser.input('UserId', data?.user_manage_id);
                newuser.input('Name', data.empname);
                newuser.input('UserName', data.mobile);
                newuser.input('UserTypeId', 3);
                newuser.input('Password', md5Hash('123456'));
                newuser.input('BranchId', parseInt(data?.branch));
                newuser.input('Company_Id', Company_id)

                const userCreation = await newuser.execute('UsersSP');

                if (userCreation.recordset.length > 0) {

                    const queryPUT = `
                        UPDATE 
                            tbl_Employee_Master 
                        SET 
                            Branch = @Branch,
                            Emp_Name = @Emp_Name,
                            Designation = @Designation,
                            ${dob ? `DOB = CONVERT(DATE, @DOB),` : 'GETDATE(),'}
                            ${doj ? `DOJ = CONVERT(DATE, @DOJ),` : 'GETDATE(),'}  
                            Address_1 = @Address_1, 
                            Address_2 = @Address_2, 
                            City = @City, 
                            Pincode = @Pincode,
                            Mobile_No = @Mobile_No, 
                            Education = @Education, 
                            Fathers_Name = @Father_Name, 
                            Mothers_Name = @Mother_Name,
                            Spouse_Name = @Spouse_Name, 
                            Sex = @Sex, 
                            Emp_Religion = @Emp_Religion, 
                            Salary = @Salary,
                            Entry_By = @Entry_By
                        WHERE 
                            Emp_Id = @Emp_Id`;

                    const empUpdate = new sql.Request(transaction)
                        .input('Emp_Id', ID)
                        .input('Branch', data?.branch)
                        .input('Emp_Code', `${empcode}${zeros}${ID}`)
                        .input('Emp_Name', data.empname)
                        .input('Designation', data.designation)
                        .input('DOB', data.dob ? new Date(data.dob) : new Date())
                        .input('DOJ', data.doj ? new Date(data.doj) : new Date())
                        .input('Address_1', data.address1)
                        .input('Address_2', data.address2)
                        .input('City', data.city)
                        .input('Pincode', data.pincode)
                        .input('Mobile_No', data.mobile)
                        .input('Education', data.education)
                        .input('Father_Name', data.father)
                        .input('Mother_Name', data.mother)
                        .input('Spouse_Name', data.spouse)
                        .input('Sex', data.gender)
                        .input('Emp_Religion', data.religion)
                        .input('Salary', data.salary)
                        .input('Entry_By', data.enter_by)
                        .query(queryPUT)

                    if ((await empUpdate).rowsAffected[0] > 0) {
                        await transaction.commit();
                        return success(res, 'Changes Saved')
                    } else {
                        await transaction.rollback();
                        return falied(res, 'Failed to save in user')
                    }
                } else {
                    await transaction.rollback();
                    return falied(res, 'Error while Creating User');
                }

            } catch (ee) {
                await transaction.rollback();
                return servError(ee, res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    return {
        emp_designation,
        employeeGet,
        employeePost,
        employeePut,
    }
}


module.exports = EmployeeController();
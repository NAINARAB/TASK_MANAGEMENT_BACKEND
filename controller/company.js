const sql = require("mssql");
let { storecall } = require("../config/store");
const resFun = require('./res')


const companyControl = () => {

    const getCompanyDrowDown = async (req, res) => {
        const query = `SELECT Company_id AS ID, Company_Name AS Name FROM tbl_Company_Master WHERE Del_Flag = 0`;
        try {
            const result = await storecall(query);
            if (Array.isArray(result)) {
                return resFun.dataFound(res, result);
            } else {
                return resFun.noData(res)
            }
        } catch (e) {
            resFun.servError(e, res)
        }
    }

    const getCompany = async (req, res) => {
        const { User_Id, Company_id } = req.query;

        try {
            const request = new sql.Request();
            request.input('User_Id', User_Id)
            request.input('Company_id', Company_id);
            request.input('Company_name', "");

            const result = await request.execute('Company_Vw');

            if (result.recordset.length > 0) {
                return res.json({ success: true, message: 'data found', data: result.recordset });
            } else {
                return res.json({ success: true, message: 'data not found, User_Id, Company_id is required', data: [] });
            }

        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: 'Internal Server Error', data: [] })
        }
    }

    const postCompany = async (req, res) => {
        const { Company_Code, Company_Name, Company_Address, State, Region, Pincode, Country, VAT_TIN_Number, PAN_Number, CST_Number, CIN_Number,
            Service_Tax_Number, MSME_Number, NSIC_Number, Account_Number, IFC_Code, Bank_Branch_Name, Bank_Name, Telephone_Number,
            Support_Number, Mail, Website, Gst_number, State_Code, State_No, Entry_By } = req.body;

        try {
            const request = new sql.Request();
            request.input('Mode', 1);
            request.input('Company_id', 0);
            request.input('Company_Code', Company_Code || null);
            request.input('Company_Name', Company_Name || null);
            request.input('Company_Address', Company_Address || null);
            request.input('State', State || null);
            request.input('Region', Region || null);
            request.input('Pincode', Pincode || null);
            request.input('Country', Country || null);
            request.input('VAT_TIN_Number', VAT_TIN_Number || null);
            request.input('PAN_Number', PAN_Number || null);
            request.input('CST_Number', CST_Number || null);
            request.input('CIN_Number', CIN_Number || null);
            request.input('Service_Tax_Number', Service_Tax_Number || null);
            request.input('MSME_Number', MSME_Number || null);
            request.input('NSIC_Number', NSIC_Number || null);
            request.input('Account_Number', Account_Number || null);
            request.input('IFC_Code', IFC_Code || null);
            request.input('Bank_Branch_Name', Bank_Branch_Name || null);
            request.input('Bank_Name', Bank_Name || null);
            request.input('Telephone_Number', Telephone_Number || null);
            request.input('Support_Number', Support_Number || null);
            request.input('Mail', Mail || null);
            request.input('Website', Website || null);
            request.input('Gst_number', Gst_number || null);
            request.input('State_Code', State_Code || null);
            request.input('State_No', State_No || null);
            request.input('Entry_By', Entry_By || null);

            const result = await request.execute('Company_SP');

            if (result.rowsAffected.length > 0) {
                res.status(200).json({ success: true, message: 'Company added successfully', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to add company', data: [] });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
    };

    const putCompany = async (req, res) => {
        const { Company_id, Company_Code, Company_Name, Company_Address, State, Region, Pincode, Country, VAT_TIN_Number, PAN_Number, CST_Number, CIN_Number,
            Service_Tax_Number, MSME_Number, NSIC_Number, Account_Number, IFC_Code, Bank_Branch_Name, Bank_Name, Telephone_Number,
            Support_Number, Mail, Website, Gst_number, State_Code, State_No, Entry_By } = req.body;

        if (!Company_id) {
            return resFun.invalidInput(res, 'Company_id is required');
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 2);
            request.input('Company_id', Company_id);
            request.input('Company_Code', Company_Code || null);
            request.input('Company_Name', Company_Name || null);
            request.input('Company_Address', Company_Address || null);
            request.input('State', State || null);
            request.input('Region', Region || null);
            request.input('Pincode', Pincode || null);
            request.input('Country', Country || null);
            request.input('VAT_TIN_Number', VAT_TIN_Number || null);
            request.input('PAN_Number', PAN_Number || null);
            request.input('CST_Number', CST_Number || null);
            request.input('CIN_Number', CIN_Number || null);
            request.input('Service_Tax_Number', Service_Tax_Number || null);
            request.input('MSME_Number', MSME_Number || null);
            request.input('NSIC_Number', NSIC_Number || null);
            request.input('Account_Number', Account_Number || null);
            request.input('IFC_Code', IFC_Code || null);
            request.input('Bank_Branch_Name', Bank_Branch_Name || null);
            request.input('Bank_Name', Bank_Name || null);
            request.input('Telephone_Number', Telephone_Number || null);
            request.input('Support_Number', Support_Number || null);
            request.input('Mail', Mail || null);
            request.input('Website', Website || null);
            request.input('Gst_number', Gst_number || null);
            request.input('State_Code', State_Code || null);
            request.input('State_No', State_No || null);
            request.input('Entry_By', Entry_By || null);

            const result = await request.execute('Company_SP');

            if (result.rowsAffected.length > 0) {
                res.status(200).json({ success: true, message: 'Changes Saved', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to save company', data: [] });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
    };

    const deleteCompany = async (req, res) => {
        const { Company_id } = req.body;

        if (!Company_id) {
            return res.status(400).json({ success: false, message: 'Invalid data' });
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 3);
            request.input('Company_id', Company_id);
            request.input('Company_Code', 0);
            request.input('Company_Name', 0);
            request.input('Company_Address', 0);
            request.input('State', 0);
            request.input('Region', 0);
            request.input('Pincode', 0);
            request.input('Country', 0);
            request.input('VAT_TIN_Number', 0);
            request.input('PAN_Number', 0);
            request.input('CST_Number', 0);
            request.input('CIN_Number', 0);
            request.input('Service_Tax_Number', 0);
            request.input('MSME_Number', 0);
            request.input('NSIC_Number', 0);
            request.input('Account_Number', 0);
            request.input('IFC_Code', 0);
            request.input('Bank_Branch_Name', 0);
            request.input('Bank_Name', 0);
            request.input('Telephone_Number', 0);
            request.input('Support_Number', 0);
            request.input('Mail', 0);
            request.input('Website', 0);
            request.input('Gst_number', 0);
            request.input('State_Code', 0);
            request.input('State_No', 0);
            request.input('Entry_By', 0);

            const result = await request.execute('Company_SP');

            if (result.rowsAffected.length > 0) {
                res.status(200).json({ success: true, message: 'Company deleted', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to delete company', data: [] });
            }
        } catch (e) {
            console.error(e);
            res.status(500).json({ success: false, message: 'Internal server error', data: [] });
        }
    }



    return {
        getCompanyDrowDown,
        getCompany,
        postCompany,
        putCompany,
        deleteCompany
    }
}



module.exports = companyControl()
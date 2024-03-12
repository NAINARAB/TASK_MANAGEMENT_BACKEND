const sql = require("mssql");

function dataFound(res, data, message) {
    return res.status(200).json({ data: data, message: message || 'Data Found', success: true });
}

function noData(res, message) {
    return res.status(200).json({ data: [], success: true, message: message || 'No data' })
}

function falied(res, message) {
    return res.status(400).json({ data: [], message: message || 'Something Went Wrong! Please Try Again', success: false })
}

function servError(e, res, message) {
    console.log(e);
    return res.status(500).json({ data: [], success: false, message: message || "Server error" })
}

function invalidInput(res, message) {
    return res.status(400).json({ data: [], success: false, message: message || 'Invalid request' })
}



const branchController = () => {

    const getBranchDrowDown = async (req, res) => {
        const { User_Id, Company_id } = req.query;

        if (!User_Id || !Company_id) {
            return res.status(400).json({ data: [], success: false, message: 'User_Id, Company_id are required' });
        }

        try {
            const request = new sql.Request();
            request.input('User_Id', User_Id);
            request.input('Company_id', Company_id);
            const result = await request.execute('Branch_List');

            if (result.recordset.length > 0) {
                res.status(200).json({ data: result.recordset, success: true, message: 'data found' });
            } else {
                res.status(200).json({ data: [], success: false, message: 'data not available' });
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ data: [], success: false, message: 'Internal error' });
        }
    }

    const getBranch = async (req, res) => {
        const { User_Id, Company_id } = req.query;

        if (!User_Id || !Company_id) {
            return res.status(400).json({ data: [], success: false, message: 'User_Id, Company_id are required' });
        }

        try {
            const request = new sql.Request();
            request.input('User_Id', User_Id);
            request.input('Company_id', Company_id);
            request.input('Branch_Name', "");
            const result = await request.execute('BranchMaster_vw');

            if (result.recordset.length > 0) {
                res.status(200).json({ data: result.recordset, success: true, message: 'Row data available' });
            } else {
                res.status(200).json({ data: [], success: false, message: 'Row data not available' });
            }
        } catch (e) {
            console.log(e);
            res.status(500).json({ data: [], success: false, message: 'Internal error' });
        }
    };

    const postBranch = async (req, res) => {
        const { Company_id, BranchCode, BranchName, Tele_Code, BranchTel1, Tele1_Code, BranchTel,
            BranchAddress, E_Mail, BranchIncharge, BranchIncMobile, BranchCity, Pin_Code, State, BranchCountry, Entry_By } = req.body;

        if (!BranchName || !Company_id) {
            return res.status(400).json({ data: [], success: false, message: 'Invalid data' })
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 1);
            request.input('BranchId', 0);
            request.input('Company_id', Company_id);
            request.input('BranchCode', BranchCode);
            request.input('BranchName', BranchName);
            request.input('Tele_Code', Tele_Code);
            request.input('BranchTel1', BranchTel1);
            request.input('Tele1_Code', Tele1_Code);
            request.input('BranchTel', BranchTel);
            request.input('BranchAddress', BranchAddress);
            request.input('E_Mail', E_Mail);
            request.input('BranchIncharge', BranchIncharge);
            request.input('BranchIncMobile', BranchIncMobile);
            request.input('BranchCity', BranchCity);
            request.input('Pin_Code', Pin_Code);
            request.input('State', State);
            request.input('BranchCountry', BranchCountry);
            request.input('Entry_By', Entry_By);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                res.status(200).json({ success: true, message: 'Branch created successfully', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to create branch', data: [] });
            }
        } catch (e) {
            console.error(e)
            return res.status(500).json({ success: false, message: 'Internal Server Error', data: [] });
        }
    }

    const putBranch = async (req, res) => {
        const { BranchId, Company_id, BranchCode, BranchName, Tele_Code, BranchTel1, Tele1_Code, BranchTel,
            BranchAddress, E_Mail, BranchIncharge, BranchIncMobile, BranchCity, Pin_Code, State, BranchCountry, Entry_By } = req.body;

        if (!BranchName || !Company_id || !BranchId) {
            return res.status(400).json({ data: [], success: false, message: 'BranchName, BranchId, Company_id is required' })
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 2);
            request.input('BranchId', BranchId);
            request.input('Company_id', Company_id);
            request.input('BranchCode', BranchCode);
            request.input('BranchName', BranchName);
            request.input('Tele_Code', Tele_Code);
            request.input('BranchTel1', BranchTel1);
            request.input('Tele1_Code', Tele1_Code);
            request.input('BranchTel', BranchTel);
            request.input('BranchAddress', BranchAddress);
            request.input('E_Mail', E_Mail);
            request.input('BranchIncharge', BranchIncharge);
            request.input('BranchIncMobile', BranchIncMobile);
            request.input('BranchCity', BranchCity);
            request.input('Pin_Code', Pin_Code);
            request.input('State', State);
            request.input('BranchCountry', BranchCountry);
            request.input('Entry_By', Entry_By);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                res.status(200).json({ success: true, message: 'Branch updated successfully', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to update branch', data: [] });
            }
        } catch (e) {
            console.error(e)
            return res.status(500).json({ success: false, message: 'Internal Server Error', data: [] });
        }
    }

    const deleteBranch = async (req, res) => {
        const { BranchID } = req.body;

        if (!BranchID) {
            return res.status(400).json({ data: [], success: false, message: 'BranchID is required' })
        }

        try {
            const request = new sql.Request();
            request.input('Mode', 3);
            request.input('BranchId', BranchID);
            request.input('Company_id', 0);
            request.input('BranchCode', 0);
            request.input('BranchName', 0);
            request.input('Tele_Code', 0);
            request.input('BranchTel1', 0);
            request.input('Tele1_Code', 0);
            request.input('BranchTel', 0);
            request.input('BranchAddress', 0);
            request.input('E_Mail', 0);
            request.input('BranchIncharge', 0);
            request.input('BranchIncMobile', 0);
            request.input('BranchCity', 0);
            request.input('Pin_Code', 0);
            request.input('State', 0);
            request.input('BranchCountry', 0);
            request.input('Entry_By', 0);

            const result = await request.execute('Branch_Master_SP');

            if (result.rowsAffected[0] > 0) {
                res.status(200).json({ success: true, message: 'Branch deleted', data: [] });
            } else {
                res.status(400).json({ success: false, message: 'Failed to delete branch', data: [] });
            }
        } catch (e) {
            console.error(e)
            return res.status(500).json({ success: false, message: 'Internal Server Error', data: [] })
        }
    }

    return {
        getBranchDrowDown,
        getBranch,
        postBranch,
        putBranch,
        deleteBranch,
    }
}

module.exports = branchController();
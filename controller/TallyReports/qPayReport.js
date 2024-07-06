const sql = require("mssql");
const { servError, falied, checkIsNumber, invalidInput, dataFound, noData } = require('../res');


const QPayReport = () => {

    const getQpayData = async (req, res) => {
        const { Company_Id, Consolidate } = req.query;

        if (!checkIsNumber(Company_Id)) {
            return invalidInput(res, 'Company_Id is required');
        }

        try {

            const request = new sql.Request()
                .input('Company_Id', Company_Id)
                .input('Consolidate', Consolidate)
                .execute('Q_Pay_Online_Report_VW')
            
            const result = await request;

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res);
        }
    }


    return {
        getQpayData,
    }

}

module.exports = QPayReport();
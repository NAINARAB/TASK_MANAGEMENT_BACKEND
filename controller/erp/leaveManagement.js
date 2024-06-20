const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput } = require('../res')

const LeaveManagement = () => {

    const getLeaveDays = async (req, res) => {
        const { Fromdate, Todate } = req.query;

        try {
            const request = new sql.Request()
                .input('Fromdate', Fromdate)
                .input('Todate', Todate)
                .query(`
                    SELECT 
                        DISTINCT CONVERT(DATE, LeaveDate),
                        Id,
                        LeaveInfo,
                        CreatedBy,
                        CreatedAt
                    FROM
                        tbl_Leave_Master
                    WHERE
                        CONVERT(DATE, LeaveDate) >= CONVERT(DATE, @Fromdate)
                        AND
                        CONVERT(DATE, LeaveDate) <= CONVERT(DATE, @Todate) 
                    `)

            const result = await request;

            if (result.recordset.length) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    // const addLeaveDays = async (req, res) => {
    //     const { }
    // }



    return {
        getLeaveDays,
    }
}

module.exports = LeaveManagement()
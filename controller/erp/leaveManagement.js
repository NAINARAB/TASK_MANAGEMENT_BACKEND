const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput, checkIsNumber } = require('../res')

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

    const addLeaveDays = async (req, res) => {
        const { LeaveDate, LeaveInfo, CreatedBy } = req.body;

        if (!LeaveDate || !LeaveInfo || !checkIsNumber(CreatedBy)) {
            return invalidInput(res, 'LeaveDate, LeaveInfo, CreatedBy is required')
        }

        try {

            const checkAlreadyExists = new sql.Request()
                .input('LeaveDate', LeaveDate)
                .query(`SELECT COUNT(*) AS LeaveDay FROM tbl_Leave_Master WHERE CONVERT(DATE, LeaveDate) = CONVERT(DATE, @LeaveDate)`)

            const checkResult = await checkAlreadyExists;

            if (checkResult.recordset[0].LeaveDay > 0) {
                return success(res, 'Already exists')
            }

            const request = new sql.Request()
                .input('LeaveDate', LeaveDate)
                .input('LeaveInfo', LeaveInfo)
                .input('CreatedBy', CreatedBy)
                .query(`
                    INSERT INTO tbl_Leave_Master 
                        (LeaveDate, LeaveInfo, CreatedBy)
                    VALUES
                        (@LeaveDate, @LeaveInfo, @CreatedBy)`)

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Leave day added')
            } else {
                falied(res)
            }

        } catch (e) {
            servError(e, res)
        }
    }

    const editLeaveDays = async (req, res) => {
        const { Id, LeaveDate, LeaveInfo, CreatedBy } = req.body;

        if (!checkIsNumber(Id) || !LeaveDate || !LeaveInfo || !checkIsNumber(CreatedBy)) {
            return invalidInput(res, 'Id, LeaveDate, LeaveInfo, CreatedBy is required')
        }

        try {
            const checkAlreadyExists = new sql.Request()
                .input('LeaveDate', LeaveDate)
                .input('Id', Id)
                .query(`
                    SELECT 
                        COUNT(*) AS LeaveDay 
                    FROM 
                        tbl_Leave_Master 
                    WHERE 
                        CONVERT(DATE, LeaveDate) = CONVERT(DATE, @LeaveDate)
                        AND
                        Id != @Id`)
            
            const checkResult = await checkAlreadyExists;

            if (checkResult.recordset[0].LeaveDay > 0) {
                return success(res, 'Leave day already exists')
            }

            const request = new sql.Request()
                .input('Id', Id)
                .input('LeaveDate', LeaveDate)
                .input('LeaveInfo', LeaveInfo)
                .input('CreatedBy', CreatedBy)
                .query(`
                    UPDATE
                        tbl_Leave_Master
                    SET
                        LeaveDate = @LeaveDate,
                        LeaveInfo = @LeaveInfo,
                        CreatedBy = @CreatedBy
                    WHERE
                        Id = @Id
                    `)
            
            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved')
            } else {
                falied(res)
            }
                    
        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getLeaveDays,
        addLeaveDays,
        editLeaveDays,
    }
}

module.exports = LeaveManagement()
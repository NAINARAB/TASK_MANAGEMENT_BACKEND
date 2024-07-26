const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput, checkIsNumber } = require('../res');
const { extractHHMM, ISOString } = require('../../helper');


const ReportTemplate = () => {

    const getTablesandColumnsForReport = async (req, res) => {
        try {
            const request = new sql.Request()
                .query(`
                    WITH TableColumns AS (
                        SELECT
                            *
                        FROM
                            tbl_Table_Master_Columns
                    )
                    SELECT
                        t.*,
                        COALESCE((
                            SELECT
                                c.*
                            FROM
                                TableColumns AS c
                            WHERE
                                c.Table_Id = t.Table_Id
                            FOR JSON PATH
                        ), '[]') AS Columns
                    FROM 
                        tbl_Table_Master AS t
                    `)

            const result = (await request).recordset

            if (result.length > 0) {
                const parsed = result.map(o => ({
                    ...o,
                    Columns: JSON.parse(o?.Columns)
                }))
                dataFound(res, parsed);
            } else {
                noData(res);
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const insertTemplate = async (req, res) => {
        const { tables, reportName, createdBy, tableJoins } = req.body;

        try {

            if (!Array.isArray(tables) || tables.length < 1 || !reportName || !checkIsNumber(createdBy) || !Array.isArray(tableJoins)) {
                return invalidInput(res, 'tables, reportName, createdBy, tableJoins is required');
            }

            let errorCount = 0;
            let errors = [];

            for (let i = 0; i < tables.length; i++) {
                if (!checkIsNumber(tables[i].Table_Id)) {
                    errorCount += 1;
                    errors.push('Table Id missing')
                }
                if (Array.isArray(tables[i].columns) && tables[i].columns.length !== 0 && checkIsNumber(tables[i].Table_Id)) {
                    for (let j = 0; j < tables[i].columns; j++) {
                        if (!tables[i]?.columns[j]?.Column_Name) {
                            errorCount += 1;
                            errors.push('Column_Name missing')
                        }
                    }
                } else {
                    errorCount += 1;
                    errors.push('Invalid columns array inside table array')
                }
            }

            if (tables.reduce((sum, obj) => sum += Boolean(Number(obj?.isChecked)) ? 1 : 0, 0) > 1 && tableJoins.length !== 0) {
                if (tableJoins.length > 0) {
                    for (let i = 0; i < tableJoins.length; i++) {
                        if (!tableJoins[i]?.Join_First_Table_Id) {
                            errorCount += 1;
                            errors.push('Join_First_Table_Id is missing in tableJoins')
                        }
                        if (!tableJoins[i]?.Join_First_Table_Column) {
                            errorCount += 1;
                            errors.push('Join_First_Table_Column is missing in tableJoins')
                        }
                        if (!tableJoins[i]?.Join_Second_Table_Id) {
                            errorCount += 1;
                            errors.push('Join_Second_Table_Id is missing in tableJoins')
                        }
                        if (!tableJoins[i]?.Join_Second_Table_Column) {
                            errorCount += 1;
                            errors.push('Join_Second_Table_Column is missing in tableJoins')
                        }
                    }
                }
            } else {
                errorCount += 1;
                errors.push('multiple tables received but no joins are supplied')
            }

            if (errorCount > 0) {
                return invalidInput(res, `invalid Input errors ${errorCount}`);
            }

            const transaction = sql.Transaction()

            await transaction.begin();

            const reportTypeInsertRequest = new sql.Request(transaction)
                .input('reportName', reportName)
                .query(`
                    INSERT INTO tbl_Report_Type
                        (Report_Name)
                    VALUES
                        (@reportName);
                    
                    SELECT SCOPE_IDENTITY() AS ReportID;`);

            const reportTypeInsertResult = await reportTypeInsertRequest;

            const rowInserted = reportTypeInsertResult.rowsAffected[0] > 0;
            const ReportID = reportTypeInsertResult.recordset[0].ReportID;

            if (rowInserted && ReportID) {
                for (let i = 0; i < tables.length; i++) {
                    const columnsInsertRequest = new sql.Request(transaction)
                        .input('ReportTypeId', ReportID)
                        .input('ColumnName', tables[i].ColumnName)
                        .input('OrderBy', OrderBy)
                }
            }

        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getTablesandColumnsForReport,
        insertTemplate,
    }
}



module.exports = ReportTemplate();
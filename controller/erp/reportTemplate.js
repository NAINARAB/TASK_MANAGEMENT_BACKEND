const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput, checkIsNumber } = require('../res');


const getTableAccronym = (arr, tableId) => {
    let str = '';
    for (let i = 0; i < arr.length; i++) {
        if (Number(arr[i].Table_Id) === Number(tableId)) {
            str = arr[i].Table_Accronym;
            break;
        }
    }
    return str;
}

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
                return invalidInput(res, `invalid Input errors ${errorCount}`, { errors });
            }

        } catch (e) {
            return falied(res, 'validation error')
        }

        try {
            const transaction = new sql.Transaction()
            await transaction.begin();

            try {
                // Check if Report Name Already Exists
                const checkifReportNameExist = (await new sql.Request()
                    .input('Report_Name', reportName)
                    .query('SELECT COUNT(*) AS name FROM tbl_Report_Type WHERE Report_Name = @Report_Name')).recordset[0]?.name

                if (checkifReportNameExist > 0) {
                    return falied(res, 'Report Name Already Exist')
                }

                // Creating Report Type
                const reportTypeInsertRequest = new sql.Request(transaction)
                    .input('reportName', reportName)
                    .input('ReportState', JSON.stringify({ tables, reportName, tableJoins}))
                    .query(`
                        INSERT INTO tbl_Report_Type
                            (Report_Name, ReportState)
                        VALUES
                            (@reportName, @ReportState);
                        
                        SELECT SCOPE_IDENTITY() AS ReportID;`);

                const reportTypeInsertResult = await reportTypeInsertRequest;

                const rowInserted = reportTypeInsertResult.rowsAffected[0] > 0;
                const ReportID = reportTypeInsertResult.recordset[0].ReportID;

                const tableMaster = (await sql.query('SELECT * FROM tbl_Table_Master')).recordset;
                const colToInsert = [];

                if (rowInserted) {
                    //Inserting Tables and Columns 

                    for (let i = 0; i < tables.length; i++) {
                        for (let j = 0; j < tables[i]?.columns?.length; j++) {

                            colToInsert.push(getTableAccronym(tableMaster, tables[i]?.Table_Id) + '.' + tables[i]?.columns[j]?.Column_Name);

                            const columnsInsertRequest = new sql.Request(transaction)
                                .input('Report_Type_Id', ReportID)
                                .input('Table_Id', tables[i]?.Table_Id)
                                .input('Column_Name', tables[i]?.columns[j]?.Column_Name)
                                .input('Order_By', tables[i]?.columns[j]?.Order_By)
                                .query(`
                                INSERT INTO tbl_ReportColumns
                                    (Report_Type_Id, Table_Id, Column_Name, Order_By)
                                VALUES
                                    (@Report_Type_Id, @Table_Id, @Column_Name, @Order_By)
                                `)

                            const result = (await columnsInsertRequest).rowsAffected[0];

                            if (result === 0) {
                                await transaction.rollback();
                                return falied(res, 'Failed to insert Columns')
                            }
                        }
                    }

                    if (tables.length > 1 && tableJoins.length > 0) {
                        // Inserting Table Joins if exist 
                        for (let i = 0; i < tableJoins.length; i++) {
                            const joinsInsertRequest = new sql.Request(transaction)
                                .input('Report_Type_Id', ReportID)
                                .input('Join_First_Table_Id', tableJoins[i]?.Join_First_Table_Id)
                                .input('Join_First_Table_Column', tableJoins[i]?.Join_First_Table_Column)
                                .input('Join_Second_Table_Id', tableJoins[i]?.Join_Second_Table_Id)
                                .input('Join_Second_Table_Column', tableJoins[i]?.Join_Second_Table_Column)
                                .query(`
                                    INSERT INTO tbl_Report_Table_Join
                                        (Report_Type_Id, Join_First_Table_Id, Join_First_Table_Column, Join_Second_Table_Id, Join_Second_Table_Column)
                                    VALUES
                                        (@Report_Type_Id, @Join_First_Table_Id, @Join_First_Table_Column, @Join_Second_Table_Id, @Join_Second_Table_Column)
                                `)

                            const result = (await joinsInsertRequest).rowsAffected[0];

                            if (result === 0) {
                                await transaction.rollback();
                                return falied(res, 'Failed to insert Joins')
                            }
                        }
                    }

                    // Generating sql Query 
                    let queryString = 'SELECT ' + colToInsert.join(',') + ' FROM ';

                    queryString += tables.map(table => `${table.Table_Name} AS ${getTableAccronym(tableMaster, table.Table_Id)}`).join(', ');

                    if (tableJoins.length > 0) {
                        const joinConditions = tableJoins.map(join => {
                            const table1Alias = getTableAccronym(tableMaster, join.Join_First_Table_Id);
                            const table2Alias = getTableAccronym(tableMaster, join.Join_Second_Table_Id);
                            return `${table1Alias}.${join.Join_First_Table_Column} = ${table2Alias}.${join.Join_Second_Table_Column}`;
                        });
                        queryString += ' WHERE ' + joinConditions.join(' AND ');
                    }

                    const updateReport = new sql.Request(transaction)
                        .input('queryString', queryString)
                        .input('Report_Type_Id', ReportID)
                        .query(`
                            UPDATE 
                                tbl_Report_Type
                            SET
                                Report_Columns = @queryString
                            WHERE
                                Report_Type_Id = @Report_Type_Id
                            `)

                    const updateResult = await updateReport;

                    if (updateResult.rowsAffected[0] === 0) {
                        await transaction.rollback();
                        return falied(res, 'Failed to update Query')
                    }

                    transaction.commit();
                    success(res, 'Template Created Successfully');

                } else {
                    await transaction.rollback();
                    return falied(res, 'Failed to create ReportName')
                }

            } catch (e) {
                await transaction.rollback();
                return servError(e, res, 'ReportName already exists')
            }
        } catch (e) {
            servError(e, res);
        }
    }

    // const getTemplates = async (req, res) => {

    //     try {
    //         const reportName = (await sql.query(`SELECT * FROM tbl_Report_TypeWHERE Type = 1`)).recordset;
    //         const tables = (await sql.query(

    //         ))
    //     } catch (e) {
    //         servError(e, res);
    //     }
    // }

    return {
        getTablesandColumnsForReport,
        insertTemplate,
    }
}


module.exports = ReportTemplate();
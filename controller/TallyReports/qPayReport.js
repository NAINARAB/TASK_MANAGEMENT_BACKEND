const sql = require("mssql");
const { servError, falied, checkIsNumber, invalidInput, dataFound, noData, success } = require('../res');


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

    const getQPayColumns = async (req, res) => {
        const { CompanyId } = req.query;

        if (!checkIsNumber(CompanyId)) {
            return invalidInput(res, 'CompanyId is required')
        }

        try {
            const getColumns = new sql.Request()
                .query(`
                    SELECT 
                    	Report_Columns
                    FROM
                    	tbl_Report_Type
                    WHERE
                    	Report_Type_Id = 1`)

            const columns = await getColumns;

            if (columns.recordset.length === 1) {
                let columnArray = columns.recordset[0].Report_Columns.split(',');
                const availableColumns = [];

                const getColHed = new sql.Request()
                    .query(`SELECT * FROM tbl_Report_Fileds`)

                const colHed = await getColHed;

                for (let i = 0; i < columnArray.length; i++) {
                    for (let j = 0; j < colHed.recordset.length; j++) {
                        if (columnArray[i] === colHed.recordset[j].Field_Name) {
                            availableColumns.push(colHed.recordset[j])
                        }
                    }
                }

                if (availableColumns.length > 0) {
                    const getVisiblity = new sql.Request()
                        .input('ReportId', 1)
                        .input('CompanyId', CompanyId)
                        .query(`
                            SELECT 
                                * 
                            FROM 
                                tbl_Report_Column_Visiblity 
                            WHERE
                                ReportId = @ReportId
                                AND
                                CompanyId = @CompanyId`)

                    const visibledResult = await getVisiblity;
                    const visibledColumns = visibledResult.recordset;

                    const result = [];

                    for (let i = 0; i < availableColumns.length; i++) {
                        let obj = {};
                        obj.Field_Id = availableColumns[i].Field_Id;
                        obj.Field_Name = availableColumns[i].Field_Name;
                        obj.Fied_Data = availableColumns[i].Fied_Data;
                        obj.Defult_Display = availableColumns[i].Defult_Display;
                        obj.isVisible = 0;
                        obj.OrderBy = 0;

                        for (let j = 0; j < visibledColumns.length; j++) {
                            if (Number(availableColumns[i].Field_Id) === Number(visibledColumns[j].Field_Id)) {
                                obj.isVisible = visibledColumns[j].isVisible;
                                obj.OrderBy = visibledColumns[j].OrderBy;
                            }
                        }
                        result.push(obj)
                    }

                    if (result.length > 0) {
                        dataFound(res, result)
                    } else {
                        noData(res)
                    }
                    
                } else {
                    noData(res)
                }

            } else {
                falied(res, 'No columns are specified for this report type = 1')
            }

        } catch (e) {
            servError(e, res);
        }
    }

    // const postColumnVisiblity = async (req, res) => {
    //     const { ReportId, CompanyId, Field_Id, isVisible } = req.body;

    //     try {
    //         const checkEsist = new sql.Request()
    //             .input('ReportId', ReportId)
    //             .input('CompanyId', CompanyId)
    //             .input('Field_Id', Field_Id)
    //             .query(`
    //                 SELECT 
    //                     * 
    //                 FROM 
    //                     tbl_Report_Column_Visiblity
    //                 WHERE
    //                     ReportId = @ReportId
    //                     AND
    //                     CompanyId = @CompanyId
    //                     AND
    //                     Field_Id = @Field_Id `)

    //         const checkResult = await checkEsist;

    //         if (checkResult.recordset.length > 0) {
    //             const updateRequest = new sql.Request()
    //                 .input('ReportId', ReportId)
    //                 .input('CompanyId', CompanyId)
    //                 .input('Field_Id', Field_Id)
    //                 .input('isVisible', isVisible)
    //                 .query(`
    //                     UPDATE
    //                         tbl_Report_Column_Visiblity
    //                     SET
    //                         isVisible = @isVisible
    //                     WHERE
    //                         ReportId = @ReportId
    //                         AND
    //                         CompanyId = @CompanyId
    //                         AND
    //                         Field_Id = @Field_Id `)

    //             const updateResult = await updateRequest;

    //             if (updateResult.rowsAffected[0] && updateResult.recordset.length > 0) {
    //                 success(res, 'Changes Saved');
    //             } else {
    //                 falied(res, 'Failed to save')
    //             }
    //         } else {
    //             const insertRequest = new sql.Request()
    //                 .input('ReportId', ReportId)
    //                 .input('CompanyId', CompanyId)
    //                 .input('Field_Id', Field_Id)
    //                 .input('isVisible', isVisible)
    //                 .query(`
    //                     INSERT INTO tbl_Report_Column_Visiblity
    //                         (ReportId, CompanyId, Field_Id, isVisible)
    //                     VALUES
    //                         (@ReportId, @CompanyId, @Field_Id, @isVisible)
    //                         `)

    //             const insertResult = await insertRequest;

    //             if (insertResult.rowsAffected[0] && insertResult.rowsAffected[0] > 0) {
    //                 success(res, 'Changes Saved')
    //             } else {
    //                 falied(res, 'Failed to save')
    //             }
    //         }
    //     } catch (e) {
    //         servError(e, res);
    //     }
    // }

    const postColumnVisiblity = async (req, res) => {
        const { dataArray, ReportId, CompanyId } = req.body;

        if ((!Array.isArray(dataArray) || dataArray?.length === 0) || !checkIsNumber(ReportId) || !checkIsNumber(CompanyId)) {
            return invalidInput(res, 'dataArray, ReportId, CompanyId is required');
        }

        for (const item of dataArray) {
            if (!checkIsNumber(item.Field_Id) || typeof item.isVisible !== 'number') {
                return invalidInput(res, 'Each element in dataArray must have a valid Field_Id and isVisible boolean');
            }
        }

        try {
            const transaction = new sql.Transaction();
            await transaction.begin();

            try {
                const deleteEsist = new sql.Request(transaction)
                    .input('ReportId', ReportId)
                    .input('CompanyId', CompanyId)
                    .query(`
                        DELETE 
                        FROM 
                            tbl_Report_Column_Visiblity
                        WHERE
                            ReportId = @ReportId
                            AND
                            CompanyId = @CompanyId `)

                await deleteEsist;
            } catch (e) {
                await transaction.rollback();
                return servError(e, res)
            }

            try {
                for (let i = 0; i < dataArray.length; i++) {
                    const insertRequest = new sql.Request(transaction)
                        .input('ReportId', ReportId)
                        .input('CompanyId', CompanyId)
                        .input('Field_Id', dataArray[i].Field_Id)
                        .input('isVisible', Boolean(dataArray[i].Defult_Display) ? 1 : Boolean(dataArray[i].isVisible) ? 1 : 0)
                        .input('OrderBy', dataArray[i].OrderBy ? dataArray[i].OrderBy : null)
                        .query(`
                            INSERT INTO tbl_Report_Column_Visiblity
                                (ReportId, CompanyId, Field_Id, isVisible, OrderBy)
                            VALUES
                                (@ReportId, @CompanyId, @Field_Id, @isVisible, @OrderBy)
                        `)

                    const insertResult = await insertRequest;

                    if (!insertResult.rowsAffected[0] || insertResult.rowsAffected[0] <= 0) {
                        await transaction.rollback();
                        return servError(e, res)
                    }
                }

            } catch (e) {
                await transaction.rollback();
                return servError(e, res);
            }

            await transaction.commit();
            success(res, 'Changes saved')


        } catch (e) {
            servError(e, res);
        }
    }

    return {
        getQpayData,
        postColumnVisiblity,
        getQPayColumns,
    }

}

module.exports = QPayReport();
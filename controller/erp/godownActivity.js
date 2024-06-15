const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput } = require('../res')


const GodownActivity = () => {

    const getGodownActivity = async (req, res) => {

        const { Fromdate, Todate, LocationDetails } = req.query;

        try {
            const request = new sql.Request()
                .input('Fromdate', Fromdate ? Fromdate : new Date())
                .input('Todate', Todate ? Todate : new Date())
                .input('LocationDetails', LocationDetails)
                .query(`
                    SELECT * 
                    FROM 
                        tbl_GodownActivity 
                    WHERE 
                        CONVERT(DATE, EntryDate) >= CONVERT(DATE, @Fromdate)
                        AND
                        CONVERT(DATE, Todate) <= CONVERT(DATE, @Todate)
                        ${LocationDetails ? `
                        AND
                        LocationDetails = @LocationDetails` : ''}
                    `)

            const result = await request;

            if (result.recordset.length) {
                dataFound(res, result.recordset)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const postGWActivity = async (req, res) => {

        const { EntryDate, LocationDetails, Purchase, OtherGodown, PurchaseTransfer, Handle, WGChecking, LorryShed, VandiVarum, DDSales, SalesTransfer } = req.body;

        try {

            const checkExists = new sql.Request()
                .input('reqDate', EntryDate ? EntryDate : new Date())
                .query(
                    `SELECT 
                        COUNT(Id) AS Entries 
                    FROM 
                        tbl_GodownActivity
                    WHERE
                        CONVERT(DATE, EntryDate) = CONVERT(DATE, @reqDate)`
                )
            const checkResult = await checkExists;

            if (checkResult.recordset[0].Entries) {
                return invalidInput(res, 'The Date ia already exist')
            }

            const request = new sql.Request()
                .input('EntryDate', EntryDate ? EntryDate : new Date())
                .input('LocationDetails', LocationDetails)
                .input('Purchase', Purchase)
                .input('OtherGodown', OtherGodown)
                .input('PurchaseTransfer', PurchaseTransfer)
                .input('Handle', Handle)
                .input('WGChecking', WGChecking)
                .input('LorryShed', LorryShed)
                .input('VandiVarum', VandiVarum)
                .input('DDSales', DDSales)
                .input('SalesTransfer', SalesTransfer)
                .input('EntryAt', new Date())
                .query(
                    `INSERT INTO tbl_GodownActivity
                        (EntryDate, LocationDetails, Purchase, OtherGodown, PurchaseTransfer, Handle, WGChecking, LorryShed, VandiVarum, DDSales, SalesTransfer, EntryAt)
                    VALUES 
                        (@EntryDate, @LocationDetails, @Purchase, @OtherGodown, @PurchaseTransfer, @Handle, @WGChecking, @LorryShed, @VandiVarum, @DDSales, @SalesTransfer, @EntryAt)`
                )

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Success')
            } else {
                falied(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const updateGWActivity = async (req, res) => {
        const { Id, Purchase, OtherGodown, PurchaseTransfer, Handle, WGChecking, LorryShed, VandiVarum, DDSales, SalesTransfer } = req.body;

        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('Purchase', Purchase)
                .input('OtherGodown', OtherGodown)
                .input('PurchaseTransfer', PurchaseTransfer)
                .input('Handle', Handle)
                .input('WGChecking', WGChecking)
                .input('LorryShed', LorryShed)
                .input('VandiVarum', VandiVarum)
                .input('DDSales', DDSales)
                .input('SalesTransfer', SalesTransfer)
                .input('EntryAt', new Date())
                .query(
                    `UPDATE 
                        tbl_GodownActivity
                    SET
                        Purchase = @Purchase,
                        OtherGodown = @OtherGodown,
                        PurchaseTransfer = @PurchaseTransfer,
                        Handle = @Handle,
                        WGChecking = @WGChecking,
                        LorryShed = @LorryShed,
                        VandiVarum = @VandiVarum,
                        DDSales = @DDSales,
                        SalesTransfer = @SalesTransfer,
                        EntryAt = @EntryAt
                    WHERE 
                        Id = @Id
                    `
                )

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved');
            } else {
                falied(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }


    return {
        getGodownActivity,
        postGWActivity,
        updateGWActivity,
    }

}


module.exports = GodownActivity();
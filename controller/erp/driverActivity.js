const sql = require('mssql');
const { servError, dataFound, noData, success, falied } = require('../res')

const DriverActivities = () => {

    const getActivities = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        try {

            const request = new sql.Request()
                .input('reqDate', reqDate ? reqDate : new Date())
                .input('reqLocation', reqLocation)
                .query(`
                    SELECT 
                        * 
                    FROM 
                        tbl_Driver_Activity 
                    WHERE 
                        EntryDate = CONVERT(DATE, @reqDate)
                        ${reqLocation ? `
                        AND
                        LocationDetails = @reqLocation` : ''}
                `)
            
            const result = await request; 
            

            if (result.recordset.length > 0) {
                dataFound(res, result.recordset);
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const addActivities = async (req, res) => {
        const { 
            EntryDate, LocationDetails, DriverName, 
            TripOne, TripTwo, TripThree, TripFour, TripFive, 
            OtherGodownsOne, OtherGodownsTwo, OtherGodownsThree, 
            TransferOne, TransferTwo, TransferThree
        } = req.body;

        try {
            const request = new sql.Request()
                .input('EntryDate', EntryDate ? EntryDate : new Date())
                .input('LocationDetails', LocationDetails)
                .input('DriverName', DriverName)
                .input('TripOne', TripOne ? TripOne : 0)
                .input('TripTwo', TripTwo ? TripTwo : 0)
                .input('TripThree', TripThree ? TripThree : 0)
                .input('TripFour', TripFour ? TripFour : 0)
                .input('TripFive', TripFive ? TripFive : 0)
                .input('OtherGodownsOne', OtherGodownsOne ? OtherGodownsOne : 0)
                .input('OtherGodownsTwo', OtherGodownsTwo ? OtherGodownsTwo : 0)
                .input('OtherGodownsThree', OtherGodownsThree ? OtherGodownsThree : 0)
                .input('TransferOne', TransferOne ? TransferOne : 0)
                .input('TransferTwo', TransferTwo ? TransferTwo : 0)
                .input('TransferThree', TransferThree ? TransferThree : 0)
                .input('LastModifiedAt', new Date())
                .query(`
                    INSERT INTO tbl_Driver_Activity (
                        EntryDate, LocationDetails, DriverName, 
                        TripOne, TripTwo, TripThree, TripFour, TripFive, 
                        OtherGodownsOne, OtherGodownsTwo, OtherGodownsThree, 
                        TransferOne, TransferTwo, TransferThree, 
                        LastModifiedAt
                    )
                    VALUES (
                        @EntryDate, @LocationDetails, @DriverName,
                        @TripOne, @TripTwo, @TripThree, @TripFour, @TripFive,
                        @OtherGodownsOne, @OtherGodownsTwo, @OtherGodownsThree,
                        @TransferOne, @TransferTwo, @TransferThree,
                        @LastModifiedAt
                    )
                `)
            
            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Driver Activity Noted')
            } else {
                falied(res, 'Failed to save, Try again.')
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const updateActivities = async (req, res) => {
        const { 
            Id, DriverName, 
            TripOne, TripTwo, TripThree, TripFour, TripFive, 
            OtherGodownsOne, OtherGodownsTwo, OtherGodownsThree, 
            TransferOne, TransferTwo, TransferThree
        } = req.body;

        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('DriverName', DriverName)
                .input('TripOne', TripOne ? TripOne : 0)
                .input('TripTwo', TripTwo ? TripTwo : 0)
                .input('TripThree', TripThree ? TripThree : 0)
                .input('TripFour', TripFour ? TripFour : 0)
                .input('TripFive', TripFive ? TripFive : 0)
                .input('OtherGodownsOne', OtherGodownsOne ? OtherGodownsOne : 0)
                .input('OtherGodownsTwo', OtherGodownsTwo ? OtherGodownsTwo : 0)
                .input('OtherGodownsThree', OtherGodownsThree ? OtherGodownsThree : 0)
                .input('TransferOne', TransferOne ? TransferOne : 0)
                .input('TransferTwo', TransferTwo ? TransferTwo : 0)
                .input('TransferThree', TransferThree ? TransferThree : 0)
                .input('LastModifiedAt', new Date())
                .query(`
                    UPDATE tbl_Driver_Activity 
                    SET 
                        DriverName = @DriverName, 
                        TripOne = @TripOne, 
                        TripTwo = @TripTwo, 
                        TripThree = @TripThree, 
                        TripFour = @TripFour, 
                        TripFive = @TripFive, 
                        OtherGodownsOne = @OtherGodownsOne, 
                        OtherGodownsTwo = @OtherGodownsTwo, 
                        OtherGodownsThree = @OtherGodownsThree, 
                        TransferOne = @TransferOne, 
                        TransferTwo = @TransferTwo, 
                        TransferThree = @TransferThree, 
                        LastModifiedAt = @LastModifiedAt
                    WHERE
                        Id = @Id
                `)
            
            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes Saved')
            } else {
                falied(res, 'Failed to save, Try again.')
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const getLocationStrings = async (req, res) => {
        try {
            const request = new sql.Request()
                .query(`SELECT DISTINCT LocationDetails FROM tbl_Driver_Activity`)
            
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

    const getDrivers = async (req, res) => {
        try {
            const request = new sql.Request()
                .query(`SELECT DISTINCT DriverName FROM tbl_Driver_Activity`)
            
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


    return {
        getActivities,
        addActivities,
        updateActivities,
        getLocationStrings,
        getDrivers,
    }
}


module.exports = DriverActivities()
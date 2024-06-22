const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput, LocalDateTime, getCurrentTime } = require('../res')


const deliveryActivity = () => {

    const getDeliveryReport = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        if (!reqLocation) {
            return invalidInput(res, 'reqLocation is required');
        }

        try {

            const request = new sql.Request()
                .input('reqLocation', reqLocation)
                .input('reqDate', reqDate)
                .query(`
                    SELECT
                    	DISTINCT da.EntryDate,
                    	COALESCE((
                    		SELECT 
                    			*
                    		FROM
                    			tbl_DeliveryActivity
                    		WHERE
                    			EntryDate = da.EntryDate
                    			AND
                    			CONVERT(DATE, EntryDate) = CONVERT(DATE, @reqDate)
                                AND
                                LocationDetails = @reqLocation
                            ORDER BY
                                EntryTime ASC
                    		FOR JSON PATH
                    	), '[]') AS DeliveryList
                    FROM
                    	tbl_DeliveryActivity AS da
                    WHERE 
                    	CONVERT(DATE, da.EntryDate) = CONVERT(DATE, @reqDate)
                        AND
                        da.LocationDetails = @reqLocation
                    `)
            
            const result = await request;

            if (result.recordset.length) {
                const levelOneParse = result.recordset?.map(o => ({
                    ...o,
                    DeliveryList: JSON.parse(o?.DeliveryList)
                }))
                dataFound(res, levelOneParse)
            } else {
                noData(res)
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const addDeliveryReport = async (req, res) => {
        const { EntryDate, EntryTime, LocationDetails, NotTaken, NotVerified, NotDelivery, OverAllSales, EntryBy } = req.body;

        if (!LocationDetails || !EntryBy) {
            return invalidInput(res, 'LocationDetails, EntryBy is required')
        }

        try {
            const request = new sql.Request()
                .input('EntryDate', EntryDate ? EntryDate : new Date())
                .input('EntryTime', EntryTime ? EntryTime : getCurrentTime())
                .input('LocationDetails', LocationDetails)
                .input('NotTaken', NotTaken ? NotTaken : 0)
                .input('NotVerified', NotVerified ? NotVerified : 0)
                .input('NotDelivery', NotDelivery ? NotDelivery : 0)
                .input('OverAllSales', OverAllSales ? OverAllSales : 0)
                .input('EntryAt', new Date())
                .input('EntryBy', EntryBy)
                .query(`
                    INSERT INTO tbl_DeliveryActivity
                        (EntryDate, EntryTime, LocationDetails, NotTaken, NotVerified, NotDelivery, OverAllSales, EntryAt, EntryBy)
                    VALUES
                        (@EntryDate, @EntryTime, @LocationDetails, @NotTaken, @NotVerified, @NotDelivery, @OverAllSales, @EntryAt, @EntryBy)    
                `)

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Saved');
            } else {
                falied(res)
            }
        } catch (e) {
            servError(e, res)
        }
    }

    const updateDeliveryActivity = async (req, res) => {
        const { Id, EntryDate, EntryTime, LocationDetails, NotTaken, NotVerified, NotDelivery, OverAllSales, EntryBy } = req.body;

        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('EntryDate', EntryDate || getCurrentTime())
                .input('EntryTime', EntryTime)
                .input('LocationDetails', LocationDetails)
                .input('NotTaken', NotTaken ? NotTaken : 0)
                .input('NotVerified', NotVerified ? NotVerified : 0)
                .input('NotDelivery', NotDelivery ? NotDelivery : 0)
                .input('OverAllSales', OverAllSales ? OverAllSales : 0)
                .input('EntryAt', LocalDateTime())
                .input('EntryBy', EntryBy)
                .query(`
                    UPDATE 
                        tbl_DeliveryActivity 
                    SET
                        EntryDate = @EntryDate,
                        EntryTime = @EntryTime,
                        LocationDetails = @LocationDetails,
                        NotTaken = @NotTaken,
                        NotVerified = @NotVerified,
                        NotDelivery = @NotDelivery,
                        OverAllSales = @OverAllSales,
                        EntryAt = @EntryAt,
                        EntryBy = @EntryBy
                    WHERE
                        Id = @Id
                `)

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
        getDeliveryReport,
        addDeliveryReport,
        updateDeliveryActivity,
    }

}

module.exports = deliveryActivity()
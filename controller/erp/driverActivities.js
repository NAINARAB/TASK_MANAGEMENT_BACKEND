const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput } = require('../res')


const newDriverActivities = () => {

    const getDriverActivities = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        try {
            const request = new sql.Request()
                .input('reqDate', reqDate ? reqDate : new Date())
                .input('reqLocation', reqLocation)
                .query(`
                    SELECT 
                        DISTINCT da.DriverName,
                        COALESCE((
                            SELECT 
                                DISTINCT tc.TripCategory,
                                COALESCE((
                                    SELECT 
                                        *
                                    FROM 
                                        tbl_Driver_Activities
                                    WHERE 
                                        DriverName = da.DriverName
                                        AND
                                        TripCategory = tc.TripCategory
                                        AND
                                        LocationDetails = @reqLocation
                                        AND
                                        ActivityDate = @reqDate
                                    FOR JSON PATH
                                ), '[]') AS TripDetails
                            FROM
                                tbl_Driver_Activities AS tc 
                            FOR JSON PATH
                        ), '[]') AS LocationGroup
                    FROM 
                        tbl_Driver_Activities AS da
                    WHERE
                        da.ActivityDate = @reqDate
                        ${reqLocation ? `
                        AND 
                        da.LocationDetails = @reqLocation` : ''}
                    `)
            
            const result = await request;

            if (result.recordset.length > 0) {
                const levelOneParse = result.recordset.map(o => ({
                    ...o,
                    LocationGroup: JSON.parse(o?.LocationGroup)
                }))
                const levelTowParse = levelOneParse.map(o => ({
                    ...o,
                    LocationGroup: o?.LocationGroup?.map(oo => ({
                        ...oo,
                        TripDetails: JSON.parse(oo?.TripDetails)
                    }))
                }))
                dataFound(res, levelTowParse)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const addDriverActivities = async (req, res) => {
        const { ActivityDate, LocationDetails, DriverName, TripCategory, TonnageValue, EventTime, CreatedBy } = req.body;

        if (!DriverName || !LocationDetails || !TripCategory || !TonnageValue || !EventTime) {
            return invalidInput(res, 'DriverName, LocationDetails, TripCategory, TonnageValue, EventTime is required');
        }

        try {
            const request = new sql.Request()
                .input('ActivityDate', ActivityDate ? ActivityDate : new Date())
                .input('LocationDetails', LocationDetails)
                .input('DriverName', DriverName)
                .input('TripCategory', TripCategory)
                .input('TonnageValue', TonnageValue)
                .input('EventTime', EventTime)
                .input('CreatedAt', new Date())
                .input('CreatedBy', CreatedBy)
                .query(`
                    INSERT INTO tbl_Driver_Activities
                        (ActivityDate, LocationDetails, DriverName, TripCategory, TonnageValue, EventTime, CreatedAt, CreatedBy)
                    VALUES
                        (@ActivityDate, @LocationDetails, @DriverName, @TripCategory, @TonnageValue, @EventTime, @CreatedAt, @CreatedBy)`
                )

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Record saved')
            } else {
                falied(res)
            }

        } catch (e) {
            servError(e, res);
        }
    }


    const editDriverActivity = async (req, res) => {
        const { Id, ActivityDate, LocationDetails, DriverName, TripCategory, TonnageValue, EventTime, CreatedBy } = req.body;
        
        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('ActivityDate', ActivityDate)
                .input('LocationDetails', LocationDetails)
                .input('DriverName', DriverName)
                .input('TripCategory', TripCategory)
                .input('TonnageValue', TonnageValue)
                .input('EventTime', EventTime)
                .input('CreatedBy', CreatedBy)
                .query(`
                    UPDATE tbl_Driver_Activities
                    SET
                        ActivityDate = @ActivityDate,
                        LocationDetails = @LocationDetails,
                        DriverName = @DriverName,
                        TripCategory = @TripCategory,
                        TonnageValue = @TonnageValue,
                        EventTime = @EventTime,
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


    const getDrivers = async (req, res) => {
        try {
            const request = new sql.Request()
                .query(`SELECT DISTINCT DriverName FROM tbl_Driver_Activities`)
            
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


    // const deleteDriverActivity = async (req, res) => {
    //     const { Id } = req.query;


    // } 


    return {
        getDrivers,
        getDriverActivities,
        addDriverActivities,
        editDriverActivity,
    }
}

module.exports = newDriverActivities()
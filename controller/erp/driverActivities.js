const sql = require('mssql');
const { servError, dataFound, noData, success, falied, invalidInput } = require('../res')


const newDriverActivities = () => {

    const getDriverActivities = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        if (!reqLocation) {
            return invalidInput(res, 'reqLocation is required')
        }

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
										DISTINCT t.TripNumber,

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
                                                TripNumber = t.TripNumber
												AND
												ActivityDate = @reqDate
												AND
												LocationDetails = @reqLocation
											ORDER BY
												CONVERT(TIME, EventTime)
											FOR JSON PATH
										), '[]') AS Trips

									FROM
										tbl_Driver_Activities AS t
                                    WHERE 
                                        t.TripCategory = tc.TripCategory
                                        AND
                                        t.ActivityDate = @reqDate
                                        AND
                                        t.LocationDetails = @reqLocation
                                    ORDER BY
                                        t.TripNumber
                                    FOR JSON PATH
                                ), '[]') AS TripDetails

                            FROM
                                tbl_Driver_Activities AS tc
                            WHERE
                                tc.ActivityDate = @reqDate
                                AND
                                tc.LocationDetails = @reqLocation 
                            FOR JSON PATH
                        ), '[]') AS LocationGroup

                    FROM 
                        tbl_Driver_Activities AS da
                    WHERE
                        da.ActivityDate = @reqDate
                        AND 
                        da.LocationDetails = @reqLocation
                    `)
            
            const result = await request;

            if (result.recordset.length > 0) {

                const levelOneParse = result.recordset?.map(o => ({
                    ...o,
                    LocationGroup: JSON.parse(o?.LocationGroup)
                }))

                const levelTowParse = levelOneParse?.map(o => ({
                    ...o,
                    LocationGroup: o?.LocationGroup?.map(oo => ({
                        ...oo,
                        TripDetails: JSON.parse(oo?.TripDetails)
                    }))
                }))

                const levelThreeParse = levelTowParse?.map(o => ({
                    ...o,
                    LocationGroup: o?.LocationGroup?.map(oo => ({
                        ...oo,
                        TripDetails: oo?.TripDetails?.map(ooo => ({
                            ...ooo,
                            Trips: JSON.parse(ooo?.Trips)
                        }))
                    }))
                }))

                dataFound(res, levelThreeParse)
            } else {
                noData(res)
            }
        } catch (e) {
            servError(e, res);
        }
    }

    const addDriverActivities = async (req, res) => {
        const { ActivityDate, LocationDetails, DriverName, TripCategory, TonnageValue, EventTime, TripNumber, CreatedBy } = req.body;

        if (!DriverName || !LocationDetails || !TripCategory || !TonnageValue || !EventTime) {
            return invalidInput(res, 'DriverName, LocationDetails, TripCategory, TonnageValue, EventTime, TripNumber is required');
        }

        try {
            const request = new sql.Request()
                .input('ActivityDate', ActivityDate ? ActivityDate : new Date())
                .input('LocationDetails', LocationDetails)
                .input('DriverName', DriverName)
                .input('TripCategory', TripCategory)
                .input('TonnageValue', TonnageValue)
                .input('EventTime', EventTime)
                .input('TripNumber', TripNumber ? TripNumber : 0)
                .input('CreatedAt', new Date())
                .input('CreatedBy', CreatedBy)
                .query(`
                    INSERT INTO tbl_Driver_Activities
                        (ActivityDate, LocationDetails, DriverName, TripCategory, TripNumber, TonnageValue, EventTime, CreatedAt, CreatedBy)
                    VALUES
                        (@ActivityDate, @LocationDetails, @DriverName, @TripCategory, @TripNumber, @TonnageValue, @EventTime, @CreatedAt, @CreatedBy)`
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
        const { Id, ActivityDate, LocationDetails, DriverName, TripCategory, TripNumber, TonnageValue, EventTime, CreatedBy } = req.body;
        
        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('ActivityDate', ActivityDate)
                .input('LocationDetails', LocationDetails)
                .input('DriverName', DriverName)
                .input('TripCategory', TripCategory)
                .input('TripNumber', TripNumber)
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
                        TripNumber = @TripNumber,
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
const sql = require('mssql');
const { invalidInput, dataFound, noData, servError, success, falied } = require('../res');
const { extractHHMM, ISOString } = require('../../helper');

const StaffActivityControll = () => {

    const getStaffActivity = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        if (!reqLocation) {
            return invalidInput(res, 'reqLocation is required');
        }

        try {
            const request = new sql.Request()
                .input('date', reqDate ? new Date(reqDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                .input('location', reqLocation)
                .query(`
                    SELECT
                    	DISTINCT ut.EntryTime,
                    	COALESCE((
                    		SELECT 
                    			DISTINCT uc.Category,
                    			COALESCE((
                    				SELECT
                    					sa.*
                    				FROM
                    					tbl_StaffActivity AS sa	
                    				WHERE
                    					sa.EntryDate = CONVERT(DATE, @date)
                    					AND
                    					sa.LocationDetails = @location
                    					AND
                    					sa.EntryTime = ut.EntryTime
                    					and
                    					sa.Category = uc.Category
                                    ORDER BY 
                                        sa.EntryAt
                    				FOR JSON PATH
                    			), '[]') AS StaffDetails
                    		FROM
                    			tbl_StaffActivity AS uc
                            ORDER BY
                                uc.Category
                    		FOR JSON PATH
                    	), '[]') AS Categories
                    FROM
                    	tbl_StaffActivity AS ut
                    WHERE
                    	ut.EntryDate = CONVERT(DATE, @date)
                    	AND
                    	ut.LocationDetails = @location
                    ORDER BY
                        ut.EntryTime DESC
                    `)
            const result = await request;

            if (result.recordset.length > 0) {
                const levelOneParse = result.recordset?.map(o => ({
                    ...o,
                    Categories: JSON.parse(o?.Categories)
                }))

                const levelTowParse = levelOneParse?.map(o => ({
                    ...o,
                    Categories: o?.Categories?.map(oo => ({
                        ...oo,
                        StaffDetails: JSON.parse(oo?.StaffDetails)
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

    const getStaffActivityNew = async (req, res) => {
        const { reqDate, reqLocation } = req.query;
    
        if (!reqLocation) {
            return invalidInput(res, 'reqLocation is required');
        }
    
        try {
            const timeRequest = new sql.Request()
                .input('date', reqDate ? new Date(reqDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                .input('location', reqLocation)
                .query(`
                    SELECT
                        DISTINCT ut.EntryTime,
                        COALESCE((
                            SELECT 
                                DISTINCT uc.Category
                            FROM
                                tbl_StaffActivity AS uc
                            WHERE
                                uc.EntryDate = CONVERT(DATE, @date)
                                AND
                                uc.LocationDetails = @location
                            ORDER BY
                                uc.Category
                            FOR JSON PATH
                        ), '[]') AS Categories
                    FROM
                        tbl_StaffActivity AS ut
                    WHERE
                        ut.EntryDate = CONVERT(DATE, @date)
                        AND
                        ut.LocationDetails = @location
                    ORDER BY
                        ut.EntryTime DESC
                    `);
            const timeResult = await timeRequest;
    
            if (timeResult.recordset.length > 0) {

                const parsedData = timeResult.recordset.map(o => ({
                    ...o,
                    Categories: JSON.parse(o.Categories)
                }));
    
                const getRowRequest = new sql.Request()
                    .input('date', reqDate ? new Date(reqDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                    .input('location', reqLocation)
                    .query(`
                        SELECT
                            sa.*
                        FROM
                            tbl_StaffActivity AS sa	
                        WHERE
                            sa.EntryDate = CONVERT(DATE, @date)
                            AND
                            sa.LocationDetails = @location
                        ORDER BY 
                            sa.EntryAt`);

                const rowResult = (await getRowRequest).recordset;
    
                const mappedData = parsedData.map(time => ({
                    ...time,
                    Categories: time.Categories.map(category => ({
                        ...category,
                        StaffDetails: [...rowResult.filter(row =>
                            new Date(row?.EntryTime)?.toISOString() === new Date(time?.EntryTime).toISOString() && row?.Category === category?.Category
                        )].map(filt => ({ 
                            ...filt, 
                            EntryTime: filt.EntryTime ? extractHHMM(filt.EntryTime) : '',
                            EntryDate: filt.EntryDate ? ISOString(filt.EntryDate) : '',
                        }))
                    }))
                }));
    
                dataFound(res, mappedData);
            } else {
                noData(res);
            }
        } catch (e) {
            servError(e, res);
        }
    };
    
    const postStaffActivity = async (req, res) => {
        const { EntryDate, EntryTime, LocationDetails, Category, StaffName, Tonnage, EntryBy } = req.body;

        try {

            if (!EntryTime || !LocationDetails || !Category || !StaffName || !Tonnage || !EntryBy) {
                return invalidInput(res, 'EntryTime, LocationDetails, Category, StaffName, Tonnage, EntryBy is required')
            }

            const request = new sql.Request()
                .input('EntryDate', EntryDate ? new Date(EntryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                .input('EntryTime', EntryTime)
                .input('LocationDetails', LocationDetails)
                .input('Category', Category)
                .input('StaffName', StaffName)
                .input('Tonnage', Tonnage)
                .input('EntryBy', EntryBy)
                .query(`
                    INSERT INTO tbl_StaffActivity
                        (EntryDate, EntryTime, LocationDetails, Category, StaffName, Tonnage, EntryBy)
                    VALUES
                        (@EntryDate, @EntryTime, @LocationDetails, @Category, @StaffName, @Tonnage, @EntryBy) `)
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

    const editStaffActivity = async (req, res) => {
        const { Id, EntryDate, EntryTime, LocationDetails, Category, StaffName, Tonnage, EntryBy } = req.body;

        if (!Id || !EntryDate || !EntryTime || !LocationDetails || !Category || !StaffName || !Tonnage || !EntryBy) {
            return invalidInput(res, 'Id, EntryDate, EntryTime, LocationDetails, Category, StaffName, Tonnage, EntryBy is required')
        }

        try {
            const request = new sql.Request()
                .input('Id', Id)
                .input('EntryDate', EntryDate ? new Date(EntryDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                .input('EntryTime', EntryTime)
                .input('LocationDetails', LocationDetails)
                .input('Category', Category)
                .input('StaffName', StaffName)
                .input('Tonnage', Tonnage)
                .input('EntryBy', EntryBy)
                .query(`
                    UPDATE
                        tbl_StaffActivity
                    SET
                        EntryDate = @EntryDate,
                        EntryTime = @EntryTime,
                        LocationDetails = @LocationDetails,
                        Category = @Category,
                        StaffName = @StaffName,
                        Tonnage = @Tonnage,
                        EntryBy = @EntryBy
                    WHERE
                        Id = @Id`)

            const result = await request;

            if (result.rowsAffected[0] > 0) {
                success(res, 'Changes saved')
            } else {
                falied(res)
            }

        } catch (e) {
            servError(e, res);
        }
    }

    const getUniqueStaff = async (req, res) => {
        try {
            const request = new sql.Request()
                .query(`SELECT DISTINCT StaffName FROM tbl_StaffActivity`)

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

    const getStaffBased = async (req, res) => {
        const { reqDate, reqLocation } = req.query;

        if (!reqLocation) {
            return invalidInput(res, 'reqLocation is required');
        }

        try {
            const request = new sql.Request()
                .input('date', reqDate ? new Date(reqDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
                .input('location', reqLocation)
                .query(`
                    SELECT
                    	DISTINCT us.StaffName,
                    	COALESCE((
                    		SELECT 
                        		DISTINCT uc.Category,
                    			COALESCE((
                    				SELECT
                    					TOP (1) *
                    				FROM
                    					tbl_StaffActivity
                    				WHERE
                    					us.EntryDate = @date
                    					AND
                    					us.LocationDetails = @location
                    					AND
                    					Category = uc.Category
                    					AND
                    					StaffName = us.StaffName
                    					AND EntryTime IN (
                    						SELECT 
                    							Max(EntryTime) as EntryTime 
                    						FROM 
                    							tbl_StaffActivity 
                    						WHERE 
                    							EntryDate = @date
                    							AND
                    							LocationDetails = @location
                    					)
                    				FOR JSON PATH, WITHOUT_ARRAY_WRAPPER
                    			), '{}') AS StaffDetails
                    		FROM
                        		tbl_StaffActivity AS uc
                    		WHERE
                    			uc.EntryDate = @date
                    			AND
                    			uc.LocationDetails = @location
                    		ORDER BY
                    			uc.Category
                        FOR JSON PATH
                    	), '[]') AS Categories
                    FROM
                    	tbl_StaffActivity AS us
                    WHERE
                    	us.EntryDate = @date
                    	AND
                    	us.LocationDetails = @location
                        AND
                        us.StaffName NOT LIKE '%NOT%'
                        AND 
	                    us.EntryTime = (
	                    	SELECT 
	                    		Max(EntryTime) as EntryTime 
	                    	FROM 
	                    		tbl_StaffActivity 
	                    	WHERE 
	                    		EntryDate = @date
	                    		AND
	                    		LocationDetails = @location
	                    )
                    `)
            const result = await request;

            if (result.recordset.length > 0) {
                const levelOneParse = result.recordset?.map(o => ({
                    ...o,
                    Categories: JSON.parse(o?.Categories)
                }))

                const levelTowParse = levelOneParse?.map(o => ({
                    ...o,
                    Categories: o?.Categories?.map(oo => ({
                        ...oo,
                        StaffDetails: JSON.parse(oo?.StaffDetails)
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


    return {
        getStaffActivity,
        getStaffActivityNew,
        postStaffActivity,
        editStaffActivity,
        getUniqueStaff,
        getStaffBased
    }

}

module.exports = StaffActivityControll()
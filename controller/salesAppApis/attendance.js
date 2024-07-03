const sql = require("mssql");
const { servError, falied, checkIsNumber, invalidInput } = require('../res');

const SalesPersonAttendance = () => {

    const getSalesPersonAttendance = async (req, res) => {
        const { From, To, UserId } = req.query;

        try {
            const fetch = await import('node-fetch').then(mod => mod.default);
            const api = 'http://shrifoodsapi.erpsmt.in/api/myAttendanceHistory'

            const request = await fetch(`${api}?From=${From}&To=${To}&UserId=${UserId}`);

            if (request.ok) {
                const result = await request.json();
                res.send(result)
            } else {
                falied(res, `failed to fetch ${api}`);
            }
        } catch (e) {
            servError(e, res);
        }
    };

    const getSalesPersonDropDown = async (req, res) => {
        const { Company_id } = req.query;

        if (!checkIsNumber(Company_id)) {
            return invalidInput(res, 'Company_id is required');
        }

        try {
            const fetch = await import('node-fetch').then(mod => mod.default);
            const api = 'http://shrifoodsapi.erpsmt.in/api/masters/users/salesPerson/dropDown'

            const request = await fetch(`${api}?Company_id=${Company_id}`);

            if (request.ok) {
                const result = await request.json();
                res.send(result)
            } else {
                falied(res, `failed to fetch ${api}`);
            }
        } catch (e) {
            servError(e, res);
        }
    };



    return {
        getSalesPersonAttendance,
        getSalesPersonDropDown,
    };
};

module.exports = SalesPersonAttendance();

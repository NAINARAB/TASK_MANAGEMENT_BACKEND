import sql from 'mssql'

const authenticateToken = async (req, res, next) => {
  try {
    let databaseToken = '';
    const clientToken = req.header('Authorization');

    if (!clientToken) {
      return res.status(401).json({ data: [], message: 'Unauthorized', success: false });
    }

    const query = 'SELECT Autheticate_Id FROM tbl_Users WHERE Autheticate_Id = @clientToken';
    const request = new sql.Request();
    request.input('clientToken', clientToken);

    const result = await request.query(query);

    if (result.recordset.length > 0) {
      databaseToken = result.recordset[0].Autheticate_Id;
    }

    if (clientToken === databaseToken) {
      next();
    } else {
      return res.status(403).json({ data: [], message: 'Forbidden', success: false });
    }
  } catch (error) {
    console.error('Error during authentication:', error);
    return res.status(500).json({ message: 'Internal Server Error', success: false, data: [] });
  }
};

module.exports = authenticateToken()



const resFun = () => {

  function success(res, message, data) {
    return res.status(200).json({ data: data || [], message: message || 'Done!', success: true });
  }

  function dataFound(res, data, message) {
    return res.status(200).json({ data: data, message: message || 'Data Found', success: true });
  }

  function noData(res, message) {
    return res.status(200).json({ data: [], success: true, message: message || 'No data' })
  }

  function falied(res, message) {
    return res.status(400).json({ data: [], message: message || 'Something Went Wrong! Please Try Again', success: false })
  }

  function servError(e, res, message) {
    console.log(e);
    return res.status(500).json({ data: [], success: false, message: message || "Server error" })
  }

  function invalidInput(res, message) {
    return res.status(400).json({ data: [], success: false, message: message || 'Invalid request' })
  }

  function isValidDate(dateString) {
    const timestamp = Date.parse(dateString);
    return !isNaN(timestamp);
  }

  const LocalDateTime = () => {
    const now = new Date();
    const utcTime = now.getTime();
    const istOffsetInMilliseconds = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(utcTime + istOffsetInMilliseconds);
    const localISOTime = istTime.toISOString();

    return localISOTime;
  };

  function getCurrentTime() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  }

  const checkIsNumber = (num) => {
    return num ? isNaN(num) ? false : true : false
  }

  const isJSONString = (str) => {
    try {
      JSON.parse(str);
    } catch (e) {
      return false;
    }
    return true;
  };

  const parseNestedJSON = (obj) => {
    for (let key in obj) {
      if (typeof obj[key] === 'string' && isJSONString(obj[key])) {
        obj[key] = JSON.parse(obj[key]);
        parseNestedJSON(obj[key]); 
      } else if (typeof obj[key] === 'object') {
        parseNestedJSON(obj[key]);
      }
    }
    return obj;
  };


  return {
    success,
    dataFound,
    noData,
    falied,
    servError,
    invalidInput,
    isValidDate,
    LocalDateTime,
    getCurrentTime,
    checkIsNumber,
    isJSONString,
    parseNestedJSON,
  }
}

module.exports = resFun()
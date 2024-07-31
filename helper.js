const extractHHMM = (dateObj) => {
    const reqTime = new Date(dateObj);
    const hours = reqTime.getUTCHours();
    const minutes = reqTime.getUTCMinutes();
    const hourStr = hours < 10 ? '0' + hours : hours;
    const minutesStr = minutes < 10 ? '0' + minutes : minutes;

    return hourStr + ':' + minutesStr;
}

const ISOString = (dateObj) => {
    const receivedDate = dateObj ? new Date(dateObj) : new Date();
    return receivedDate.toISOString().split('T')[0]
}

const isValidObject = (obj) => {
    return Object.prototype.toString.call(obj) === '[object Object]' && Object.keys(obj).length !== 0;
}


module.exports = {
    extractHHMM,
    ISOString,
    isValidObject,
}
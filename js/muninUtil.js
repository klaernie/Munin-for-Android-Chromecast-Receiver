
// Munin adds some padding to the dynazoom image.
// => the final image is wider than requested
function getHDGraphWidth(realWidth) {
    return realWidth-97;
}

function getFromPinPoint(period) {
    var timestamp = Date.now();
    var pinpoint = -1;
    var oneDayInMillis = 1000*60*60*24;

    switch (period) {
        case PeriodEnum.DAY:
            // Remove 24h
            pinpoint = timestamp - oneDayInMillis;
            break;
        case PeriodEnum.WEEK:
            pinpoint = timestamp - oneDayInMillis*7;
            break;
        case PeriodEnum.MONTH:
            pinpoint = timestamp - oneDayInMillis*30;
            break;
        case PeriodEnum.YEAR:
            pinpoint = timestamp - oneDayInMillis*365;
            break;
    }

    return Math.floor(pinpoint/1000);
}

function getToPinPoint() {
    return Math.floor(Date.now() / 1000);
}

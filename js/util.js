function getHdGraphSize() {
    return [ $(window).width()*3/4, $(window).height()*3/4 ];
}

function log(msg) {
    if (DEBUG)
        console.log(msg);
}

function getMaxRows(gridItems) {
    var maxRow = 0;
    for (var i=0; i<gridItems.length; i++) {
        var y = gridItems[i].y;
        if (y > maxRow)
            maxRow = y;
    }
    return maxRow;
}

function getGridItem(gridItems, x, y) {
    for (var i=0; i<gridItems.length; i++) {
        if (gridItems[i].x == x && gridItems[i].y == y)
            return gridItems[i];
    }
    return null;
}

function getRowItems(gridItems, y) {
    var rowItems = [];
    for (var i=0; i<gridItems.length; i++) {
        if (gridItems[i].y == y)
            rowItems[rowItems.length] = gridItems[i];
    }

    return rowItems;
}

function getWidestRowItemsCount(gridItems) {
    var widestRow = -1;
    var widestRowCount = -1;

    for (var y=0; y<=getMaxRows(gridItems); y++) {
        var nbItems = getRowItems(gridItems, y).length;
        if (nbItems > widestRowCount) {
            widestRowCount = nbItems;
            widestRow = y;
        }
    }

    return widestRowCount;
}

function getLinesCount(gridItems) {
    return parseInt(getMaxRows(gridItems))+1;
}

function getPeriod(period) {
    switch (period) {
        case 'DAY': return PeriodEnum.DAY; break;
        case 'WEEK': return PeriodEnum.WEEK; break;
        case 'MONTH': return PeriodEnum.MONTH; break;
        case 'YEAR': return PeriodEnum.YEAR; break;
        default: return PeriodEnum.DAY; break;
    }
}

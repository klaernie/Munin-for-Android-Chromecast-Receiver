// Set CHROMECAST to false when debugging in a web browser
var CHROMECAST = true;
// DEBUG=false: disable logging
var DEBUG = true;

PeriodEnum = {
    DAY: { val: 'day' },
    WEEK: { val: 'week' },
    MONTH: { val: 'month' },
    YEAR: { val: 'year' }
};

window.onload = function() {
    window.gridItems = [];
    window.gridName = '';
    window.currentPeriod = PeriodEnum.DAY;

    if (CHROMECAST) {
        cast.receiver.logger.setLevelValue(0);
        window.castReceiverManager = cast.receiver.CastReceiverManager.getInstance();
        log('Starting Receiver Manager');

        // handler for the 'ready' event
        castReceiverManager.onReady = function(event) {
            log('Received Ready event: ' + JSON.stringify(event.data));
            window.castReceiverManager.setApplicationState("Application status is ready...");
            hideLoading();
        };

        // handler for 'senderconnected' event
        castReceiverManager.onSenderConnected = function(event) {
            log('Received Sender Connected event: ' + event.data);
            log(window.castReceiverManager.getSender(event.data).userAgent);
        };

        // handler for 'senderdisconnected' event
        castReceiverManager.onSenderDisconnected = function(event) {
            log('Received Sender Disconnected event: ' + event.data);
            if (window.castReceiverManager.getSenders().length == 0) {
                window.close();
            }
        };

        // handler for 'systemvolumechanged' event
        /*castReceiverManager.onSystemVolumeChanged = function(event) {
         log('Received System Volume Changed event: ' + event.data['level'] + ' ' + event.data['muted']);
         };*/

        // create a CastMessageBus to handle messages for a custom namespace
        window.messageBus = window.castReceiverManager.getCastMessageBus(
            'urn:x-cast:com.chteuchteu.munin');

        // handler for the CastMessageBus message event
        window.messageBus.onMessage = function(event) {
            log('Message [' + event.senderId + ']: ' + event.data);
            // display the message from the sender
            receiveMessage(event.data);
            // inform all senders on the CastMessageBus of the incoming message event
            // sender message listener will be invoked
            window.messageBus.send(event.senderId, event.data);
        };

        // initialize the CastReceiverManager with an application status message
        window.castReceiverManager.start({statusText: "Application is starting"});
        log('Receiver Manager started');
    } else {
        hideLoading();
        window.gridName = 'Grid test';
        initGrid();
        window.gridItems = [
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '0'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/traffic-{period}.png',
                'pluginName': 'Traffic per interface', 'serverName': 'demo.munin-monitoring.org', 'x': '1', 'y': '0'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/cpu-{period}.png',
                'pluginName': 'CPU usage', 'serverName': 'demo.munin-monitoring.org', 'x': '2', 'y': '0'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '1'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '2', 'y': '1'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '3', 'y': '1'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '2'}
        ];
        inflateGridItems();
    }
};

function hideLoading() {
    $('#preloader').delay(2500).fadeOut();
}

function initGrid() {
    $('#gridName').text(window.gridName);
}

function receiveMessage(text) {
    var jsonMessage = JSON.parse(text);
    var action = jsonMessage['action'];

    switch (action) {
        case 'inflate_grid':
            window.gridName = jsonMessage['gridName'];
            window.gridItems = jsonMessage['gridItems'];
            window.currentPeriod = getPeriod(jsonMessage['period']);
            initGrid();
            inflateGridItems();
            break;
        case 'preview':
            preview(jsonMessage["x"], jsonMessage['y']);
            break;
        case 'cancelpreview':
            cancelPreview();
            break;
        case 'refresh':
            refreshGridItems();
            break;
        case 'changePeriod':
            window.currentPeriod = getPeriod(jsonMessage['period']);
            refreshGridItems();
            break;
        default: break;
    }
}

function inflateGridItems() {
    var maxRow = getMaxRows(window.gridItems);

    for (var y=0; y<=maxRow; y++) {
        var rowItems = getRowItems(window.gridItems, y);

        var rowHtml = '';
        for (var i=0; i<rowItems.length; i++)
            rowHtml += getGridItemHtml(rowItems[i]);

        $('#gridsContainer').append('<div class="gridItemsRow">' + rowHtml + '</div>');
    }

    fluidGrid(gridItems);
}

function refreshGridItems() {
    for (var i=0; i<window.gridItems.length; i++) {
        var gridItem = window.gridItems[i];
        var graphUrl = getCacheProofGraphUrl(gridItem);
        $("[data-x='" + gridItem.x + "'][data-y='" + gridItem.y + "']").css('background-image', 'url(\'' + graphUrl + '\')');
    }
}

function getGridItemHtml(gridItem) {
    return  '<div class="gridItemContainer">' +
            '    <div class="gridItem paper">' +
            '        <div class="gridItem_graph"' +
            '           data-x="' + gridItem.x + '"' +
            '           data-y="' + gridItem.y + '"' +
            '           style="background-image:url(\'' + getCacheProofGraphUrl(gridItem) + '\')"></div>' +
            '        <div class="gridItemInfos">' +
            '            <div class="gridItem_pluginName">' + gridItem.pluginName + '</div>' +
            '            <div class="gridItem_serverName">' + gridItem.serverName + '</div>' +
            '       </div>' +
            '   </div>' +
            '</div>';
}

/**
 * Appends current time to requested URL in order to avoid receiving a cached version of the image
 *  Also, replace {period} in /multicpu1sec-{period}.png by the current period (day/week/month/year)
 */
function getCacheProofGraphUrl(gridItem) {
    var graphUrl = gridItem.graphUrl + '?' + new Date().getTime();
    return graphUrl.replace('{period}', window.currentPeriod.val);
}

function fluidGrid() {
    var gridItemsRowList = $('.gridItemsRow');

    // Set gridItemContainers width
    var gridItemMaxWidthCssAttr = $('.gridItemContainer').first().css('max-width');
    var gridItemMaxWidth = gridItemMaxWidthCssAttr.substr(0, 3);
    var widestRowItemsCount = getWidestRowItemsCount(window.gridItems);
    var width = ($('#gridsContainer').width() - 30) / widestRowItemsCount;
    if (width > gridItemMaxWidth)
        width = gridItemMaxWidth;
    width = Math.trunc(width);

    gridItemsRowList.children().css('min-width', width);

    // Set gridItem_graphs height
    var ratio = 497/228;
    gridItemsRowList.each(function() {
        $(this).find('.gridItem_graph').each(function() {
            var width = $(this).width();
            var height = width * (1/ratio);
            height = Math.trunc(height);
            $(this).css('height', height);
        });
    });
}

function preview(x, y) {
    var gridItem = getGridItem(window.gridItems, x, y);

    if (gridItem == null)
        return;

    $('.card-pluginName').text(gridItem.pluginName);
    $('.card-serverName').text(gridItem.serverName);
    // Find currently displayed graph source (try to get image from cache)
    var graphUrl = $("[data-x='" + gridItem.x + "'][data-y='" + gridItem.y + "']").css('background-image');
    // Get # from url('#')
    graphUrl = graphUrl.substr("url('".length-1, graphUrl.length);
    graphUrl = graphUrl.substr(0, graphUrl.length - "')".length-1);
    $('#card-graph').attr('src', graphUrl);
    $('#fullscreen').show();
}
function cancelPreview() {
    $('.card-pluginName').text('');
    $('.card-serverName').text('');
    $('#card-graph').attr('src', '');
    $('#fullscreen').hide();
}


/* STATIC FUNCTIONS */
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

function getPeriod(period) {
    switch (period) {
        case 'DAY': return PeriodEnum.DAY; break;
        case 'WEEK': return PeriodEnum.WEEK; break;
        case 'MONTH': return PeriodEnum.MONTH; break;
        case 'YEAR': return PeriodEnum.YEAR; break;
        default: return PeriodEnum.DAY; break;
    }
}

// Public page URL: https://chteuchteu.github.io/Munin-for-Android-Chromecast-Receiver/

// Set CHROMECAST to false when debugging in a web browser
var CHROMECAST = true;
// DEBUG=false: disable logging
var DEBUG = true;

var AUTOREFRESH_INTERVAL = 5*60*1000; // 5 minutes

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
            window.castReceiverManager.setApplicationState("Munin for Android");
            hideLoading();
        };

        // handler for 'senderconnected' event
        castReceiverManager.onSenderConnected = function(event) {
            log('Received Sender Connected event: ' + event.data);
            log(window.castReceiverManager.getSender(event.data).userAgent);
        };

        // handler for 'senderdisconnected' event
        castReceiverManager.onSenderDisconnected = function(event) {
            // Here, either the sender intentionally disconnected (closed_by_peer),
            // or the connection has been lost (transport_closed)
            log('Received Sender Disconnected event: ' + event.data);
            if (event.reason == cast.receiver.system.DisconnectReason.REQUESTED_BY_SENDER
                && window.castReceiverManager.getSenders().length == 0) {
                window.close();
            }
            else
                log('(ignoring)');
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
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '0',
                'masterName': 'munin-monitoring.org',
                'hdGraphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/if1sec_eth0-pinpoint={pinpoint1},{pinpoint2}.png?size_x={size_x}&size_y={size_y}'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'Traffic per interface', 'serverName': 'demo.munin-monitoring.org', 'x': '1', 'y': '0',
                'masterName': 'munin-monitoring.org'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'CPU usage', 'serverName': 'demo.munin-monitoring.org', 'x': '2', 'y': '0',
                'masterName': 'munin-monitoring.org'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '1',
                'masterName': 'munin-monitoring.org'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '2', 'y': '1',
                'masterName': 'munin-monitoring.org'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '3', 'y': '1',
                'masterName': 'munin-monitoring.org'},
            {'graphUrl': 'http://demo.munin-monitoring.org/munin-cgi/munin-cgi-graph/munin-monitoring.org/demo.munin-monitoring.org/multicpu1sec-{period}.png',
                'pluginName': 'multicpu1sec', 'serverName': 'demo.munin-monitoring.org', 'x': '0', 'y': '2',
                'masterName': 'munin-monitoring.org'}
        ];

        inflateGridItems();
    }
};

function hideLoading() {
    $('#preloader').delay(2500).fadeOut();
}

function initGrid() {
    $('#gridName').text(window.gridName);
    if (CHROMECAST)
        window.castReceiverManager.setApplicationState("Munin for Android: " + window.gridName);
    startAutoRefresh();
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
        case 'cancel_preview':
            cancelPreview();
            break;
        case 'refresh':
            refreshGridItems();
            break;
        case 'change_period':
            window.currentPeriod = getPeriod(jsonMessage['period']);
            refreshGridItems();
            break;
        default: break;
    }
}

/**
 * Method called once the connection with the sender is established,
 *  but also each time a change is made in the Grid on the sender
 */
function inflateGridItems() {
    var gridsContainer = $('#gridsContainer');
    gridsContainer.html('');

    var maxRow = getMaxRows(window.gridItems);

    for (var y=0; y<=maxRow; y++) {
        var rowItems = getRowItems(window.gridItems, y);

        var rowHtml = '';
        for (var i=0; i<rowItems.length; i++)
            rowHtml += getGridItemHtml(rowItems[i]);

        gridsContainer.append('<div class="gridItemsRow">' + rowHtml + '</div>');
    }

    fluidGrid();
}

function startAutoRefresh() {
    (function(){
        var f = function() {
            refreshGridItems();
        };
        window.setInterval(f, AUTOREFRESH_INTERVAL);
    })();
}

function getGridItemHtml(gridItem) {
    return  '<div class="gridItemContainer">' +
            '    <div class="gridItem paper">' +
            '        <div class="gridItem_graph"' +
            '           data-x="' + gridItem.x + '"' +
            '           data-y="' + gridItem.y + '"' +
            '           style="background-image:url(\'' + getCacheProofGraphUrl(gridItem) + '\');">' +
            '        </div>' +
            '        <div class="gridItemInfos">' +
            '            <div class="gridItem_pluginName">' + gridItem.pluginName + '</div>' +
            '            <div class="gridItem_serverName">' + gridItem.masterName + ' &bullet; ' + gridItem.serverName + '</div>' +
            '       </div>' +
            '   </div>' +
            '</div>';
}

function fluidGrid() {
    if (window.gridItems.length == 0)
        return;

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

function refreshGridItems() {
    for (var i=0; i<window.gridItems.length; i++) {
        var gridItem = window.gridItems[i];
        var graphUrl = getCacheProofGraphUrl(gridItem);
        $("[data-x='" + gridItem.x + "'][data-y='" + gridItem.y + "']").css('background-image', 'url(\'' + graphUrl + '\')');
    }
}


/**
 * Appends current time to requested URL in order to avoid receiving a cached version of the image
 *  Also, replace {period} in /multicpu1sec-{period}.png by the current period (day/week/month/year)
 */
function getCacheProofGraphUrl(gridItem) {
    var graphUrl = gridItem.graphUrl + '?' + new Date().getTime();
    return graphUrl.replace('{period}', window.currentPeriod.val);
}


function preview(x, y) {
    var gridItem = getGridItem(window.gridItems, x, y);

    if (gridItem == null)
        return;

    $('.card-pluginName').text(gridItem.pluginName);
    $('.card-serverName').text(gridItem.serverName);

    // If the masters supports HD graphs (DynazoomAvailability = TRUE), Munin for Android sent us
    // the hdGraphUrl. If not, let's just use the image currently displayed on the grid item.

    var graphUrl = '';
    var fullscreenCard = $('#fullscreenCard');
    if ('hdGraphUrl' in gridItem) { // HD graph is available
        var withPlaceholders = gridItem.hdGraphUrl;
        // Replace placeholders ({pinpoint1}, {pinpoint2}, {size_x} and {size_y})
        graphUrl = withPlaceholders.replace('{pinpoint1}', getFromPinPoint(window.currentPeriod));
        graphUrl = graphUrl.replace('{pinpoint2}', getToPinPoint());
        var graphSize = getHdGraphSize();
        graphUrl = graphUrl.replace('{size_x}', getHDGraphWidth(graphSize[0]));
        graphUrl = graphUrl.replace('{size_y}', graphSize[1]);

        // Set fullscreen container dimensions
        fullscreenCard.css('width', graphSize[0]+'px');
        var marginTop = Math.floor(graphSize[1]/2) * -1 -100;
        fullscreenCard.css('margin-top', marginTop+'px');
    } else { // Not available
        // Find currently displayed graph source (try to get image from cache)
        graphUrl = $("[data-x='" + gridItem.x + "'][data-y='" + gridItem.y + "']").css('background-image');
        // Get # from url('#')
        graphUrl = graphUrl.substr("url('".length-1, graphUrl.length);
        graphUrl = graphUrl.substr(0, graphUrl.length - "')".length-1);

        // Set fullscreen container dimensions
        fullscreenCard.css('width', '497px');
        fullscreenCard.css('margin-top', '-200px');
    }

    $('#card-graph').attr('src', graphUrl);
    $('#fullscreen').show();
}
function cancelPreview() {
    $('.card-pluginName').text('');
    $('.card-serverName').text('');
    $('#card-graph').attr('src', '');
    $('#fullscreen').hide();
}

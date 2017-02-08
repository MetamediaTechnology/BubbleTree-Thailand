/*
	#Description
	-bubbletree-to-map.js is library for create bubble tree and connect to map

	#Create By
	-Supanut Dokmaithong (supanut@mm.co.th)

	#Request Library List
	-jquery.min.js
	-bootstrap.min.js
	-jquery-migrate.min.js
	-jquery.history.js
	-raphael-min.js
	-bubbletree_edited.js
	-Tween.js
	-svgmap.js
	-jquery-jvectormap-2.0.3.min.js
	-th-map.js
*/

(function() {
    // root is window
    const root = this;

    // global variable
    var Bubble;
    var initTooltipCount;
    var serverPath;
    var category;
    var mapContentPanelId;
    var mapTitle;

    // create class constructor
    const bubbleTreeAndMap = function(objData) {
        objData = objData === undefined ? {} : objData;
        this.bubbleClass = objData.bubbleClass === undefined ? ".bubbletree" : "." + objData.bubbleClass;
        this.mapId = objData.mapId === undefined ? "#map" : "#" + objData.mapId;
        this.tooltipId = objData.tooltipId === undefined ? "#tooltip" : "#" + objData.tooltipId;
        serverPath = objData.serverPath === undefined ? "server.php" : objData.serverPath;
        mapContentPanelId = objData.mapContentPanelId === undefined ? "#maplegend-content" : "#" + objData.mapContentPanelId;
        mapTitle = objData.mapTitle === undefined ? "#map-title" : "#" + objData.mapTitle;
    }

    // public methods of bubbleTreeAndMap class
    bubbleTreeAndMap.prototype.Create = function(dataCategory, callback) {
        initTooltipCount = 0;
        var tooltipId = this.tooltipId;
        var bubbleClass = this.bubbleClass;
        callback = callback === undefined ? function() {} : callback;
        category = dataCategory === undefined ? "" : dataCategory;

        loadMap(this.mapId);
        loadBubbleTree(bubbleClass, function(buble) {
            //mousehover listener on bubble
            $(bubbleClass).delegate(".bubble_node", "hover", function(event) {
                handleTooltip(event, this, tooltipId);
            });

            callback(buble);
        });
    }

    bubbleTreeAndMap.prototype.createCache = function() {

        callServer("bubble", "", function(res) {
            var data = res.data;
            console.log(data);
            objTraversal(data);
        });
    }

    function objTraversal(obj) {
        var code = obj.name;

        callServer("mapinfo", code, function(res) {});

        if (obj.children != undefined) {
            for (var i = 0; i < obj.children.length; i++) {
                objTraversal(obj.children[i]);
            }
        }
    }

    bubbleTreeAndMap.prototype.configBubbleTree = function(Bubble, objStyle) {
        objStyle = objStyle === undefined ? {} : objStyle;
        configBubbleTree(Bubble, objStyle);
    }

    // private methods
    function callServer(mode, code, callback) {
        var url = code === "" ? "./json/" + mode + "." + category + ".json" : "./json/" + mode + "." + category + "." + code + ".json";

        $.ajax({
            dataType: "json",
            url: url,
            success: function(res) {
                if (res.code == 200) {
                    callback(res);
                } else {
                    alert("Error!");
                }
            }
        });
    }

    function loadMap(mapId) {
        $(mapId).html("");
        $(mapId).vectorMap({
            map: 'th_merc',
            zoomOnScroll: false,
            onRegionTipShow: function(event, label, code) {
                setMapTooltip(label, code);
            },
            labels: {
                // add text field to A B C regions
                regions: {
                    render: function(code) {
                        var path = $('[data-code="' + code + '"]')[0];
                        if (code == "A" || code == "B" || code == "C") {
                            return " ";
                        }
                    },
                    offsets: function(code) {
                        if (code == "A" || code == "B" || code == "C") {
                            return [140, 0];
                        }
                    }
                }
            }
        });
    }

    function loadBubbleTree(bubbleClass, callback) {
        $(bubbleClass).html("");
        callServer("bubble", "", function(res) {
            var data = res.data;
            Bubble = createBubbleTree(bubbleClass, data);
            callback(Bubble);
        });
    }

    function createBubbleTree(bubbleClass, data) {
        var Bubble = new BubbleTree({
            data: data,
            container: bubbleClass,
            nodeClickCallback: nodeClick,
            initTooltip: initTooltip
        });
        return Bubble;
    }

    function configBubbleTree(Bubble, objStyle) {
        Bubble.config.bubbleType = 'icon';
        Bubble.config.bubbleStyles = objStyle;
        Bubble.config.sortBy = 'id';
    }

    // this function using before create bubble finish
    function initTooltip(nodeObj, nodeHtml) {
        // first call initTooltip then call currentNodeToMap
        if (initTooltipCount == 0) {
            currentNodeToMap();
        }

        if (nodeHtml.tagName == 'circle') {
            var circle = nodeHtml;
            $(circle).attr("class", "bubble_node");
        } else {
            var div = nodeHtml;
            $(div).addClass("bubble_node");
        }

        initTooltipCount++;
    }

    function setMapTooltip(label, code) {
        var path = $('[data-code="' + code + '"]')[0];
        var str = "<div id='panel-tooltip'><div id='title-tooltip'>" + $(path).attr('name_th') + "</div>";
        str += "<div id='body-tooltip' style='text-align:right;'>" + $(path).attr('amount') + "บาท</div></div>";
        label.html(str);
    }

    function nodeClick(node) {
        console.log(node);
        var code = node.name;
        var color = node.color;
        var label = node.label;

        // set map title
        $(mapTitle).html(label);

        loadLegendPanel(code, color);
        loadProvinces(code, color);
    }

    function loadLegendPanel(code, color) {
        callServer("mapinfo", code, function(res) {
            var legend = res.data.legend;
            createLegendPanel(legend, generateColorRange(color, legend));
        });
    }

    function createLegendPanel(legend, colorArr) {
        var strHtml = '<table>';
        for (var i = 0; i < legend.length; i++) {
            strHtml += '\
			<tr>\
				<td><div class="legend-color" style="background: ' + colorArr[i].color + '; border-color:  rgba(128, 0, 0, 0.9)"></div></td>\
				<td>' + legend[i].min_text + ' - ' + legend[i].max_text + '</td>\
		    </tr>';
        }
        strHtml += "</table>";

        $(mapContentPanelId).html(strHtml);
    }

    function loadProvinces(code, color) {
        callServer("mapinfo", code, function(res) {
            var provinces = res.data.provinces;
            var legend = res.data.legend;
            addProvincesToMap(provinces, generateColorRange(color, legend));
        });
    }

    function addProvincesToMap(provinces, colorArr) {
        if (provinces.length != 0) {
            for (var i = 0; i < provinces.length; i++) {
                var color;
                for (var a = 0; a < colorArr.length; a++) {
                    if (provinces[i].amount >= colorArr[a].min && provinces[i].amount <= colorArr[a].max) {
                        color = colorArr[a].color;
                        break;
                    }
                }

                if (provinces[i].prov_id == "A" || provinces[i].prov_id == "B" || provinces[i].prov_id == "C") // 0 is Other type
                {
                    // add name_th to A B C circle in map
                    //$($('[data-code="'+ provinces[i].prov_id+'"]')[1]).html(provinces[i].name_th);
                    $('[data-code="' + provinces[i].prov_id + '"]').attr("style", "fill:" + color);
                    $('[data-code="' + provinces[i].prov_id + '"]').attr("name_th", provinces[i].name_th);
                    $('[data-code="' + provinces[i].prov_id + '"]').attr("amount", provinces[i].amount_text);
                } else {
                    $('[data-code="TH-' + provinces[i].prov_id + '"]').attr("style", "fill:" + color);
                    $('[data-code="TH-' + provinces[i].prov_id + '"]').attr("name_th", provinces[i].name_th);
                    $('[data-code="TH-' + provinces[i].prov_id + '"]').attr("amount", provinces[i].amount_text);
                }
            }
        } else {
            clearMapColor();
        }
    }

    function generateColorRange(color, legend) {
        color = color.replace('#', '');
        var r = color.substring(0, 2);
        var g = color.substring(2, 4);
        var b = color.substring(4, 6);
        var rTemp = r;
        var gTemp = g;
        var bTemp = b;
        var tempColor = [];
        var rangeColor = [];

        // if dark color
        if (parseInt(r, 16) < 100 || parseInt(g, 16) < 100 || parseInt(b, 16) < 100) {
            for (var i = 0; i < legend.length; i++) {
                tempColor[i] = {};
                rangeColor[i] = {};

                if (i == 0) {
                    tempColor[i].color = '#' + r + g + b;
                    tempColor[i].min = legend[legend.length - (1 + i)].min;
                    tempColor[i].max = legend[legend.length - (1 + i)].max;
                } else {
                    rTemp = parseInt(rTemp, 16);
                    gTemp = parseInt(gTemp, 16);
                    bTemp = parseInt(bTemp, 16);

                    rTemp = rTemp + 50 > 255 ? 255 : rTemp += 50;
                    gTemp = gTemp + 50 > 255 ? 255 : gTemp += 50;
                    bTemp = bTemp + 50 > 255 ? 255 : bTemp += 50;

                    rTemp = rTemp.toString(16).length < 2 ? "0" + rTemp.toString(16) : rTemp.toString(16);
                    gTemp = gTemp.toString(16).length < 2 ? "0" + gTemp.toString(16) : gTemp.toString(16);
                    bTemp = bTemp.toString(16).length < 2 ? "0" + bTemp.toString(16) : bTemp.toString(16);

                    tempColor[i].color = '#' + rTemp + gTemp + bTemp;
                    tempColor[i].min = legend[legend.length - (1 + i)].min;
                    tempColor[i].max = legend[legend.length - (1 + i)].max;
                }
            }
        } else {
            for (var i = 0; i < legend.length; i++) {
                tempColor[i] = {};
                rangeColor[i] = {};

                if (i < Math.floor(legend.length / 2)) {
                    rTemp = parseInt(r, 16);
                    gTemp = parseInt(g, 16);
                    bTemp = parseInt(b, 16);

                    rTemp = rTemp - (50 * (Math.floor(legend.length / 2) - i)) < 0 ? 0 : rTemp -= (50 * (Math.floor(legend.length / 2) - i));
                    gTemp = gTemp - (50 * (Math.floor(legend.length / 2) - i)) < 0 ? 0 : gTemp -= (50 * (Math.floor(legend.length / 2) - i));
                    bTemp = bTemp - (50 * (Math.floor(legend.length / 2) - i)) < 0 ? 0 : bTemp -= (50 * (Math.floor(legend.length / 2) - i));

                    // check string length > 2 for in hex number is 2 bit
                    rTemp = rTemp.toString(16).length < 2 ? "0" + rTemp.toString(16) : rTemp.toString(16);
                    gTemp = gTemp.toString(16).length < 2 ? "0" + gTemp.toString(16) : gTemp.toString(16);
                    bTemp = bTemp.toString(16).length < 2 ? "0" + bTemp.toString(16) : bTemp.toString(16);

                    tempColor[i].color = '#' + rTemp + gTemp + bTemp;
                    tempColor[i].min = legend[legend.length - (1 + i)].min;
                    tempColor[i].max = legend[legend.length - (1 + i)].max;
                } else if (i == Math.floor(legend.length / 2)) {
                    tempColor[i].color = '#' + r + g + b;
                    tempColor[i].min = legend[legend.length - (1 + i)].min;
                    tempColor[i].max = legend[legend.length - (1 + i)].max;
                    rTemp = r;
                    gTemp = g;
                    bTemp = b;
                } else if (i > Math.floor(legend.length / 2)) {
                    rTemp = parseInt(rTemp, 16);
                    gTemp = parseInt(gTemp, 16);
                    bTemp = parseInt(bTemp, 16);

                    rTemp = rTemp + 50 > 255 ? 255 : rTemp += 50;
                    gTemp = gTemp + 50 > 255 ? 255 : gTemp += 50;
                    bTemp = bTemp + 50 > 255 ? 255 : bTemp += 50;

                    rTemp = rTemp.toString(16).length < 2 ? "0" + rTemp.toString(16) : rTemp.toString(16);
                    gTemp = gTemp.toString(16).length < 2 ? "0" + gTemp.toString(16) : gTemp.toString(16);
                    bTemp = bTemp.toString(16).length < 2 ? "0" + bTemp.toString(16) : bTemp.toString(16);

                    tempColor[i].color = '#' + rTemp + gTemp + bTemp;
                    tempColor[i].min = legend[legend.length - (1 + i)].min;
                    tempColor[i].max = legend[legend.length - (1 + i)].max;
                }
            }
        }

        // revert array
        for (var i = 0; i < tempColor.length; i++) {
            rangeColor[i] = tempColor[tempColor.length - (i + 1)];
        }
        return rangeColor;
    }

    function clearMapColor() {
        $('path.jvectormap-region.jvectormap-element').attr("style", "");
    }

    function getCurrentHash() {
        var hash = (window.location.hash).split("/");
        var lastIndex = hash.length - 1;
        return hash[lastIndex];
    }

    function findNodeByHash(nodeList, hash) {
        for (var i = 0; i < nodeList.length; i++) {
            if (nodeList[i].urlToken == hash) {
                return nodeList[i];
            }
        }
    }

    function currentNodeToMap() {
        var currentNode = findNodeByHash(Bubble.nodeList, getCurrentHash());
        if (currentNode != undefined) {
            var nodeName = currentNode.name;
            var nodeColor = currentNode.color;
            var label = currentNode.label;

            // set map title
            $(mapTitle).html(label);

            loadLegendPanel(nodeName, nodeColor);
            loadProvinces(nodeName, nodeColor);
        } else {
            window.location = "./";
        }
    }

    function handleTooltip(event, node, tooltipId) {
        // event listener mouse move
        window.onmousemove = function(e) {
            var x = e.clientX,
                y = e.clientY;
            var tooltip = document.getElementById('tooltip');
            tooltip.style.top = (y + 20) + 'px';
            tooltip.style.left = (x + 20) + 'px';
        };

        if (event.type == 'mouseenter') {
            for (var i = 0; i < Bubble.nodeList.length; i++) {
                if (Bubble.nodeList[i].name == $(node).attr('name')) {
                    var str = "<div id='panel-tooltip'><div id='title-tooltip'>" + Bubble.nodeList[i].label + "</div>";
                    str += "<div id='body-tooltip' style='text-align:right;'>" + Bubble.nodeList[i].amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",") + " บาท</div></div>";
                    $(tooltipId).html(str);
                    $(tooltipId).attr('style', 'display:block');
                }
            }
        } else {
            $(tooltipId).attr('style', 'display:none');
        }
    }

    // set bubbleTreeAndMap to global class in window
    root.bubbleTreeAndMap = bubbleTreeAndMap;
}).call(this);
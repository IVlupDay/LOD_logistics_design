/*////////////////////////////////////////////////////////////////////////////
/   sldAssist_fu:  Statistical Linked Data Assistant for Users   v0.7.2
/   Copyright (c) 2013-2014 Hideto Sato
/
/   sldAssist_fu is freely distributable under the terms of an MIT-style license.
/   For details, see the StatLD web site: http://satolab.tiu.ac.jp/statld/
/
/   Date: 2013/11/12, Last Modified: 2014/2/1
////////////////////////////////////////////////////////////////////////////*/

var sldAssist = {};
sldAssist.fu = {};
sldAssist.fu.version = "0.7.2";
sldAssist.fu.alertErrorLevel = 0;
// This location is necessary for checking user programs.
// 0: Only text message, 1: + Exceptions, 2: + All
sldAssist.fu.tempFns = [];

/****************************************************************************
*   sldAssist.fu.Main class
*****************************************************************************/
sldAssist.fu.Main = function() {
	this.options = {
		alertAllErrors: sldAssist.fu.alertAllErrors
	};
	this.originalData = [];
	this.currentData = [];
	this.log = "";
	this.prevTime = null;
	this.isCompleted = false;
};

sldAssist.fu.Main.prototype = {
	execute: function(exeOptions) {
		try {
			this.isCompleted = false;
			this.log = "";
			var dd = new Date();
			this.startTime = dd.getTime();
			this.writeLog("main", "start");
			this.setup();
			var root = new sldAssist.plugin.Root();
			var exeOptions1 = sldAssist.utility.copyObject(exeOptions);
			root.setup(this, "root", "root", {}, exeOptions1);
			root.setData(this.originalData, this.currentData);
			root.execute();
		} catch(e) {
			this.onError(e);
		}
	},

	setup: function() {
		this.setOnError(this.options.alertAllErrors !== false);
	},

	setData: function(originalData, currentData) {
		this.originalData = originalData;
		this.currentData = currentData;
	},

	setOnError: function(alertLevel) {
		if (alertLevel === -1) {
			window.onerror = undefined;
		} else if (alertLevel > 1) {
			var _this = this;
			window.onerror = function(errMsg, errFile, errNo) {
				_this.showError(errMsg, errFile, errNo);
				//return true;    // avoid to display an error message in the browser
				return false;
			};
		}
	},

	showError: function(errMsg, errFile, errNo) {
		alert("Error: "+errMsg+"\nfile: "+errFile+" line: "+errNo);
	},

	onError: function(e) {
		if (typeof e === "object") {
			if (sldAssist.fu.alertErrorLevel > 0) {
				if (navigator.userAgent.indexOf("Firefox") >= 0) {
					var fname = sldAssist.utility.shortFileName(e.fileName);
					this.showError(e.message, fname, e.lineNumber);
				} else {
					alert(e.toString());
				}
			}
			throw e;
		} else {
			alert(e);
		}
	},

	writeLog: function(pluginName, status) {
		var dd = new Date();
		var now = dd.getTime();
		if (this.prevTime !== null) {
			var elapse = now - this.prevTime;
			this.log += elapse + " ms " + pluginName + " : " + status + "\n";
		}
		this.prevTime = now;
	},

	getData: function() {
		return this.currentData;
	},

	onComplete: function() {}
};

sldAssist.fu.main = new sldAssist.fu.Main();
sldAssist.fu.main.setOnError(sldAssist.fu.alertErrorLevel);
	// This is necessary here for checking user codes.

/****************************************************************************
*   sldAssist.plugin.AbstractPlugin class
*****************************************************************************/
sldAssist.plugin = {};

sldAssist.plugin.AbstractPlugin = function() {};

sldAssist.plugin.AbstractPlugin.prototype = {
	setup: function(main, name, nameWithSuffix, options, restOptions) {
		this.main = main;
		this.name = name;
		this.nameWithSuffix = nameWithSuffix;
		this.setOptions(options);
		this.checkOptions();
		this.nextPlugin = null;
		var nextPluginSpec = sldAssist.utility.assocShift(restOptions);
		if (! nextPluginSpec) return;
		var nextPluginName = this.getGenuineName(nextPluginSpec.key);
		if (! sldAssist.plugin[nextPluginName]) {
			throw "Illegal plugin name (" + nextPluginName + ").";
		}
		this.nextPlugin = new sldAssist.plugin[nextPluginName]();
		this.nextPlugin.setup(main, nextPluginName, nextPluginSpec.key,
			nextPluginSpec.value, restOptions);
	},

	checkOptions: function() {},

	setData: function(originalData, currentData) {
		this.originalData = originalData;
		this.currentData = currentData;
	},

	execute: function() {
		try {
			this.main.writeLog(this.name, "called");
			if (! this.checkExecute()) return;
			this.main.writeLog(this.name, "start");
			this.doExecute();
			this.main.writeLog(this.name, "end");
		} catch (e) {
			sldAssist.fu.main.onError(e);
		}
	},

	checkExecute: function() {
		return true;
	},

	doExecute: function() {
		throw "doExecute() must be overridden.";
	},

	doAfterExecute: function() {
		var data1 = sldAssist.utility.copyObject(this.currentData);
		this.main.setData(this.originalData, data1);
		if (this.nextPlugin) {
			var data2 = sldAssist.utility.copyObject(this.currentData);
			this.nextPlugin.setData(this.originalData, data2);
			this.nextPlugin.execute();
		} else {
			this.main.isCompleted = true;
			if (this.main.onComplete) this.main.onComplete();
		}
		this.originalData = this.currentData = null;
	},

	getGenuineName: function(name) {
		return name.replace(/_[0-9]{0,2}$/, "");
	},

	getDefaultOptions: function() {
		return this.defaultOptions;
	},

	setOptions: function(options) {
		sldAssist.utility.setOptions(options, this.getDefaultOptions());
		this.options = options;
	},

	getElementById: function(id) {
		var elm = document.getElementById(id);
		if (! elm) {
			throw "Illegal element id (" + id + ")";
		}
		return elm;
	},

	checkColumns: function(data, columns) {
		for (var j=0; j<columns.length; j++) {
			if (sldAssist.utility.indexOfArray(data[0], columns[j]) < 0) {
				throw "Illegal column name (" + columns[j] + ")";
			}
		}
	},

	getArrayFromCases: function(options, caseName) {
		var cases = new Array();
		for (var key in options) {
			if (this.getGenuineName(key) === caseName) {
				cases.push(options[key]);
				delete options[key];
			}
		}
		return cases;
	}
};

/****************************************************************************
*   sldAssist.plugin.Root extends sldAssist.plugin.AbstractPlugin
*****************************************************************************/
sldAssist.plugin.Root = function() {};
sldAssist.plugin.Root.prototype = new sldAssist.plugin.AbstractPlugin;

sldAssist.plugin.Root.prototype.doExecute = function() {
	this.doAfterExecute();
};

/****************************************************************************
*   sldAssist.plugin.AbstractView extends sldAssist.plugin.AbstractPlugin
*****************************************************************************/
sldAssist.plugin.AbstractView = function() {};
sldAssist.plugin.AbstractView.prototype = new sldAssist.plugin.AbstractPlugin;

sldAssist.plugin.AbstractView.prototype.checkExecute = function() {
	var _this = this;
	if (document.readyState !== "complete") {
		document.addEventListener("readystatechange", function () {
			if (document.readyState === "complete") {
				try {
					_this.execute();
				} catch (e) {
					sldAssist.fu.main.onError(e);
				}
			}
		}, false);
		return false;
	}
	return true;
};

sldAssist.plugin.AbstractView.prototype.execute = function() {
	try {
		this.main.writeLog(this.name, "called");
		if (! this.checkExecute()) return;
		this.main.writeLog(this.name, "start");
		this.doExecute();
		this.main.writeLog(this.name, "end");
		this.doAfterExecute();
	} catch (e) {
		sldAssist.fu.main.onError(e);
	}
};

/***************************************************************************
*   sldAssist.plugin.AbstractDataHandler extends sldAssist.plugin.AbstractPlugin
****************************************************************************/
sldAssist.plugin.AbstractDataHandler = function() {};
sldAssist.plugin.AbstractDataHandler.prototype = new sldAssist.plugin.AbstractPlugin;

sldAssist.plugin.AbstractDataHandler.prototype.execute = function() {
	try {
		this.main.writeLog(this.name, "called");
		if (! this.checkExecute()) return;
		this.main.writeLog(this.name, "start");
		var data = this.modifyData(this.currentData);
		if (data !== undefined) this.currentData = data;
		this.main.writeLog(this.name, "end");
		this.doAfterExecute();
	} catch (e) {
		sldAssist.fu.main.onError(e);
	}
};

sldAssist.plugin.AbstractDataHandler.prototype.modifyData = function(data) {
	throw "modifyData() must be overridden.";
};

/*****************************************************************************
*   sldAssist.plugin.AbstractHttpRequester extends sldAssist.plugin.AbstractPlugin
******************************************************************************/
sldAssist.plugin.AbstractHttpRequester = function() {};
sldAssist.plugin.AbstractHttpRequester.prototype = new sldAssist.plugin.AbstractPlugin;

sldAssist.plugin.AbstractHttpRequester.prototype.getDefaultOptions = function() {
	return {
		method: "POST",
		isDebug: false,
		timeout: 30000
	};
};

sldAssist.plugin.AbstractHttpRequester.prototype.checkExecute = function() {
	if (! this.options.textareaId) return true;
	if (document.getElementById(this.options.textareaId)) return true;
	return sldAssist.plugin.AbstractView.prototype.checkExecute.apply(this);
};

sldAssist.plugin.AbstractHttpRequester.prototype.createHttpRequest = function() {
	var xmlhttp = null;
	if(window.XMLHttpRequest) {
		xmlhttp = new XMLHttpRequest();
		var ver = navigator.userAgent.toLowerCase();
		if ((ver.indexOf('msie') === -1) && (ver.indexOf('trident') === -1)) {
			// Exclude for IE. IE11 causes InvalidStateError.
			xmlhttp.timeout = this.options.timeout;
			xmlhttp.addEventListener("timeout", function() {
				alert("HttpRequest Query Timeout !");
				return true;
			});
		}
	} else if(window.ActiveXObject) {
		// Code for older versions of IE, like IE6 and before.
		xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
	} else {
		throw 'Your browser does not support XMLHttpRequests.';
	}
	return xmlhttp;
};

sldAssist.plugin.AbstractHttpRequester.prototype.setRequestHeader = function(xmlhttp) {
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlhttp.setRequestHeader("Accept", "application/xml");
};

sldAssist.plugin.AbstractHttpRequester.prototype.getQueryPart = function() {
	if (! this.options.query) {
		if (this.options.textareaId) {
			this.options.query = this.getElementById(this.options.textareaId).value;
		}
	}
	return this.options.query;
};

sldAssist.plugin.AbstractHttpRequester.prototype.doExecute = function() {
	var xmlhttp = this.createHttpRequest();
	var querypart = this.getQueryPart();
	if (this.options.method === "POST") {
		xmlhttp.open('POST', this.options.endpoint, true);
	} else {
		var url = this.options.endpoint + "?" + querypart;
		xmlhttp.open('GET', url, true);
		querypart = null;
	}
	this.setRequestHeader(xmlhttp);
	var _this = this;
	xmlhttp.onreadystatechange = function() {
		if(xmlhttp.readyState === 4) {
			if(xmlhttp.status === 200) {
				if(_this.isDebug) alert(xmlhttp.responseText);
				_this.onSuccess(xmlhttp);
			} else {
				_this.onError(xmlhttp.status, xmlhttp.responseText);
			}
		}
	};
	xmlhttp.send(querypart);
};

sldAssist.plugin.AbstractHttpRequester.prototype.onSuccess = function(xmlhttp) {
	throw "AbstractHttpRequester.onSuccess must be overriden.";
};

sldAssist.plugin.AbstractHttpRequester.prototype.onError = function(textStatus, responseText) {
	alert( "HttpRequest Error: " + textStatus + "\n" + responseText );
};

/****************************************************************************
*   sldAssist.plugin.sparql extends sldAssist.plugin.AbstractHttpRequester
*****************************************************************************/
sldAssist.plugin.sparql = function() {};
sldAssist.plugin.sparql.prototype = new sldAssist.plugin.AbstractHttpRequester;

sldAssist.plugin.sparql.prototype.getQueryPart = function() {
	sldAssist.plugin.AbstractHttpRequester.prototype.getQueryPart.apply(this);
	if (! this.options.query) {
		throw "query must be given for SPARQL.";
	}
	var kp = "";
	if (this.options.keyPhrase) {
		kp = this.options.keyPhrase + "&";
	}
	return kp + "query=" + encodeURIComponent(this.options.query);
};

sldAssist.plugin.sparql.prototype.setRequestHeader = function(xmlhttp) {
	xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
	xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");
};

sldAssist.plugin.sparql.prototype.onSuccess = function(xmlhttp) {
	try {
		// Convert result to JSON
		var jsonObj = eval('(' + xmlhttp.responseText + ')');

		var head, rows1;
		if (jsonObj.responseJSON) {
			head = jsonObj.responseJSON.head.vars;
			rows1 = jsonObj.responseJSON.results.bindings;
		} else {
			head = jsonObj.head.vars;
			rows1 = jsonObj.results.bindings;
		}
		if (rows1.length === 0) {
			alert("Sparql query: No result");
			return;
		}
		var rows2 = new Array();
		rows2.push(head);
		for (var i=0; i<rows1.length; i++) {
			var row = new Array();
			for (var j=0; j<head.length; j++) {
				var item = head[j];
				var val;
				if (rows1[i][item] !== undefined) {
					val = rows1[i][item].value;
					var type = rows1[i][item].type;
					if (type === "typed-literal") {
						var datatype = rows1[i][item].datatype;
						if ((datatype === "http://www.w3.org/2001/XMLSchema#decimal")
								|| (datatype === "http://www.w3.org/2001/XMLSchema#integer")) {
							val = Number(val);
						}
					}
					// if (sldAssist.utility.isNumeric(val)) val = Number(val); // Herein, == must be used.
					if (val === "true") val = true;
					if (val === "false") val = false;
				} else {
					val = "";
				}
				row.push(val);
			}
			rows2.push(row);
		}
		this.originalData = this.currentData = rows2;
		this.doAfterExecute();
	} catch (e) {
		sldAssist.fu.main.onError(e);
	}
};

/****************************************************************************
*   sldAssist.plugin.data_show extends sldAssist.plugin.AbstractView
*****************************************************************************/
sldAssist.plugin.data_show = function() {};
sldAssist.plugin.data_show.prototype = new sldAssist.plugin.AbstractView();

sldAssist.plugin.data_show.prototype.doExecute = function() {
	if (this.options) {
		if (this.options.title === undefined)
			this.options.title = this.nameWithSuffix;
		var html = this.getTableHtml(this.currentData, this.options);
		if (this.options.placeId) {
			this.getElementById(this.options.placeId).innerHTML = html;
		} else {
			var bodyElements = document.getElementsByTagName("body");
			var divElement = document.createElement("div");
			divElement.innerHTML = "<br>" + html;
			bodyElements[0].appendChild(divElement);
		}
	}
};

sldAssist.plugin.data_show.prototype.getTableHtml = function(data, options) {
	var useHeader = ! (options.useHeader === false);
	var showRowNumber = ! (options.showRowNumber === false);
	var html =
			"<style> .sldAssistTbl, .sldAssistTbl th, .sldAssistTbl td { "
			+ "border:1px solid gray;}</style>" +
			"<table class='sldAssistTbl'>" ;
	if (options.title) {
		html += "<caption>" + options.title + "</caption>";
	}
	var i1 = 0;
	if (useHeader) {
		html += " <tr>";
		if (showRowNumber) html += "<th col='0' row='0'" + ">No.</th>";
		for(var j=0; j<data[0].length; j++) {
			html += " <th col='" + (j+1) + "' row='0'>" + data[0][j] + "</th>";
		}
		html += "</tr>";
		i1 = 1;
	}
	var fno = -1;
	if (options.clickableColNames && options.onclick) {
		var f = function(elm) {
			var rowNo = elm.parentNode.getAttribute("row");
			var colNo = elm.parentNode.getAttribute("col");
			options.onclick({row:rowNo, column:colNo});
		};
		sldAssist.fu.tempFns.push(f);
		fno = sldAssist.fu.tempFns.length - 1;
	}
	for(var i = i1; i<  data.length; i++) {
		html += " <tr>";
		if (showRowNumber) html += "<th col='0' row='" + i + "'>" + i + "</th>";
		for(j=0; j<data[i].length; j++) {
			html += " <td col='" + (j+1) + "' row='" + i + "'>";
			if ((fno >= 0) &&
					sldAssist.utility.indexOfArray(options.clickableColNames,
					data[0][j]) >= 0) {
				html += "<a href='javascript:void(0)' onclick='sldAssist.fu.tempFns["
						+ fno + "](this)'>" + data[i][j] + "</a>";
			} else {
				html += data[i][j];
			}
			html += "</td>";
		}
		html += "</tr>";
	}
	html += "</table>" ;
	return html;
};

/****************************************************************************
*   sldAssist.plugin.jqDialog extends sldAssist.plugin.data_show
*****************************************************************************/
sldAssist.plugin.jqDialog = function() {};
sldAssist.plugin.jqDialog.prototype = new sldAssist.plugin.data_show();

sldAssist.plugin.jqDialog.prototype.doExecute = function() {
	if (this.options.placeId) {
		if (! this.options.showRowNumber) this.options.showRowNumber = false;
		var html = this.getTableHtml(this.currentData, this.options);
		var $dialog = $("#" + this.options.placeId);
		$dialog.html(html);
		$dialog.dialog({ modal: true, width: "auto" });
		if (this.options.top) $dialog.parent().css("top", this.options.top);
		if (this.options.left) $dialog.parent().css("left", this.options.left);
	}
};

/****************************************************************************
*   sldAssist.plugin.data_get extends sldAssist.plugin.AbstractView
*****************************************************************************/
sldAssist.plugin.data_get = function() {};
sldAssist.plugin.data_get.prototype = new sldAssist.plugin.AbstractView();

sldAssist.plugin.data_get.prototype.checkExecute = function() {
	return sldAssist.plugin.AbstractHttpRequester.prototype.checkExecute.apply(this);
};

sldAssist.plugin.data_get.prototype.doExecute = function() {
	var text;
	if (this.options.type === "tabText") {
		text= this.getTabText(this.currentData);
	} else {
		text= this.getArrayText(this.currentData);
	}
	if (this.options.textareaId) {
		this.getElementById(this.options.textareaId).value = text;
	} else {
		var bodyElements = document.getElementsByTagName("body");
		var divElement = document.createElement("div");
		var html = "<textarea style = 'width:600px; height:150px;'>"
			+ text + "</textarea>";
		divElement.innerHTML = "<br>" + html;
		bodyElements[0].appendChild(divElement);
	}
};

sldAssist.plugin.data_get.prototype.getArrayText = function(data) {
	var text = "[";
	var firstI = true;
	for (var i=0; i<data.length; i++) {
		if (firstI) { firstI=false; } else { text += ",\n";}
		text += "[";
		var firstJ = true;
		for (var j=0; j<data[i].length; j++) {
			if (firstJ) { firstJ=false; } else { text += ",";}
			var val = data[i][j];
			if (sldAssist.utility.isNumeric(val)) {
				text += val;
			} else {
				text += "'" + val + "'";
			}
		}
		text += "]";
	}
	text += "]\n";
	return text;
};

sldAssist.plugin.data_get.prototype.getTabText = function(data) {
	var text = "";
	for (var i=0; i<data.length; i++) {
		var firstJ = true;
		for (var j=0; j<data[i].length; j++) {
			if (firstJ) { firstJ=false; } else { text += "\t";}
			text += data[i][j];
		}
		text += "\n";
	}
	return text;
};

/****************************************************************************
*   sldAssist.plugin.showLog extends sldAssist.plugin.AbstractView
*****************************************************************************/
sldAssist.plugin.showLog = function() {};
sldAssist.plugin.showLog.prototype = new sldAssist.plugin.AbstractView();

sldAssist.plugin.showLog.prototype.doExecute = function() {
	if (this.options) {
		var log = this.main.log.replace(/\n/g, "<br>");
		if (this.options.placeId) {
			this.getElementById(this.options.placeId).innerHTML = log;
		} else {
			var bodyElements = document.getElementsByTagName("body");
			var divElement = document.createElement("div");
			divElement.innerHTML = "<br>" + log;
			bodyElements[0].appendChild(divElement);
		}
	}
};

/****************************************************************************
*   sldAssist.plugin.ccchart extends sldAssist.plugin.AbstractView
*****************************************************************************/
sldAssist.plugin.ccchart = function() {};
sldAssist.plugin.ccchart.prototype = new sldAssist.plugin.AbstractView();

sldAssist.plugin.ccchart.prototype.doExecute = function() {
	var placeId = this.options.placeId;
	delete this.options.placeId;
	ccchart.init(placeId, { config: this.options, data:this.currentData });
};

/****************************************************************************
*   sldAssist.plugin.gMapChart extends sldAssist.plugin.AbstractView
*****************************************************************************/
sldAssist.plugin.gMapChart = function() {};
sldAssist.plugin.gMapChart.prototype = new sldAssist.plugin.AbstractView();

sldAssist.plugin.gMapChart.prototype.doExecute = function() {
	var place = this.getElementById(this.options.placeId);
	var circleOptionsArray = this.getArrayFromCases(this.options, "circleOptions");
	delete this.options.placeId;
	var map = new sldAssist.gmap.MapChart(place, this.options);
	map.draw(this.currentData, circleOptionsArray);
};

/**************************************************************************************
*   sldAssist.plugin.gChart   Google Chart Adapter extends sldAssist.plugin.AbstractPlugin
***************************************************************************************/
if ((typeof google !== "undefined") && google.setOnLoadCallback) {
	sldAssist.plugin.gChartLoaded = false;
	google.setOnLoadCallback( function() { sldAssist.plugin.gChartLoaded = true; } );

	sldAssist.plugin.gChart = function() {};
	sldAssist.plugin.gChart.prototype = new sldAssist.plugin.AbstractPlugin;

	sldAssist.plugin.gChart.prototype.checkExecute = function() {
		var _this = this;
		var chartType = this.options.chartType;
		if ((google.visualization === undefined)
				|| (google.visualization.arrayToDataTable === undefined)
				|| (google.visualization[chartType] === undefined)) {
			if (sldAssist.plugin.gChartLoaded) {
				throw "Illegal Google Chart Type: " + chartType;
			} else {
				google.setOnLoadCallback(function() {
					try {
						_this.execute();
					} catch (e) {
						sldAssist.fu.main.onError(e);
					}
				});
				return false;
			}
		}
		return sldAssist.plugin.AbstractView.prototype.checkExecute.apply(this);
	};

	sldAssist.plugin.gChart.prototype.doExecute = function() {
		var chartType = this.options.chartType;
		var placeId = this.options.placeId;
		var data1;
		if (chartType !== "Table") {
			data1 = google.visualization.arrayToDataTable(this.currentData);
		} else {
			var data = this.currentData;
			var data1 = google.visualization.arrayToDataTable(new Array());
			for (var j=0; j<data[1].length; j++) {
				var tp = typeof data[1][j];
				if (tp === "number") {
					data1.addColumn('number', data[0][j]);
				} else if (tp === "string") {
					data1.addColumn('string', data[0][j]);
				} else if (tp === "boolean") {
					data1.addColumn('boolean', data[0][j]);
				} else {
					var msg = "sldAssist_gchart drawTable: Unsupported type = " + tp;
					sldAssist_main.throwException(msg);
				}
			}
			var data2 = sldAssist.utility.copyObject(data);
			data2.shift();
			data1.addRows(data2);
		}
		var chart = new google.visualization[chartType](this.getElementById(placeId));
		delete this.options.chartType;
		delete this.options.placeId;
		chart.draw(data1, this.options);
		if (this.options.onclick) {
			google.visualization.events.addListener(chart, 'click', this.options.onclick);
		}
		this.doAfterExecute();
	};

} // end of if (google !== undefined)

/****************************************************************************
*   DataHandlers
*****************************************************************************/
// sldAssistOptions
sldAssist.plugin.sldAssistOptions = function() {};
sldAssist.plugin.sldAssistOptions.prototype = new sldAssist.plugin.AbstractPlugin();

sldAssist.plugin.sldAssistOptions.prototype.doExecute = function() {
	if (this.options) {
		sldAssist.fu.main.options = this.options;
		sldAssist.fu.main.setup();
	}
	this.doAfterExecute();
};

// data_set
sldAssist.plugin.data_set = function() {};
sldAssist.plugin.data_set.prototype = new sldAssist.plugin.AbstractPlugin();

sldAssist.plugin.data_set.prototype.checkExecute = function() {
	return sldAssist.plugin.AbstractHttpRequester.prototype.checkExecute.apply(this);
};

sldAssist.plugin.data_set.prototype.doExecute = function() {
	var data;
	if (this.options instanceof Array) {
		data = this.options;
	} else if (this.options.data instanceof Array) {
		data = this.options.data;
	} else {
		var text;
		if (this.options.textareaId) {
			text = this.getElementById(this.options.textareaId).value;
		} else {
			text = this.options.data;
		}
		data = this.getArrayFromTabText(text);
	}
	this.originalData = this.currentData = data;
	this.doAfterExecute();
};

sldAssist.plugin.data_set.prototype.getArrayFromTabText = function(text) {
	var lines = text.split("\n");
	var rows = new Array();
	for (var i=0; i<lines.length; i++) {
		if (! lines[i]) continue;
		var row = lines[i].split("\t");
		for (var j=0; j<row.length; j++) {
			if (sldAssist.utility.isNumeric(row[j])) row[j] = Number(row[j]);
		}
		rows.push(row);
	}
	return rows;
};

// data_reset
sldAssist.plugin.data_reset = function() {};
sldAssist.plugin.data_reset.prototype = new sldAssist.plugin.AbstractPlugin();

sldAssist.plugin.data_reset.prototype.doExecute = function() {
	if (this.options) this.currentData = sldAssist.utility.copyObject(this.originalData);
	this.doAfterExecute();
};

// data_fix
sldAssist.plugin.data_fix = function() {};
sldAssist.plugin.data_fix.prototype = new sldAssist.plugin.AbstractPlugin();

sldAssist.plugin.data_fix.prototype.doExecute = function() {
	if (this.options) this.originalData = sldAssist.utility.copyObject(this.currentData);
	this.doAfterExecute();
};

/****************************************************************************
*   sldAssist.plugin.data_XXXX extends AbstractDataHandler
*****************************************************************************/
// data_columns
sldAssist.plugin.data_columns = function() {};
sldAssist.plugin.data_columns.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_columns.prototype.modifyData = function(data1) {
	this.checkColumns(data1, this.options);
	var data2 = new Array();
	for (var i=0; i<data1.length; i++) {
		data2[i] = new Array();
		for (var j=0; j<data1[i].length; j++) {
			var j2 = sldAssist.utility.indexOfArray(this.options, data1[0][j]);
			if (j2 >= 0) data2[i][j2] = data1[i][j];
		}
	}
	return data2;
};

// data_rows
sldAssist.plugin.data_rows = function() {};
sldAssist.plugin.data_rows.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_rows.prototype.modifyData = function(data1) {
	var type = "select";
	var list;
	if (this.options instanceof Array) {
		list = this.options;
	} else {
		type = this.options.type;
		list = this.options.list;
	}
	var data2 = new Array();
	data2[0] = data1[0];
	if (type === "remove") {
		for (var i=1; i<data1.length; i++) {
			if (sldAssist.utility.indexOfArray(list, i) < 0) {
				data2.push(data1[i]);
			}
		}
	} else {
		for (var i=0; i<list.length; i++) {
			if ((list[i] > 0) && (data1[list[i]] !== undefined)) {
				data2.push(data1[list[i]]);
			}
		}
	}
	return data2;
};

// data_transpose
sldAssist.plugin.data_transpose = function() {};
sldAssist.plugin.data_transpose.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_transpose.prototype.modifyData = function(data1) {
	var data2 = data1;
	if (this.options) {
		var data2 = new Array();
		for (var i=0; i<data1.length; i++) {
			for (var j=0; j<data1[i].length; j++) {
				if (data2[j] === undefined) data2[j] = new Array();
				data2[j][i] = data1[i][j];
			}
		}
	}
	return data2;
};

// data_toMatrix
sldAssist.plugin.data_toMatrix = function() {};
sldAssist.plugin.data_toMatrix.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_toMatrix.prototype.modifyData = function(data1) {
	var data2 = new Array();
	data2[0] = new Array();
	var h, k, m;
	if (this.options.length === 3) {
		this.checkColumns(data1, this.options);
		h = sldAssist.utility.indexOfArray(data1[0], this.options[0]);  // 1st dim
		if (h < 0) throw "[Error in makeCube] no column: " + this.options[0];
		k = sldAssist.utility.indexOfArray(data1[0], this.options[1]);  // 2nd dim
		if (k < 0) throw "[Error in makeCube] no column: " + this.options[1];
		m = sldAssist.utility.indexOfArray(data1[0], this.options[2]);  // measure
		if (m < 0) throw "[Error in makeCube] no column: " + this.options[2];
	} else {
		h = 0; k = 1; m = 2;
	}
	var firstCol = new Array();
	for (var i=1; i<data1.length; i++) {
		firstCol.push(data1[i][h]);
	}
	firstCol = sldAssist.utility.uniqueArray(firstCol);
	var firstRow = new Array();
	for (var i=1; i<data1.length; i++) {
		firstRow.push(data1[i][k]);
	}
	firstRow = sldAssist.utility.uniqueArray(firstRow);
	data2[0][0] = data1[0][h];
	for (var j=0; j<firstRow.length; j++) {
		data2[0][j+1] = firstRow[j];
	}
	for (var i=0; i<firstCol.length; i++) {
		data2[i+1] = new Array();
		data2[i+1][0] = firstCol[i];
	}
	for (var i=1; i<data1.length; i++) {
		var i1 = sldAssist.utility.indexOfArray(firstCol, data1[i][h]) + 1;
		var j1 = sldAssist.utility.indexOfArray(firstRow, data1[i][k]) + 1;
		data2[i1][j1] = data1[i][m];
	}
	return data2;
};

// data_firstRow
sldAssist.plugin.data_firstRow = function() {};
sldAssist.plugin.data_firstRow.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_firstRow.prototype.modifyData = function(data1) {
	var data2 = sldAssist.utility.copyObject(data1);
	data2[0] = this.options;
	return data2;
};

// data_firstColumn
sldAssist.plugin.data_firstColumn = function() {};
sldAssist.plugin.data_firstColumn.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_firstColumn.prototype.modifyData = function(data1) {
	var data2 = sldAssist.utility.copyObject(data1);
	for (var i=0; i<data1.length; i++) {
		data2[i][0] = this.options[i];
	}
	return data2;
};

// data_trim
sldAssist.plugin.data_trim = function() {};
sldAssist.plugin.data_trim.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_trim.prototype.modifyData = function(data1) {
	if ((this.options === true) || (this.options === "1")) this.options = "/#:-";
	var data2 = data1;
	var data2 = new Array();
	for (var i=0; i<data1.length; i++) {
		data2[i] = new Array();
		for (var j=0; j<data1[i].length; j++) {
			data2[i][j] = this.trimResourceId(data1[i][j]);
		}
	}
	return data2;
};

sldAssist.plugin.data_trim.prototype.trimResourceId = function(resourceId) {
	if (typeof resourceId !== "string") return resourceId;
	var pos1 = -1;
	if (this.options.indexOf("/") >= 0) pos1 = resourceId.lastIndexOf("/");
	var pos2 = -1;
	if (this.options.indexOf("#") >= 0) pos2 = resourceId.lastIndexOf("#");
	var pos3 = -1;
	if (this.options.indexOf(":") >= 0) pos3 = resourceId.lastIndexOf(":");
	var pos = Math.max(pos1, pos2, pos3);
	var pos4 = -1;
	if ((this.options.indexOf("-") >= 0) && (pos >= 0)) pos4 = resourceId.indexOf("-", pos);
	pos = Math.max(pos, pos4);
	if (pos < 0) return resourceId;
	return resourceId.substr(pos + 1, resourceId.length - pos - 1);
};

// data_replace
sldAssist.plugin.data_replace = function() {};
sldAssist.plugin.data_replace.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_replace.prototype.modifyData = function(data1) {
	var data2 = new Array();
	for (var i=0; i<data1.length; i++) {
		data2[i] = new Array();
		for (var j=0; j<data1[i].length; j++) {
			data2[i][j] = data1[i][j];
			for (var k in this.options) {
				if (data2[i][j] === k) data2[i][j] = this.options[k];
			}
		}
	}
	return data2;
};

// data_toString
sldAssist.plugin.data_toString = function() {};
sldAssist.plugin.data_toString.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_toString.prototype.modifyData = function(data1) {
	this.checkColumns(data1, this.options);
	var data2 = new Array();
	for (var i=0; i<data1.length; i++) {
		data2[i] = new Array();
		for (var j=0; j<data1[i].length; j++) {
			if (sldAssist.utility.indexOfArray(this.options, data1[0][j]) >= 0) {
				data2[i][j] = String(data1[i][j]);
			} else {
				data2[i][j] = data1[i][j];
			}
		}
	}
	return data2;
};

// data_edit
sldAssist.plugin.data_edit = function() {};
sldAssist.plugin.data_edit.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_edit.prototype.modifyData = function(data1) {
	var data2 = this.options(data1);
	return data2;
};

// data_change
sldAssist.plugin.data_change = function() {};
sldAssist.plugin.data_change.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_change.prototype.modifyData = function(data1) {
	var interval = 1;
	if (typeof this.options.interval !== "undefined") interval = this.options.interval;
	var rate = true;
	if (typeof this.options.rate !== "undefined") rate = this.options.rate;
	var data2 = new Array();
	data2[0] = data1[0];
	for (var i=1; i<(data1.length - interval); i++) {
		data2[i] = new Array();
		data2[i][0] = data1[i+interval][0];
		for (var j=1; j<data1[i+interval].length; j++) {
			if (rate) {
				data2[i][j] = (data1[i+interval][j] / data1[i][j] - 1) * 100;
			} else {
				data2[i][j] = data1[i+interval][j] - data1[i][j];
			}
		}
	}
	return data2;
};

// data_setRowNo
sldAssist.plugin.data_setRowNo = function() {};
sldAssist.plugin.data_setRowNo.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_setRowNo.prototype.modifyData = function(data) {
	var colName = this.options.colName;
	if (! colName) colName = "rowNo";
	data[0].unshift(colName);
	for (var i=1; i<data.length; i++) {
		data[i].unshift(i);
	}
	return data;
};

// data_setRanking
sldAssist.plugin.data_setRanking = function() {};
sldAssist.plugin.data_setRanking.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_setRanking.prototype.modifyData = function(data) {
	if (! this.options.colName) this.options.colName = "ranking";
	if (! this.options.targetColName) {
		throw "data_ranking requires targetColName.";
	}
	var targetColNo = sldAssist.utility.indexOfArray(data[0], this.options.targetColName);
	if (targetColNo < 0) {
		throw "data_ranking.targetColName is invalid.";
	}
	if (! this.options.order) this.options.order = "desc";
	data[0].push(this.options.colName);
	var newColNo = data[0].length - 1;
	var rows = new Array();
	for (var i=1; i<data.length; i++) {
		var row = {pos:i, value:data[i][targetColNo]};
		rows.push(row);
	}
	rows = sldAssist.utility.sortObjects(rows, "value", this.options.order);
	var prevValue, rank;
	for (var i=0; i<rows.length; i++) {
		if (rows[i].value === prevValue) {
			data[rows[i].pos][newColNo] = rank;
		} else {
			rank = i + 1;
			data[rows[i].pos][newColNo] = rank;
			prevValue = rows[i].value;
		}
	}
	return data;
};

// data_sort
sldAssist.plugin.data_sort = function() {};
sldAssist.plugin.data_sort.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_sort.prototype.modifyData = function(data) {
	if (! this.options.targetColName) {
		throw "data_sort requires targetColName.";
	}
	var targetColNo = sldAssist.utility.indexOfArray(data[0], this.options.targetColName);
	if (targetColNo < 0) {
		throw "data_sort.targetColName is invalid.";
	}
	if (! this.options.order) this.options.order = "desc";
	var rows = new Array();
	for (var i=1; i<data.length; i++) {
		var row = {pos:i, value:data[i][targetColNo]};
		rows.push(row);
	}
	var rows2 = sldAssist.utility.sortObjects(rows, "value", this.options.order);
	var data2 = new Array();
	data2[0] = data[0];
	for (var i=0; i<rows2.length; i++) {
		data2[i+1] = data[rows2[i].pos];
	}
	return data2;
};

// data_calc
sldAssist.plugin.data_calc= function() {};
sldAssist.plugin.data_calc.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_calc.prototype.modifyData = function(data) {
	if (! this.options) return data;
	var pattern = "[^%]*%([^%]+)%[^=]*=(.+)";
	var re = new RegExp(pattern);
	var result = this.options.match(re);
	var outputColName = result[1];
	var outputColNo = sldAssist.utility.indexOfArray(data[0], outputColName);
	var isNew = false;
	if (outputColNo < 0) {
		isNew = true;
		data[0].push(outputColName);
	}
	var formula = result[2];
	for (var i=1; i<data.length; i++) {
		var formula1 = formula;
		for (var j=0; j<data[0].length; j++) {
			if (sldAssist.utility.isNumeric(data[i][j])) {
				formula1 = formula1.replace("%" + data[0][j] + "%", data[i][j]);
			} else {
				formula1 = formula1.replace("%" + data[0][j] + "%", '"' + data[i][j] + '"');
			}
		}
		formula1 = formula1.replace(/%rowNo%/g, i);
		var val = eval(formula1);
		if (isNew) {
			data[i].push(val);
		} else {
			data[i][outputColNo] = val;
		}
	}
	return data;
};

// data_restrict
sldAssist.plugin.data_restrict= function() {};
sldAssist.plugin.data_restrict.prototype = new sldAssist.plugin.AbstractDataHandler();

sldAssist.plugin.data_restrict.prototype.modifyData = function(data1) {
	var data2 = new Array();
	data2[0] = data1[0];
	for (var i=1; i<data1.length; i++) {
		var formula = this.options;
		for (var j=0; j<data1[0].length; j++) {
			if (sldAssist.utility.isNumeric(data1[i][j])) {
				formula = formula.replace("%" + data1[0][j] + "%", data1[i][j]);
			} else {
				formula = formula.replace("%" + data1[0][j] + "%", '"' + data1[i][j] + '"');
			}
		}
		var val = eval(formula);
		if (val) {
			data2.push(data1[i]);
		}
	}
	return data2;
};

/****************************************************************************
*   geocode extends sldAssist.plugin.AbstractPlugin
*****************************************************************************/
sldAssist.plugin.geocode= function() {};
sldAssist.plugin.geocode.prototype = new sldAssist.plugin.AbstractPlugin();

sldAssist.plugin.geocode.prototype.doExecute = function() {
	var data = this.currentData;
	this.addressColNo = sldAssist.utility.indexOfArray(data[0], this.options.colNames[0]);
	var latColName = this.options.colNames[1];
	var lngColName = this.options.colNames[2];
	data[0].unshift(latColName, lngColName);
	this.geocoder = new google.maps.Geocoder();
	this.doGeocode(data, 1);
};

sldAssist.plugin.geocode.prototype.doGeocode = function(data, i) {
	var _this = this;
	this.geocoder.geocode( { address:data[i][this.addressColNo] }, function(results, status) {
		if (status !== google.maps.GeocoderStatus.OK) {
			data[i].unshift("Error code=" + status, "");
		} else {
			var latlng = results[0].geometry.location;
			data[i].unshift(latlng.lat(), latlng.lng());
		}
		i++;
		if (i < data.length) {
			_this.doGeocode(data, i);
		} else {
			_this.doAfterExecute();
		}
	});
};

/****************************************************************************
*   AbstractConnector extends sldAssist.plugin.AbstractDataHandler
*****************************************************************************/
sldAssist.plugin.AbstractConnector = function() {};
sldAssist.plugin.AbstractConnector.prototype = new sldAssist.plugin.AbstractDataHandler;

sldAssist.plugin.AbstractConnector.prototype.checkExecute = function() {
	if (this.options.counterpart.isCompleted) return true;
	var _this = this;
	this.options.counterpart.onComplete = function() {
		_this.execute();
	};
	return false;
};

/****************************************************************************
*   join extends sldAssist.plugin.AbstractConnector
*****************************************************************************/
sldAssist.plugin.join = function() {};
sldAssist.plugin.join.prototype = new sldAssist.plugin.AbstractConnector;

sldAssist.plugin.join.prototype.modifyData = function(data1) {
	var data2 = this.options.counterpart.currentData;

	function getColNos(row0, colNames) {
		var colNos = new Array();
		for (var k=0; k<colNames.length; k++) {
			var j = sldAssist.utility.indexOfArray(row0, colNames[k]);
			if (j < 0) throw "Illegal join.colName: " + colNames[k];
			colNos.push(j);
		}
		return colNos;
	}

	function getKey(row, colNos) {
		var key = "";
		for (var k=0; k<colNos.length; k++) {
			key += row[colNos[k]] + "#";
		}
		return key;
	}

	function fillInvertedFile(ifile, data, dataId, colNos) {
		for (var i=1; i<data.length; i++) {
			var key = getKey(data[i], colNos);
			if (ifile[key]) {
				if (ifile[key][dataId]) {
					ifile[key][dataId].push(i);
				} else {
					ifile[key][dataId] = [i];
				}
			} else {
				ifile[key] = {};
				ifile[key][dataId] = [i];
			}
		}
	}

	function getJoinedData(outer, ifile, data1, data2, colNos1, colNos2) {
		var data3 = new Array();

		// header
		data3[0] = sldAssist.utility.copyObject(data1[0]);
		for (var j=0; j<data2[0].length; j++) {
			if (sldAssist.utility.indexOfArray(colNos2, j) >= 0) continue;
			data3[0].push(data2[0][j]);
		}

		// data
		for (var key in ifile) {
			if (ifile[key][1] && ifile[key][2]) {
				for (var k1=0; k1<ifile[key][1].length; k1++) {
					for (var k2=0; k2<ifile[key][2].length; k2++) {
						var row = sldAssist.utility.copyObject(data1[ifile[key][1][k1]]);
						for (var j=0; j<data2[ifile[key][2][k2]].length; j++) {
							if (sldAssist.utility.indexOfArray(colNos2, j) >= 0) continue;
							row.push(data2[ifile[key][2][k2]][j]);
						}
						data3.push(row);
					}
				}
			} else {
				if (! outer) continue;
				if (ifile[key][1]) {
					for (var k1=0; k1<ifile[key][1].length; k1++) {
						var row = sldAssist.utility.copyObject(data1[ifile[key][1][k1]]);
						for (var j=0; j<data2[0].length; j++) {
							if (sldAssist.utility.indexOfArray(colNos2, j) >= 0) continue;
							row.push("");
						}
						data3.push(row);
					}
				} else {
					for (var k2=0; k2<ifile[key][2].length; k2++) {
						var row = new Array();
						for (var j=0; j<colNos2.length; j++) {
							row.push(data2[ifile[key][2][k2]][j]);
						}
						for (var j=0; j<data1[0].length; j++) {
							if (sldAssist.utility.indexOfArray(colNos1, j) >= 0) continue;
							row.push("");
						}
						for (var j=0; j<data2[ifile[key][2][k2]].length; j++) {
							if (sldAssist.utility.indexOfArray(colNos2, j) >= 0) continue;
							row.push(data2[ifile[key][2][k2]][j]);
						}
						data3.push(row);
					}
				}
			}
		}
		return data3;
	}

	var colNos1 = getColNos(data1[0], this.options.colNames1);
	var colNos2 = getColNos(data2[0], this.options.colNames2);
	var invertedFile = {};
	fillInvertedFile(invertedFile, data1, 1, colNos1);
	fillInvertedFile(invertedFile, data2, 2, colNos2);
	return getJoinedData(this.options.outer, invertedFile, data1, data2, colNos1, colNos2);
};

/****************************************************************************
*   union extends sldAssist.plugin.AbstractConnector
*****************************************************************************/
sldAssist.plugin.union = function() {};
sldAssist.plugin.union.prototype = new sldAssist.plugin.AbstractConnector;

sldAssist.plugin.union.prototype.modifyData = function(data1) {
	var data2 = this.options.counterpart.currentData;
	var data3 = new Array();
	data3[0] = sldAssist.utility.unionArrays(data1[0], data2[0]);

	function addRows(data) {
		for (var i=1; i<data.length; i++) {
			var ary = new Array();
			for (var j=0; j<data3[0].length; j++) {
				ary[j] = "";
			}
			for (var j=0; j<data[0].length; j++) {
				var k = sldAssist.utility.indexOfArray(data3[0], data[0][j]);
				ary[k] = data[i][j];
			}
			data3.push(ary);
		}
	}

	addRows(data1);
	addRows(data2);
	return sldAssist.utility.uniqueArray(data3);
};

/****************************************************************************
*   sldAssist.utility functions
*****************************************************************************/
sldAssist.Utility = function() {};
sldAssist.Utility.prototype = {
	sortObjects: function(ary, prop, order) {
		// order: "asc" or "desc"
		order = order.toLowerCase();
		if (ary.length < 2) return;
		for (var i=0; i<ary.length-1; i++) {
			var i1 = i;
			for (var i2=i+1; i2<ary.length; i2++) {
				if (order === "desc") {
					if (ary[i1][prop] < ary[i2][prop]) i1 = i2;
				} else {
					if (ary[i1][prop] > ary[i2][prop]) i1 = i2;
				}
			}
			if (i1 === i) continue;
			var obj = ary[i];
			ary[i] = ary[i1];
			ary[i1] = obj;
		}
		return ary;
	},

	assocShift: function(ob) {
		for (var key in ob) {
			if (ob.hasOwnProperty(key)) {
				var val = ob[key];
				delete ob[key];
				return {key:key, value:val};
			}
		}
	},

	setOptions: function(options, defaultOptions) {
		if (typeof defaultOptions === "undefined") return;
		if ((typeof options !== "object") || (options instanceof Array)) return;
		for (var k in defaultOptions) {
			if (typeof options[k] === "undefined") {
				options[k] = defaultOptions[k];
			}
		}
	},

	indexOfArray: function(ary, value) {
		for (var i=0; i<ary.length; i++) {
			if (this.isSame(value, ary[i])) return i;
		}
		return -1;
	},

	isSame: function(x, y) {
		if (typeof x !== typeof y) return false;
		if (typeof x === "object") {
			for (var k in x) {
				if (! this.isSame(x[k], y[k])) return false;
			}
			for (var k in y) {
				if (! this.isSame(x[k], y[k])) return false;
			}
			return true;
		}
		return (x === y);
	},

	uniqueArray: function(ary1, excludeNull) {
		var ary2 = new Array();
		for (var i=0; i<ary1.length; i++) {
			if (this.indexOfArray(ary2, ary1[i]) >= 0) continue;
			if (excludeNull && ((ary1[i]==="") || (ary1[i]===null))) continue;
			ary2.push(ary1[i]);
		}
		return ary2;
	},

	copyObject: function(obj1) {
		var obj2;
		if (obj1 instanceof Array) {
			obj2 = new Array();
			for (var i=0; i<obj1.length; i++) {
				obj2.push(this.copyObject(obj1[i]));
			}
		} else if (typeof obj1 === "object") {
			obj2 = {};
			for (var key in obj1) {
				obj2[key] = this.copyObject(obj1[key]);
			}
		} else {
			obj2 = obj1;
		}
		return obj2;
	},

	shortFileName: function(fullName) {
		var i = fullName.lastIndexOf("/");
		return fullName.substr(i+1);
	},

	isNumeric: function(val) {
		return ((val == parseInt(val)) || (val == parseFloat(val)));
		// not ===. == must be used.
	},

	unionArrays: function(ary1, ary2) {
		var ary3 = this.copyObject(ary1);
		for (var i=0; i<ary2.length; i++) {
			if (sldAssist.utility.indexOfArray(ary3, ary2[i]) < 0) {
				ary3.push(ary2[i]);
			}
		}
		return ary3;
	}
};
sldAssist.utility = new sldAssist.Utility();

/****************************************************************************
*   sldAssist.gmap.Map extends google.maps.Map
*****************************************************************************/
if ((typeof google !== "undefined") && google.maps) {
	sldAssist.gmap = {};
	sldAssist.gmap.Map = function(placeHolder, options) {
		if (! placeHolder) return;
		var defaultOptions = {
			zoom: 8,
			mapTypeId: google.maps.MapTypeId.TERRAIN,
			latlng: [-34.397, 150.644]
		};
		sldAssist.utility.setOptions(options, defaultOptions);
		if (! options.center) {
			options.center = new google.maps.LatLng(Number(options.latlng[0]),
				Number(options.latlng[1]));
		}
		delete options.latlng;
		google.maps.Map.apply(this, [placeHolder, options]);
	};

	sldAssist.gmap.Map.prototype = google.maps.Map.prototype;

/****************************************************************************
*   sldAssist.gmap.Circle extends google.maps.Circle
*****************************************************************************/
	sldAssist.gmap.Circle = function(options) {
		var defaultOptions = {
			radius: 30,
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			latlng: [-34.397, 150.644]
		};
		sldAssist.utility.setOptions(options, defaultOptions);
		if (options.center === undefined) {
			options.center = new google.maps.LatLng(
				Number(options.latlng[0]), Number(options.latlng[1]));
		}
		delete options.latlng;
		google.maps.Circle.apply(this, [options]);
	};

	sldAssist.gmap.Circle.prototype = google.maps.Circle.prototype;

/****************************************************************************
*   MapChart (module like GeoChart) extends sldAssist.gmap.Map
*****************************************************************************/
	sldAssist.gmap.MapChart = function(placeHolder, options) {
		var defaultOptions = {
			streetViewControl: false,
			panControl: false,
			showFirstInfoWindow: true,
			fixCircleSize: true
		};
		this.circles = new Array();
		this.placeHolder = placeHolder;
		this.userZoomOption = options.zoom;
		sldAssist.utility.setOptions(options, defaultOptions);
		this.options = options;
	};

	sldAssist.gmap.MapChart.prototype = sldAssist.gmap.Map.prototype;

	sldAssist.gmap.MapChart.prototype.draw = function(data, circleOptionsArray) {
		if ((! data) || (data.length < 2)) return;
		if (circleOptionsArray.length < 1) circleOptionsArray = new Array({});

		this.circleGroups = new Array();
		for (var i=0; i<circleOptionsArray.length; i++) {
			var cType = new sldAssist.gmap.CircleGroup();
			if (cType.setup(this, data, circleOptionsArray[i], i, circleOptionsArray.length)) {
				this.circleGroups.push(cType);
			}
		}

		// Note: 以下の4ケースがある。
		//    (1) latlng, zoom の両方をユーザ与える場合
		//    (2) latlngを与えて、zoomを与えない場合→zoom=8として、(1)と同じ扱い
		//    (3) zoomを与えて、latlngを自動決定する場合→fitBounds()を使用し、後でzoomを変更
		//    (4) どちらもdataから自動決定する場合→fitBounds()を使用して、latlng、zoomを決定

		if (this.options.latlng && (! this.userZoomOption)) this.options.zoom = 8;
		this.userLatLngOption = this.options.latlng;
		sldAssist.gmap.Map.apply(this, [this.placeHolder, this.options]);
		var _this = this;
		if (this.userLatLngOption) {
			setTimeout(function() {
				_this.setupCircles();
			}, 200);
		} else {
			var listner1 = google.maps.event.addListener(this, "bounds_changed", function() {
				if (_this.userZoomOption) {
					var listner2 = google.maps.event.addListener(_this, "zoom_changed", function() {
						_this.setupCircles();
						google.maps.event.removeListener(listner2);
					});
					_this.setZoom(_this.userZoomOption);  // mapのsetupが終わった後に行う。
				} else {
					_this.setupCircles();
				}
				google.maps.event.removeListener(listner1);
			});
			this.fitBounds(this.sCalcBounds(data));
		}

		// set event
		var dd = new Date();
		this.lastCheckTime = dd.getTime();
		google.maps.event.addListener(this, "mousemove", function(event) {
			_this.checkInfoWindows(event.latLng);
			return true;
		});
	};

	sldAssist.gmap.MapChart.prototype.closeAllInfoWindows = function() {
		for (var k=0; k<this.circleGroups.length; k++) {
			this.circleGroups[k].closeAllInfoWindows();
		}
	};

	sldAssist.gmap.MapChart.prototype.checkInfoWindows = function(latlng) {
		var dd = new Date();
		if ((dd.getTime() - this.lastCheckTime) < 1000) return;
		this.lastCheckTime = dd.getTime();
		for (var k=0; k<this.circleGroups.length; k++) {
			this.circleGroups[k].checkInfoWindows(latlng);
		}
	};

	sldAssist.gmap.MapChart.prototype.setupCircles = function() {
		for (var i=0; i<this.circleGroups.length; i++) {
			this.circleGroups[i].setupCircles();
		}
		if (this.options.showFirstInfoWindow) {
			this.circleGroups[0].showFirstInfoWindow();
		}
		if (this.options.fixCircleSize) {
			var _this = this;
			google.maps.event.addListener(this, "zoom_changed", function() {
				for (var i=0; i<this.circleGroups.length; i++) {
					_this.circleGroups[i].changeCircleRadius();
				}
			});
		}
	};

	sldAssist.gmap.MapChart.prototype.sCalcBounds = function(data) {
		var effectiveRowNums = new Array();
		for (var i=0; i<this.circleGroups.length; i++) {
			effectiveRowNums = this.circleGroups[i].collectEffectiveRows(effectiveRowNums);
		}
		var adjBounds = 0;	// 周囲の余裕はfitBounds()がとってくれるようだ。
		var minLat = 90;
		var maxLat = -90;
		var minLng = 180;
		var maxLng = -180;
		for (var k=0; k<effectiveRowNums.length; k++) {
			var i = effectiveRowNums[k];
			if (data[i][0] < minLat) minLat = data[i][0];
			if (data[i][0] > maxLat) maxLat = data[i][0];
			if (data[i][1] < minLng) minLng = data[i][1];
			if (data[i][1] > maxLng) maxLng = data[i][1];
		}
		var adjLat = (maxLat - minLat) * adjBounds;
		maxLat = maxLat + adjLat;
		minLat = minLat - adjLat;
		var adjLng = (maxLng - minLng) * adjBounds;
		maxLng = maxLng + adjLng;
		minLng = minLng - adjLng;
		var sw = new google.maps.LatLng(maxLat, minLng);
		var ne = new google.maps.LatLng(minLat, maxLng);
		return new google.maps.LatLngBounds(sw, ne);
	};

/****************************************************************************
*   CircleGroup    1列のデータに対応するCircle管理オブジェクト
*****************************************************************************/
	sldAssist.gmap.CircleGroup = function() {};

	sldAssist.gmap.CircleGroup.prototype = {
		setup: function(map, data, circleOptions, groupNo, groupCount) {
			this.defaultCircleColors = ["red", "aqua", "lime", "yellow", "purple", "silver"];
			this.map = map;
			this.data = data;
			this.circleOptions = circleOptions;
			this.groupNo = groupNo;
			this.groupCount = groupCount;
			return this.setDataColNo();
		},
		setDataColNo: function() {
			var dataColNo;
			if (this.circleOptions.dataColName) {
				dataColNo = sldAssist.utility.indexOfArray(this.data[0], this.circleOptions.dataColName);
			} else if (this.circleOptions.dataColNo !== undefined) {
				dataColNo = this.circleOptions.dataColNo - 1;  //ユーザのcolNoは1から始まる
			}
			if ((dataColNo === undefined) || (dataColNo < 0)) {
				if (this.data[0].length < (this.groupNo + 3)) {
					return false;
				}
				dataColNo = this.groupNo + 2;
			}
			this.dataColNo = dataColNo;
			return true;
		},
		collectEffectiveRows: function(rowNums) {
			for (var i=1; i<this.data.length; i++) {
				if (this.isCellAvailable(i)) {
					if (sldAssist.utility.indexOfArray(rowNums, i) < 0) {
						rowNums.push(i);
					}
				}
			}
			return rowNums;
		},
		isCellAvailable: function(rowNo) {
			if (this.circleOptions.minValue !== undefined) {
				if (this.data[rowNo][this.dataColNo] < this.circleOptions.minValue) return false;
			} else {
				if (! this.data[rowNo][this.dataColNo]) return false;
				if (this.data[rowNo][this.dataColNo] < 0) return false;
			}
			return true;
		},
		setupCircles: function() {
			this.setRadius();
			this.setMaxValue();
			this.createCircles();
		},
		getMeterPerPixel: function() {
			var bounds = this.map.getBounds();
			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();
			var wMeter = this.calcMeterFromLatLng(ne, sw);
			var w = this.map.placeHolder.clientWidth;
			var h = this.map.placeHolder.clientHeight;
			var wPixel = Math.sqrt(w*w + h*h);
			return wMeter / wPixel;
		},
		setRadius: function() {
			// サークルの画面上最大半径 = 11mm, mm/pixelの想定 = 0.26
			var defaultMaxRadiusPixel = 40;

			this.minRadius = this.circleOptions.minRadius;
			this.maxRadius = this.circleOptions.maxRadius;
			var maxRadiusPixel = this.circleOptions.maxRadiusPixel;
			var meterPerPixel = this.getMeterPerPixel();
			if (this.minRadius === undefined) this.minRadius = 0;
			if (this.maxRadius === undefined) {
				if (maxRadiusPixel === undefined) {
					maxRadiusPixel = defaultMaxRadiusPixel;
				}
				this.maxRadius = maxRadiusPixel * meterPerPixel;
				if (this.circleOptions.minRadiusPixel !== undefined) {
					this.minRadius = this.circleOptions.minRadiusPixel * meterPerPixel;
				}
			}
			this.maxRadiusPixel = this.maxRadius / meterPerPixel;

			// 情報の表示
			if (! this.map.options.showCalcResults) return;
			var center = this.map.getCenter();
			var zoom = this.map.getZoom();
			var text = this.data[0][this.dataColNo] + "\n\nlat = " + center.lat() + "\nlng = " + center.lng()
				+ "\nzoom = " + zoom + "\n\nmaxRadius = " + Math.round(this.maxRadius);
			setTimeout(function() { alert(text); }, 2000);
		},

		calcMeterFromLatLng: function(latlng1, latlng2) {
			// reference http://oshiete.goo.ne.jp/qa/249931.html
			// 以下を使っても良い。ただし、libraries=geometry が必要になる。
			// google.maps.geometry.spherical.computeDistanceBetween(latlng1, latlng2);
			var x1 = latlng1.lat() * Math.PI / 180.0;
			var y1 = latlng1.lng() * Math.PI / 180.0;
			var x2 = latlng2.lat() * Math.PI / 180.0;
			var y2 = latlng2.lng() * Math.PI / 180.0;
			return 6378137 * Math.sqrt(Math.pow((y1-y2)*Math.cos((x1+x2)/2),2)
				+ Math.pow(x1-x2,2));
		},

		setMaxValue: function() {
			var rowNoMax = 1;
			var dmax = this.data[1][this.dataColNo];
			for (var i=2; i<this.data.length; i++) {
				if (this.data[i][this.dataColNo] > dmax) {
					dmax = this.data[i][this.dataColNo];
					rowNoMax = i;
				}
			}
			if (this.circleOptions.baseMaxValue !== undefined) {
				dmax = this.circleOptions.baseMaxValue;
			}
			this.maxValue = dmax;
			this.rowNoMax = rowNoMax;
		},
		createCircles: function() {
			var adj = this.maxRadius / Math.sqrt(this.maxValue);
			var _this = this;
			this.circles = new Array();
			for (var i=1; i<this.data.length; i++) {
				if (! this.isCellAvailable(i)) continue;
				var circleOptions = sldAssist.utility.copyObject(this.circleOptions);

				// 半径の決定
				var radius = Math.sqrt(this.data[i][this.dataColNo]) * adj;
				if (radius < this.minRadius) radius = this.minRadius;
				circleOptions.radius = radius;

				// カラーの決定
				var color = this.determineColor(i);
				if (! circleOptions.strokeColor) circleOptions.strokeColor = color;
				if (! circleOptions.fillColor) circleOptions.fillColor = color;

				// その他のオプションの決定
				circleOptions.center = undefined;
				circleOptions.latlng = [ Number(this.data[i][0]), Number(this.data[i][1]) ];
				circleOptions.map = this.map;

				// データからオプション設定
				this.addOptionsFromData(i, "circle", circleOptions);

				// サークルの作成
				var circle = new sldAssist.gmap.Circle(circleOptions);
				this.circles.push(circle);
				if (i === this.rowNoMax) {
					this.circleNoMax = this.circles.length - 1;
				}
				circle.rowNo = i;
				circle.colNo = this.dataColNo;

				// InfoWindowの作成
				circle.infoWindow = this.createInfoWindow(i);
				circle.s_isOpen = false;

				// イベントの設定
				var mouseEventHdlr = function(event) {
					// Herein, _this is a circleGroup. this is a Circle.
					_this.checkCircleInfoWindow(this, event.latLng);
					return true;
				};
				google.maps.event.addListener(circle, 'mousemove', mouseEventHdlr);
				google.maps.event.addListener(circle, 'mouseover', mouseEventHdlr);
				google.maps.event.addListener(circle, 'mouseout', mouseEventHdlr);
				if (this.map.options.onclick) {
					var clickEventHdlr = function(event) {
						_this.map.options.onclick({row: this.rowNo, col: this.colNo});
					};
					google.maps.event.addListener(circle, 'mouseup', clickEventHdlr);
				}
			}
		},

		determineColor: function(rowNo) {
			var color;
			if (! this.circleOptions.color) {
				if (this.groupNo < this.defaultCircleColors.length) {
					color = this.defaultCircleColors[this.groupNo];
				} else {
					color = this.defaultCircleColors[this.defaultCircleColors.length - 1];
				}
			} else {
				return this.circleOptions.color;
			}
			var colorColNo;
			if (this.circleOptions.colorColName) {
				colorColNo = sldAssist.utility.indexOfArray(this.data[0], this.circleOptions.colorColName);
			} else if (this.circleOptions.colorColNo !== undefined) {
				colorColNo = this.circleOptions.colorColNo - 1;
			}
			if ((colorColNo !== undefined) && (colorColNo >= 0)) {
				color = this.data[rowNo][colorColNo];
			}
			return color;
		},
		addOptionsFromData: function(rowNo, type, options) {
			for (var j=0; j<this.data[0].length; j++) {
				if (typeof this.data[0][j] !== "object") continue;
				if (! this.data[0][j][type]) continue;
				var key = this.data[0][j][type];
				options[key] = this.data[rowNo][j];
			}
		},
		createInfoWindow: function(rowNo) {
			// InfoWindow size
			var infoMinWidth = 100;
			var infoMaxWidth = 300;
			if (this.circleOptions.infoMinWidth) infoMinWidth = this.circleOptions.infoMinWidth;
			if (this.circleOptions.infoMaxWidth) infoMaxWidth = this.circleOptions.infoMaxWidth;

			// InfoWindowオプションの設定
			var infoOptions = {
				content: this.getInfoWindowText(rowNo, infoMinWidth, infoMaxWidth),
				maxWidth: infoMaxWidth,
				disableAutoPan: true
			};
			if (this.circleOptions.disableAutoPan === false) {
				infoOptions.disableAutoPan = false;
			}
			this.addOptionsFromData(rowNo, "info", this.data, infoOptions);
			return new google.maps.InfoWindow(infoOptions);
		},
		getInfoWindowText: function(rowNo, infoMinWidth, infoMaxWidth) {
			// titleColNo, messageColNo
			var titleColNo, messageColNo;
			if (! this.circleOptions.contentForm) {
				if (this.circleOptions.titleColName) {
					titleColNo = sldAssist.utility.indexOfArray(this.data[0], this.circleOptions.titleColName);
				} else if (this.circleOptions.titleColNo !== undefined) {
					titleColNo = this.circleOptions.titleColNo - 1;
				}
				if (((titleColNo === undefined) || (titleColNo < 0))
						  && (this.data[0].length > (this.groupCount + 2))) {
					titleColNo = this.data[0].length - 1;
				}
				if (this.circleOptions.messageColName) {
					messageColNo = sldAssist.utility.indexOfArray(this.data[0], this.circleOptions.messageColName);
				} else if (this.circleOptions.messageColNo !== undefined) {
					messageColNo = this.circleOptions.messageColNo - 1;
				}
			}

			// contentの決定
			var text = "<div class='gmapchart-info' name='gmapchart-info' style='min-width:"
					  + infoMinWidth + "px; max-width:" + infoMaxWidth
					  + "; line-height:1.35; overflow:visible; white-space:nowrap; "
					  + "'>";
			if (this.circleOptions.contentForm) {
				var form = this.circleOptions.contentForm;
				for (var j=0; j<this.data[0].length; j++) {
					form = form.replace("%h" + (j+1) + "%", this.data[0][j]);
					form = form.replace("%" + (j+1) + "%", this.data[rowNo][j]);
					form = form.replace("%" + this.data[0][j] + "%", this.data[rowNo][j]);
				}
				text += form;
			} else {
				if (titleColNo) {
					text += "<span style='font-weight:bold'>" + this.data[rowNo][titleColNo]
							  + "</span><br>";
				}
				if (messageColNo) {
					text += "<span>" + this.data[rowNo][messageColNo] + "</span><br>";
				}
				text += "<span>" + this.data[0][this.dataColNo] + ": "
						  + this.data[rowNo][this.dataColNo] + "</span>";
			}
			text += "</div>";
			return text;
		},
		closeAllInfoWindows: function() {
			for (var i=0; i<this.circles.length; i++) {
				this.circles[i].infoWindow.close();
				this.circles[i].s_isOpen = false;
			}
		},
		checkInfoWindows: function(latlng) {
			for (var i=0; i<this.circles.length; i++) {
				this.checkCircleInfoWindow(this.circles[i], latlng);
			}
		},
		checkCircleInfoWindow: function(circle, latlng) {
			if (! circle.s_isOpen) {
				if (circle.getBounds().contains(latlng)) {
					this.map.closeAllInfoWindows();
					this.openInfoWindow(circle);
				}
			} else {
				if (circle.getBounds().contains(latlng)) {
					circle.infoWindow.setPosition(latlng);
				} else {
					circle.infoWindow.close();
					circle.s_isOpen = false;
				}
			}
		},
		openInfoWindow: function(circle) {
			circle.infoWindow.open(this.map);
			circle.s_isOpen = true;
		},
		showFirstInfoWindow: function() {
			var _this = this;
			setTimeout(function() {
				var circle = _this.circles[_this.circleNoMax];
				circle.infoWindow.setPosition(circle.getCenter());
				_this.openInfoWindow(circle);
				// 最初のinfoWindowだけは次のinfoWindow表示まで消さないため s_isOpen = false
				circle.s_isOpen = false;
			}, 1000);
		},
		changeCircleRadius: function() {
			var oldMaxRadius = this.maxRadius;
			this.maxRadius = this.maxRadiusPixel * this.getMeterPerPixel();
			var rate = this.maxRadius / oldMaxRadius;
			for (var i=0; i<this.circles.length; i++) {
				var radius = this.circles[i].getRadius();
				this.circles[i].setRadius(radius * rate);
			}
		}
	};
} // end of if (google.maps !== undefined)

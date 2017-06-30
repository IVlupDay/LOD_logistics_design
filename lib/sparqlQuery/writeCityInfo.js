/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################               Powered by konagayalab               #################### 
 * 
 * Developed by Vutha Phav
 */

// require ("/fileManipulation/writeCsv.js")

function writeCityInfo() {

	/*-- konagayalab endpoint and Sparql query string --*/
	var endpoint = "http://data.e-stat.go.jp/lod/sparql/query";
	var sparqlCode = document.getElementById("sparql").value;
	
	/*-- Assign JSON result to Google map and street visualization --*/
	executeCallback = function(queryCode) {
		
		alert("Reached executeCode Now");
		
		var jsonObj = eval('(' + queryCode + ')');
	    var searchResult = new Array();
	    
		/*
		var data = [
	                ['Foo', 'programmer'],
	                ['Bar', 'bus driver'],
	                ['Moo', 'Reindeer Hunter']
	             ];
		alert(data[0][1]); 
	    writeCsvCity(data);
	    alert("Reached here"); */
	    
	    var styles = [
	                  {
	                    "featureType": "administrative.province",
	                    "elementType": "geometry.stroke",
	                    "stylers": [
	                      { "visibility": "on" },
	                      { "weight": 2.5 },
	                      { "color": "#24b0e2" }
	                    ]
	                  },{
	                    "featureType": "road",
	                    "elementType": "geometry",
	                    "stylers": [
	                      { "visibility": "off" }
	                    ]
	                  },{
	                    "featureType": "administrative.locality",
	                    "stylers": [
	                      { "visibility": "off" }
	                    ]
	                  },{
	                    "featureType": "road",
	                    "elementType": "labels",
	                    "stylers": [
	                      { "visibility": "off" }
	                    ]
	                  }
	                ];

	                 
	    
	    for(var i = 0; i< jsonObj.results.bindings.length; i++) {
	    	
	    	 var  geocoder = new google.maps.Geocoder();
             geocoder.geocode({
                 'address': jsonObj.results.bindings[i].searchCityName.value}, function(results, status) {
               var mapOpts = {
                 mapTypeId: google.maps.MapTypeId.ROADMAP,
                 scaleControl: true,
                 scrollwheel: false,
                 styles:styles,
                 center: results[0].geometry.location,
                 zoom:6
               }
               map = new google.maps.Map(document.getElementById("map"), mapOpts);
             });
             
             
	    	// write into csv file
	    	// alert(jsonObj.results.bindings[i].cityCode.value);
	    	/*
	    	searchResult.push(jsonObj.results.bindings[i].cityCode.value, jsonObj.results.bindings[i].population.value,
	    			jsonObj.results.bindings[i].cityName.value);  */
	    	}
	    
	    /*
	    alert("Start writing csv file now...");
		writeCsvCity(searchResult);  */
	}
	
	/*-- Execute Sparql query via e-state endpoint --*/
	sparqlJPQuery(sparqlCode, endpoint, executeCallback, true);
} 

// Write result into csv file
function writeCsvCity(searchCity) {
	  
		alert("Start");
		alert(searchCity);
	  
		var csv = 'Name,Title1,Title2\n';
	    
		searchCity.forEach(function(row) {
	            csv += row.join(',');
	            csv += "\n";
	    });
	 
	    console.log(csv);
	    
	    var hiddenElement = document.createElement('a');
	    hiddenElement.href = 'data:text/csv;charset=utf-8,' + encodeURI(csv);
	    hiddenElement.target = '_blank';
	    hiddenElement.download = 'result_search.csv';
	    hiddenElement.click(); 
	    
	    
	    
	    
	    /*
	    document.body.appendChild(hiddenElement);
	    hiddenElement.click();
	    document.body.removeChild(hiddenElement);
	    */
	    //alert( hiddenElement.href);
	    
	    // window.open('data:text/csv;charset=utf-8,' + encodeURI(csv));
	    
	    // window.open('data:text/csv;charset=utf-8,' + encodeURI(csv));
	    
	    /*
	    var content = "data:text/csv;charset=utf-8,";
	  
	    searchCity.forEach(function(searchCityty, index) {
	       content += searchCity.join(",") + "\n";
	  	});
	  
	    return encodeURI(content);
	  
	    $("#download").click(function() {
	         window.open(downloadableCSV(searchCityt));
	    }); */
	  
	    alert("Done");
}
	


/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################              Powered by Konagaya Lab               #################### 
 * 
 * Developed by Vutha Phav
 */

function visualizePrefectureMap() {
	
	var endpoint = "http://data.e-stat.go.jp/lod/sparql/query"; // This endpoint allows to do multiple query
	var sparqlCode = [document.getElementById("cityMap").value, 
	                  document.getElementById("cityData").value, 
	                  document.getElementById("cityPostOffice").value]
	var sparqlCodeId = [document.getElementById("cityMap").id, 
	                    document.getElementById("cityData").id, 
	                    document.getElementById("cityPostOffice").id]; 
	
	var jsonCityMap; 
	var jsonCityData;
	var jsonCityPostOffice;
	var jsonCitySubData;
	
	var cityMap = [];
	var cityData = [];
	var cityPostOffice = [];
	
	/*-- Search city data with JSON result and assign to Google Map Street View --*/
	executeCallback = function(queryCode, sparqlId, constraintId) {
		
			if(sparqlId=="cityMap") {  
				jsonCityMap = eval('(' + queryCode + ')');
				for (var i=0; i<jsonCityMap.results.bindings.length; i++) {
					    cityMap.push([jsonCityMap.results.bindings[i].searchCityName.value, 
						              jsonCityMap.results.bindings[i].lat.value, 
						              jsonCityMap.results.bindings[i].long.value]); 
						} 
					
			} else if(sparqlId=="cityData") {
				jsonCityData = eval('(' + queryCode + ')');
				for (var i=0; i<jsonCityData.results.bindings.length; i++) {
					
					cityData.push([jsonCityData.results.bindings[i].timePeriod.value, 
					               jsonCityData.results.bindings[i].strCityCode.value,
					               jsonCityData.results.bindings[i].cityName.value, 
					               jsonCityData.results.bindings[i].areaStatus.value, 
					               jsonCityData.results.bindings[i].totalPopulation.value]);  
					    } 
					
			} else if(sparqlId=="cityPostOffice") {
				jsonCityPostOffice = eval('(' + queryCode + ')');
				
			for (var i=0; i<jsonCityPostOffice.results.bindings.length; i++) {
				cityPostOffice.push([jsonCityPostOffice.results.bindings[i].cityName.value, 
						             jsonCityPostOffice.results.bindings[i].numberPostOffice.value]);
						}
			} else { }
			
			if((cityMap.length==0)||(cityData.length==0)||(cityPostOffice.length==0)) {
			} else {
				searchCity(cityMap, cityData, cityPostOffice);
			}
	}
	
	/*-- Execute Sparql query on rdf data via multiple endpoint integration --*/
	for(var j=0; j<sparqlCode.length; j++) {
		sparqlPrefectureQuery(sparqlCodeId[j], sparqlCode[j], endpoint, executeCallback, true);
	}
}

// Search city name with latitude and longtitude 
function searchCity(cityMap, cityDataSearch, postOffice) {
	
	var cityData = [];
	
	/* Assign the LOD city with latitude and 
	 * longtitude into Google map street view
	 */
	for(var i=0; i<cityMap.length; i++) {
		for(var j=0; j<cityDataSearch.length; j++) { 
			if (cityMap[i][0].match(cityDataSearch[j][2])) { 
				for(var k=0; k<postOffice.length; k++) {
					if (cityMap[i][0].match(postOffice[k][0])) {
						cityData.push([cityDataSearch[j][0], cityMap[i][0], 
						               cityDataSearch[j][1], cityMap[i][1], 
						               cityMap[i][2], cityDataSearch[j][3], 
									   cityDataSearch[j][4],postOffice[k][1]]); 
						} else {}
					}	 
				} else {}
			}
	 	} assignGoogleMap(cityData); 
	}

function assignGoogleMap(cityData) {
	
	/*-- Google map and street view activating code --*/
    var fenway = {lat:35.687893, lng:139.697362}; // Set default position to local shop
	var map = new google.maps.Map(document.getElementById('googlemap'), {
			center: fenway, zoom: 11 });
	var panorama = new google.maps.StreetViewPanorama(document.getElementById('streetview'), {
	        position: fenway,
	        pov: { heading: 80, pitch: 0 } });
	var infowindow = new google.maps.InfoWindow();
	var marker;
	var i;
		
	/* Initiate Google map and street view with LOD city data */
	map.setStreetView(panorama);
	
	for (var i=0; i<cityData.length; i++) {
		marker = new google.maps.Marker({ 
			position: new google.maps.LatLng(cityData[i][3], cityData[i][4]), map: map 
		});  

	    /*-- Assign linked-open data result with marker on Google map street view --*/
	 	google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
	 	  	  return function() {
	 	  		  	// Assign the city LOD on Google map label 
	 	 			infowindow.setContent("Year: "+cityData[i][0]+"<br/>"+
	 	  						"City Code: "+cityData[i][2]+"<br/>"+
	 	 					    "City Name: "+cityData[i][1]+"<br/>"+
	 	 					    "City Population Status: "+cityData[i][5]+"<br/>"+
	 	 					    "City Population (2010): "+cityData[i][6]+"<br/>"+
	 	 					    "Number of Postal Office (2016): "+cityData[i][7]);
	 	  			infowindow.open(map, marker);
	 	   		    }
	 		  }) 
	 	 (marker, i));  
		 }
	}
 
	
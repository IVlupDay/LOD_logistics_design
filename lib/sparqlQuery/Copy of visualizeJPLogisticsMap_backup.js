/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################              Powered by KonagayaLab                #################### 
 * 
 * Developed by Vutha Phav
 */

function visualizeJPLogisticsMap() {

	/*-- konagayalab endpoint and Sparql query string --*/
	// var endpoint = "http://192.168.11.9/konagayalab/phnompenh/query";
	
	// var endpoint = "http://sparql.odp.jig.jp/api/v1/sparql"; // This one can't be used for multiple enndpoint query
	var endpoint = "http://data.e-stat.go.jp/lod/sparql/query";
	// var sparqlCode = document.getElementById("sparql").value;
	var sparqlCode = [document.getElementById("odpEndpoint").value, document.getElementById("eStateEndpoint").value]
	
	/*-- Assign JSON result to Google map and street visualization --*/
	executeCallback = function(queryCode) {
		
		var jsonObj = eval('(' + queryCode + ')');
		var cityData = []
	    
		/*
		var ecUserRate = 8; 
	    var distancePick = 1;
	    var numEcUser;
	    
	    -- Google map and street view activating code --
	    var fenway = {lat:35.687893, lng:139.697362}; // Set default position to local shop
 		var map = new google.maps.Map(document.getElementById('googlemap'), {
 			center: fenway, zoom: 11 });
 		var panorama = new google.maps.StreetViewPanorama(document.getElementById('streetview'), {
 	        position: fenway,
 	        pov: { heading: 80, pitch: 0 } });
 		var infowindow = new google.maps.InfoWindow();
 		var marker;
 		var i;
 		var searchCity
 		
 		/* Initiate Google map and street view 
 		map.setStreetView(panorama);  */
 		/*
 		plotGoogleMap(jsonObj.results.bindings.length, jsonObj.results.bindings[i].timePeriod.value, 
 					  jsonObj.results.bindings[i].cityCode.value, jsonObj.results.bindings[i].searchCityName.value,
 					  jsonObj.results.bindings[i].lat.value, jsonObj.results.bindings[i].long.value, 
 					  jsonObj.results.bindings[i].areaStatus.value, jsonObj.results.bindings[i].population.value, 
 					  jsonObj.results.bindings[i].sexMale.value, jsonObj.results.bindings[i].sexFemale.value, 
 					  jsonObj.results.bindings[i].numberPostOffice.value,jsonObj.results.bindings[i].numberEmployee.value) 
 					  */
 					  
 		for (var i=0; i<jsonObj.results.bindings.length; i++) {
 			cityData.push(jsonObj.results.bindings.length, jsonObj.results.bindings[i].timePeriod.value, 
 					  jsonObj.results.bindings[i].cityCode.value, jsonObj.results.bindings[i].searchCityName.value,
 					  jsonObj.results.bindings[i].lat.value, jsonObj.results.bindings[i].long.value, 
 					  jsonObj.results.bindings[i].areaStatus.value, jsonObj.results.bindings[i].population.value, 
 					  jsonObj.results.bindings[i].sexMale.value, jsonObj.results.bindings[i].sexFemale.value, 
 					  jsonObj.results.bindings[i].numberPostOffice.value,jsonObj.results.bindings[i].numberEmployee.value)
 		}
 		
 		
 		
 		
 		
 	 	// for(var i=0; i<jsonObj.results.bindings.length; i++) {
 			// for(var j=0; j<jsonObj.results.bindings.length; j++) {
 				// searchCity = jsonObj.results.bindings[i].searchCityName.value;
 				//  if(searchCity.match(jsonObj.results.bindings[j].cityName.value)) {
 					 
 					   /*
 		 				alert(jsonObj.results.bindings[i].searchCityName.value+jsonObj.results.bindings[i].lat.value+
 		 	 					 jsonObj.results.bindings[i].long.value); */
 		 		    	
 		 		    	// alert(jsonObj.results.bindings[i].cityName.value);
 		 		    	/*
 		 		    	alert(jsonObj.results.bindings[i].searchCityName.value+jsonObj.results.bindings[i].lat.value+
 		 		    			jsonObj.results.bindings[i].long.value+jsonObj.results.bindings[i].population.value+
 		 		    			jsonObj.results.bindings[i].cityName.value); */
 		 		    	// numEcUser = Math.round((jsonObj.results.bindings[i].internet.value*ecUserRate)/100);
 		 		    	
 		 		    	/*-- Estimate number of distribution center agency with minimum possible for ec user --
 		 		    	var minDistributionAgency = visualizeLogisticsMap.computeNumberAgency(ecUserRate, 
 		 		    									distancePick,jsonObj.results.bindings[i].internet.value, 
 		 		    									jsonObj.results.bindings[i].number.value).min;
 		 		     	var maxDistributionAgency = visualizeLogisticsMap.computeNumberAgency(ecUserRate, 
 		 		     									distancePick,jsonObj.results.bindings[i].internet.value, 
 		 		     									jsonObj.results.bindings[i].number.value).max; */
 		 		    	/*
 		 		    	alert(jsonObj.results.bindings[i].label.value+": "+jsonObj.results.bindings[i].lat.value
 		 						+", "+jsonObj.results.bindings[i].long.value); */
 		 		     	
 		 		    	/*-- Project Sparql result on Google map with latitude and longtitude (Gov. office) --*/ 
 		 		    	/* marker = new google.maps.Marker({ position: 
 		 		    			 new google.maps.LatLng(jsonObj.results.bindings[i].lat.value, 
 		 		    					 jsonObj.results.bindings[i].long.value), map: map });  */
 		 		    	
 		 		    	
 		 		    	  	
 		 		    	/*-- Assign linked-open data result with marker on Google map street view --*/
 					  /*
 		 		    	google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
 		 		    		return function() {
 		 		    			 infowindow.setContent("City Code: "+jsonObj.results.bindings[i].cityCode.value+"<br/>"+
 		 		    					 			   "Year: "+jsonObj.results.bindings[i].timePeriod.value+"<br/>"+
 		 		    					 			   "Location Name: "+jsonObj.results.bindings[i].searchCityName.value+"<br/>"+
 		 		    					 			   "Latitude: "+jsonObj.results.bindings[i].lat.value+"<br/>"+
 		 		    					 	           "Longtitude: "+jsonObj.results.bindings[i].long.value+"<br/>"+
 		 		    					 	           "Area Status: "+jsonObj.results.bindings[i].areaStatus.value+"<br/>"+
 		 		    					 	           "Population: "+jsonObj.results.bindings[i].population.value+"<br/>"+
 		 		    					 	           "Number of Male: "+jsonObj.results.bindings[i].sexMale.value+"<br/>"+
 		 		    					 	           "Number of Female: "+jsonObj.results.bindings[i].sexFemale.value+"<br/>"+
 		 		    					 	           "Number of Postal Office: "+jsonObj.results.bindings[i].numberPostOffice.value+"<br/>"+
 		 		    					 	           "Number of Job Holding People: "+jsonObj.results.bindings[i].numberEmployeee.value+"<br/>");
 		 		    			 infowindow.open(map, marker);}
 		 		    		}) (marker, i));
 		 		    } else {} 
 			}	
	} */
 		
	/*-- Execute Sparql query on rdf data via multiple endpoint integrtion --*/
 	for(var j=0; j<sparqlCode.length; j++) {
 		sparqlJPQuery(sparqlCode[j], endpoint, executeCallback, true);
 	}
	
} 
	

/*
 * Compute number of distribution agency (Data in 2012: The World Bank and PNH Capital Hall)
 * Number of distribution agency depends on the  e-commerce user rate and distant constraint
 */
visualizeLogisticsMap.computeNumberAgency = function(rate, distanceKm, 
													 numDistrictInternetUser, distPopulation) {
	
	/* rate of ec user and distanceKm (1 km) is variable due to the lack the open data */
	var numInternetUser = 91303; 
	var distanceMaxRadius = 14.7;
	var population = 1852200;
	var pnhArea = 678.46;
	var numInternetUserPerKm; 
	var numDistributionAgency;
	var distanceRadius;
	var numDistributionAgency; 
	var maxNumberDistributionAgency;
	
	/*-- Estimate number of distribution agency in each district per n_km and number of ec user --*/
	distanceRadius = Math.sqrt(distanceKm/Math.PI);
	numInternetUserPerKm = (numInternetUser*distanceRadius)/distanceMaxRadius; 
	numDistributionAgency = (numDistrictInternetUser/numInternetUserPerKm)*(rate/100);
	
	/*-- Calculate max number of distribution agency in each district per n_km and internet user --*/
	maxNumberDistributionAgency = numDistrictInternetUser/numInternetUserPerKm; 
	
	if(numDistributionAgency <= 1) {
		return {min: 1, max: Math.round(maxNumberDistributionAgency)};
	} else {	
		return {min: Math.round(numDistributionAgency), max: Math.round(maxNumberDistributionAgency)};
		}
	}
}



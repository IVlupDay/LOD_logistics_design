/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################          Powered by konagayalab endpoint           #################### 
 * 
 * Developed by Vutha Phav
 */

function visualizeKHLogisticsMap() {
	
	/*-- konagayalab endpoint and Sparql query string --*/
	var endpoint = "http://192.168.11.9/konagayalab/phnompenh/query";
	// var endpoint = "http://sparql.odp.jig.jp/api/v1/sparql"; // This endpoint is limited on multiple query
	var sparqlCode = document.getElementById("sparql").value;
	
	/*-- Assign JSON result to Google map and street visualization --*/
	executeCallback = function(queryCode) {
		
		var jsonObj = eval('(' + queryCode + ')');
	    var ecUserRate = 8; 
	    var distancePick = 1;
	    var numEcUser;
	    
	    /*-- Google map and street view activating code --*/
 		var fenway = {lat:11.561704, lng:104.853839}; // Set default position to local shop
 		// var fenway = {lat:35.687893, lng:139.697362 }; // Set default position to local shop
 		var map = new google.maps.Map(document.getElementById('googlemap'), {
 			center: fenway, zoom: 12 });
 		var panorama = new google.maps.StreetViewPanorama(document.getElementById('streetview'), {
 	        position: fenway,
 	        pov: { heading: -60, pitch: 0 } });
 		var infowindow = new google.maps.InfoWindow();
 		var marker;
 		var i;
 		
 		/* Initiate Google map and street view */
 		map.setStreetView(panorama);
 		alert(jsonObj.results.bindings.length);
 		
	    for(var i = 0; i< jsonObj.results.bindings.length; i++) {
	    	
	    	numEcUser = Math.round((jsonObj.results.bindings[i].internet.value*ecUserRate)/100);
	    	
	    	/*-- Estimate number of distribution center agency with minimum possible for ec user --*/
	    	var minDistributionAgency = visualizeKHLogisticsMap.computeNumberAgency(ecUserRate, 
	    									distancePick,jsonObj.results.bindings[i].internet.value, 
	    									jsonObj.results.bindings[i].number.value).min;
	     	var maxDistributionAgency = visualizeKHLogisticsMap.computeNumberAgency(ecUserRate, 
	     									distancePick,jsonObj.results.bindings[i].internet.value, 
	     									jsonObj.results.bindings[i].number.value).max;
	     	
	     	/*-- Project Sparql result on Google map with latitude and longtitude (Gov. office) --*/
	    	marker = new google.maps.Marker({ 
	    				position: new google.maps.LatLng(jsonObj.results.bindings[i].latitude.value, 
	    							jsonObj.results.bindings[i].longtitude.value),
	    				map: map }); 
	    	  	
	    	/*-- Assign rdf research result with marker on Google map street view --*/
	    	google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
	    		return function() {
	    			 infowindow.setContent("District Name: " + jsonObj.results.bindings[i].name.value+
	    				"<br/>"+ "Total Population: "+jsonObj.results.bindings[i].number.value+"<br/>"+
	    				"Number of Internet User: "+jsonObj.results.bindings[i].internet.value+"<br/>"+
	    				"Number of E-commerce User Estimation: " + numEcUser+ "<br/>"+
	    				"Number of Distribution Agency Estimation: " + minDistributionAgency + "<br/>"+
	    				"Maximum Number of Distribution Agency Estimation: "+ maxDistributionAgency);
	    			 infowindow.open(map, marker);}
	    	}) (marker, i));
	    }  
	}
	/*-- Execute Sparql query on rdf data (Phnom Penh) via konagayalab endpoint --*/
	sparqlKHQuery(sparqlCode, endpoint, executeCallback, true);
} 
	

/*
 * Compute number of distribution agency (Data in 2012: The World Bank and PNH Capital Hall)
 * Number of distribution agency depends on the  e-commerce user rate and distant constraint
 */
visualizeKHLogisticsMap.computeNumberAgency = function(rate, distanceKm, 
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



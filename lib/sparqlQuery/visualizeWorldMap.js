/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################          Powered by konagayalab endpoint           #################### 
 * 
 * Developed by Vutha Phav
 */

function visualizeWorldMap() {
	
	/*-- world map with dbpedia sparql search --*/
	var endpoint = "http://dbpedia.org/sparql";
	var sparqlCode = document.getElementById("sparql_worldmap").value;
	
	/*-- Assign JSON result to Google map and street visualization --*/
	executeCallback = function(queryCode) {
		
		var jsonObj = eval('(' + queryCode + ')');
	    
		/*-- Google map and street view activating code --*/
 		var fenway = {lat:35.687893, lng:139.697362}; // Set default position to local shop
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
 		
 		for(var i = 0; i< jsonObj.results.bindings.length; i++) {
	    	
	    	/*-- Project Sparql result on Google map with latitude and longtitude (Gov. office) --*/
	    	marker = new google.maps.Marker({ 
	    				position: new google.maps.LatLng(jsonObj.results.bindings[i].lat.value, 
	    							jsonObj.results.bindings[i].long.value),
	    				map: map }); 
	    	  	
	    	/*-- Assign rdf research result with marker on Google map street view --*/
	    	google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
	    		return function() {   
	    			 infowindow.setContent("Country Name: "+jsonObj.results.bindings[i].country.value+"<br/>"+
	    					 			   "City Name: "+jsonObj.results.bindings[i].citylabel.value+"<br/>"+
	    					 			   "Population: "+jsonObj.results.bindings[i].population.value+"<br/>"+
	    					 			   "Latitude: "+jsonObj.results.bindings[i].lat.value+"<br/>"+
	    					 			   "Longtitude: "+jsonObj.results.bindings[i].long.value);
	    			 infowindow.open(map, marker);}
	    	}) (marker, i));
	    }  
	}
	/*-- Execute Sparql query on rdf data (Phnom Penh) via konagayalab endpoint --*/
	sparqlWorldQuery(sparqlCode, endpoint, executeCallback, true);
} 
	
function sparqlWorldQuery(queryCode, endpoint, callback, isDebug) {
	
	// var querypart = "query=" + encodeURIComponent(queryCode);  //escape(queryCode);   encodeURIComponent(queryCode); 
	var querypart = "query=" + escape(queryCode); // English name only
	var xmlhttp = null;
	
	if(window.XMLHttpRequest) {
      xmlhttp = new XMLHttpRequest();
   } else if(window.ActiveXObject) {
     xmlhttp = new ActiveXObject("Microsoft.XMLHTTP");
   } else {
     alert('Browser does not support XMLHttpRequests?');
   }
  
   /* Set up a POST for JSON result format. */
   xmlhttp.open('POST', endpoint, true); 
   xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
   xmlhttp.setRequestHeader("Accept", "application/sparql-results+json");
   
   /* Set up callback to get the response asynchronously. */
   xmlhttp.onreadystatechange = function() {
   if(xmlhttp.readyState == 4) {
	    if(xmlhttp.status == 200) {
	    		if(isDebug) {
	    			callback(xmlhttp.responseText);
	    		} else { 
	    			alert("Debugging code is not passed."); 
	    	    	}
   	  	} else { 
   	  		alert("Sparql Query Status Error: " + xmlhttp.status + " "+ xmlhttp.responseText); 
   	  		}
      	}
   };
  
   /* Send Sparql query server endpoint */
   xmlhttp.send(querypart);
  };


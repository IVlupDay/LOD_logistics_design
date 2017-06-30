/*
 * Distribution center agency estimation model with Sparql search on Google map and street view 
 * 
 * ####################              Powered by KonagayaLab                #################### 
 * 
 * Developed by Vutha Phav
 */

// function assignGoogleMap(timePeriod, cityName, cityCode, lat, long, areaStatus, population, numberPostOffice) {
function assignGoogleMap(cityName) {
	
	alert(cityName+2);
	// alert(timePeriod+cityName+cityCode+lat+long+areaStatus+population);
	// alert(numberPostOffice);
	
	var ecUserRate = 8; 
    var distancePick = 1;
    var numEcUser;
    
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
		
	/* Initiate Google map and street view */
	map.setStreetView(panorama);
	
	/*-- Project Sparql result on Google map with latitude and longtitude --*/ 
	marker = new google.maps.Marker({ position: 
		 	      new google.maps.LatLng(lat, long), map: map });  
		 		    	
		     	   /*-- Assign linked-open data result with marker on Google map street view --*/
		 		   google.maps.event.addListener(marker, 'mouseover', (function(marker, i) {
		 		   		return function() {
		 		   			infowindow.setContent("City Code: "+cityCode+"<br/>"+
		 		   								  "Year: "+year+"<br/>"+
		 		   								  "Location Name: "+cityName+"<br/>"+
		 		   								  "Area Status: "+areaStatus+"<br/>"+
		 		   								  "Population: "+population+"<br/>"+
		 		   								  "Number of Postal Office: "+numberPostOffice+"<br/>");
		 		   			infowindow.open(map, marker);
		 		    		}
		 		    	}) 
		 (marker, i));
	}
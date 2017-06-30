/*
 * Execute Sparql query code (RDF data) via konagayalab endpoint 
 * 
 */
function sparqlKHQuery(queryCode, endpoint, callback, isDebug) {
	// alert("sparqlKHQuery");
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
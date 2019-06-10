			var mymap = L.map('map').setView([44.973572561901726, -93.25746774673463], 14.5);
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: 'pk.eyJ1IjoiY2FvMDQzNTEiLCJhIjoiY2p1cDUxaXlxMzY5cjN5bnF3ZTEwMDZ3ciJ9.m9D1zYdsD2xZQTmiGi8i0A'
			}).addTo(mymap);

			var mymap2 = L.map('map2').setView([44.973572561901726, -93.25746774673463], 14.5);
			L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token={accessToken}', {
			attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors, <a href="https://creativecommons.org/licenses/by-sa/2.0/">CC-BY-SA</a>, Imagery © <a href="https://www.mapbox.com/">Mapbox</a>',
			maxZoom: 18,
			id: 'mapbox.streets',
			accessToken: 'pk.eyJ1IjoiY2FvMDQzNTEiLCJhIjoiY2p1cDUxaXlxMzY5cjN5bnF3ZTEwMDZ3ciJ9.m9D1zYdsD2xZQTmiGi8i0A'
			}).addTo(mymap2);





			var inputbox = new Vue({
				el: '#inputbox',
				data: {
					latitude: '44.973572561901726',
					longitude: '-93.25746774673463',
					location: 'US Bank Stadium',
					latlng: true,
					filter:'none'

				},
				methods: {
					changeLatLng: function () {
						var request = {
							url: "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + this.latitude + "&lon=" + this.longitude,
							dataType: "json",
							success: latlngData
						};
						$.ajax(request);
						function latlngData (data)
						{
							inputbox.location = data.display_name.substr(0, data.display_name.indexOf(','));
							mymap.panTo(new L.LatLng(inputbox.latitude, inputbox.longitude));
						}
					},
					changeLoc: function () {
						var request = {
							url: "https://nominatim.openstreetmap.org/search?q=" + inputbox.location + "&format=json&accept-language=en",
							dataType: "json",
							success: locationData
						};
						$.ajax(request);
						function locationData (data)
						{
							this.latitude = data[0].lat;
							this.longitude = data[0].lon;
							mymap.panTo(new L.LatLng(this.latitude, this.longitude));
						}
						this.latlng = false;
					}
				}
			})
			getAirData();

			mymap.on('moveend', function () {
				var center = mymap.getCenter();
				inputbox.longitude = center.lng;
				inputbox.latitude = center.lat;
				var request = {
					url: "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + inputbox.latitude + "&lon=" + inputbox.longitude,
					dataType: "json",
					success: moveData
				};
				$.ajax(request);
				function moveData (data)
				{
					if (inputbox.latlng == true)
					{
						inputbox.location = data.display_name.substr(0, data.display_name.indexOf(','));
					}
					inputbox.latlng = true;
				}
				getAirData();
			});

			//this function fetches the air data with given latitude and longitude
			function getAirData(){
				var latitude = inputbox.latitude;
				var longitude = inputbox.longitude;
				var distance1 = new L.LatLng(latitude, longitude);
				var distance2 = new L.LatLng(latitude, mymap.getBounds().getWest());
				var distance = mymap.distance(distance1, distance2);

				var radius = distance;

				var url1 = "https://api.openaq.org/v1/latest?coordinates=" + latitude + "," + longitude + "&radius=" + radius + "&limit=100";

				if(inputbox.filter!="none"){
					console.log("filtering")
					url1=url1+"&parameter="+inputbox.filter+"";
				}
				$.ajax({
					url: url1,
					type: 'get',
					dataType:'html',
					async: true,
					success: handleData
				});
			}
			function populateTable(data){
				var table = document.getElementById("results");
				table.innerHTML="";//emptys table of previous data points
				var param = "";
				var val = "";
				var location = "";
				var date = "";
				var unit = "";
				var current;
				var htmlStr ="";
				var color = "";
				var colorstring ="";

				var header = "<td><b>Particle</b></td><td><b>Value</b></td><td><b>Unit</b></td><td><b>Location</b></td><td><b>Date</b></td>";
				var headrow = table.insertRow(0);
				headrow.innerHTML=header;


				for (var i = 0; i < data.results.length; i++){//loops through the measurement locations
					location = data.results[i].location;
					current = data.results[i];
					for(var j = 0; j<current.measurements.length; j++){//loop through each measurement at location
						param = current.measurements[j].parameter;
						val = current.measurements[j].value;
						unit = current.measurements[j].unit;
						date = current.measurements[j].lastUpdated;

						color = colorize(param,val);

						//creating row in table
						//row format is param, value,unit,location,date
						var newRow =  table.insertRow(-1);
						htmlStr = "<td>"+param+"</td><td>"+val+colorstring+"</td><td>"+unit+"</td><td>"+location+"</td><td>"+date+"</td>"

						//console.log(htmlStr);
						newRow.innerHTML=htmlStr;
						newRow.style.backgroundColor=color;
					}
				}
				//console.log(colorstring);
			}//populate table

			function handleData(airdata) {
				var data = JSON.parse(airdata);
				locations(data);
				populateTable(data);
			}// handle data

			//this function is passed the fetched data from openaq and then loops through the measurment locations examining their lat & lon coordinates
			function locations(data){
				//function handles the locations that are retrieved from getLocations
				//console.log("locations called");//testing
				//console.log(data);

				var locationLat;
				var locationLon;
				var str = "";
				for(var i = 0; i < data.results.length; i++){
					locationLat = data.results[i].coordinates.latitude;//get lattitude of location[i]
					locationLon = data.results[i].coordinates.longitude;//get longitude of location[i]
					for(var j = 0; j < data.results[i].measurements.length; j++)
					{
						str = str + data.results[i].measurements[j].parameter + ": ";
						str = str + data.results[i].measurements[j].value + " ";
						str = str + data.results[i].measurements[j].unit + "<br/>";
					}
					var marker = L.marker(new L.LatLng(locationLat, locationLon)).addTo(mymap).bindPopup("<b>Particle Measurement Averages:</b><br/>" + str);
					str = "";
					marker;
				let clicked = false

				marker.on({
					mouseover: function() {
						if(!clicked) {
							this.openPopup()
						}
					},
					mouseout: function() {
						if(!clicked) {
							this.closePopup()
						}
					},
				})
				}//results loop
			}











			var inputbox2 = new Vue({
				el: '#inputbox2',
				data: {
					latitude2: '44.973572561901726',
					longitude2: '-93.25746774673463',
					location2: 'US Bank Stadium',
					latlng2: true,
					filter2:'none'

				},
				methods: {
					changeLatLng2: function () {
						var request = {
							url: "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + this.latitude2 + "&lon=" + this.longitude2,
							dataType: "json",
							success: latlngData2
						};
						$.ajax(request);
						function latlngData2 (data)
						{
							inputbox2.location2 = data.display_name.substr(0, data.display_name.indexOf(','));
							mymap2.panTo(new L.LatLng(inputbox2.latitude2, inputbox2.longitude2));
						}
					},
					changeLoc2: function () {
						var request = {
							url: "https://nominatim.openstreetmap.org/search?q=" + inputbox2.location2 + "&format=json&accept-language=en",
							dataType: "json",
							success: locationData2
						};
						$.ajax(request);
						function locationData2 (data)
						{
							this.latitude = data[0].lat;
							this.longitude = data[0].lon;
							mymap2.panTo(new L.LatLng(this.latitude, this.longitude));
						}
						this.latlng2 = false;
					}
				}
			})
			getAirData2();

			mymap2.on('moveend', function () {
				var center = mymap2.getCenter();
				inputbox2.longitude2 = center.lng;
				inputbox2.latitude2 = center.lat;
				var request = {
					url: "https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=" + inputbox2.latitude2 + "&lon=" + inputbox2.longitude2,
					dataType: "json",
					success: moveData2
				};
				$.ajax(request);
				function moveData2 (data)
				{
					if (inputbox2.latlng2 == true)
					{
						inputbox2.location2 = data.display_name.substr(0, data.display_name.indexOf(','));
					}
					inputbox2.latlng2 = true;
				}
				getAirData2();
			});




			function getAirData2(){
				var latitude2 = inputbox2.latitude2;
				var longitude2 = inputbox2.longitude2;
				var distance1 = new L.LatLng(latitude2, longitude2);
				var distance2 = new L.LatLng(latitude2, mymap2.getBounds().getWest());
				var distance = mymap2.distance(distance1, distance2);

				var radius = distance;

				var url2 = "https://api.openaq.org/v1/latest?coordinates=" + latitude2 + "," + longitude2 + "&radius=" + radius + "&limit=100";

				if(inputbox2.filter2!="none"){
					console.log("filtering")
					url2=url2+"&parameter="+inputbox2.filter2+"";
				}
				$.ajax({
					url: url2,
					type: 'get',
					dataType:'html',
					async: true,
					success: handleData2
				});
			}
			function populateTable2(data){
				var table = document.getElementById("results2");
				table.innerHTML="";//emptys table of previous data points
				var param = "";
				var val = "";
				var location2 = "";
				var date = "";
				var unit = "";
				var current;
				var htmlStr ="";
				var color = "";
				var colorstring ="";

				var header = "<td><b>Particle</b></td><td><b>Value</b></td><td><b>Unit</b></td><td><b>Location</b></td><td><b>Date</b></td>";
				var headrow = table.insertRow(0);
				headrow.innerHTML=header;


				for (var i = 0; i < data.results.length; i++){//loops through the measurement locations
					location2 = data.results[i].location;
					current = data.results[i];
					for(var j = 0; j<current.measurements.length; j++){//loop through each measurement at location
						param = current.measurements[j].parameter;
						val = current.measurements[j].value;
						unit = current.measurements[j].unit;
						date = current.measurements[j].lastUpdated;

						color = colorize(param,val);

						//creating row in table
						//row format is param, value,unit,location,date
						var newRow =  table.insertRow(-1);
						htmlStr = "<td>"+param+"</td><td>"+val+colorstring+"</td><td>"+unit+"</td><td>"+location2+"</td><td>"+date+"</td>"
						newRow.innerHTML=htmlStr;
						newRow.style.backgroundColor=color;
					}
				}
			}//populate table

			function handleData2(airdata) {
				var data2 = JSON.parse(airdata);
				locations2(data2);
				populateTable2(data2);
			}// handle data

			//this function is passed the fetched data from openaq and then loops through the measurment locations examining their lat & lon coordinates
			function locations2(data){

				var locationLat2;
				var locationLon2;
				var str2 = "";
				for(var i = 0; i < data.results.length; i++){
					locationLat2 = data.results[i].coordinates.latitude;//get lattitude of location[i]
					locationLon2 = data.results[i].coordinates.longitude;//get longitude of location[i]
					//build string
					for(var j = 0; j < data.results[i].measurements.length; j++)
					{
						str2 = str2 + data.results[i].measurements[j].parameter + ": ";
						str2 = str2 + data.results[i].measurements[j].value + " ";
						str2 = str2 + data.results[i].measurements[j].unit + "<br/>";
					}
					var marker2 = L.marker(new L.LatLng(locationLat2, locationLon2)).addTo(mymap2).bindPopup("<b>Particle Measurement Averages:</b><br/>" + str2);
					str2 = "";
					marker2;
					let clicked = false

					marker2.on({
						mouseover: function() {
							if(!clicked) {
								this.openPopup()
							}
						},
						mouseout: function() {
							if(!clicked) {
								this.closePopup()
							}
						},
					})
				}
			}
			var elem = document.getElementById("fullscreen");
			var open = document.getElementById("open");
			var close = document.getElementById("close");
			function openFullscreen() {
				var map = document.getElementById("map");
				map.style.width = '100%';
				map.style.height = '725px';
				map.style.margin = 'auto';
				var input = document.getElementById("inputbox");
				input.style.margin = '50px';
				if (elem.requestFullscreen) {
					elem.requestFullscreen();
				}
				else if (elem.webkitRequestFullscreen) {
					elem.webkitRequestFullscreen();
				}
				open.style.visibility = 'hidden';
				close.style.visibility = 'visible';
				close.style.float = 'left';
			}
			function closeFullscreen() {
				var map = document.getElementById("map");
				map.style.width = '60%';
				map.style.height = '540px';
				var input = document.getElementById("inputbox");
				input.style.margin = '0px';
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
				else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
				open.style.visibility = 'visible';
				close.style.visibility = 'hidden';
				open.style.float = 'left';
			}
			//fullscreen functions
			var elem2 = document.getElementById("fullscreen2");
			var open2 = document.getElementById("open2");
			var close2 = document.getElementById("close2");
			function openFullscreen2() {
				var map2 = document.getElementById("map2");
				map2.style.width = '100%';
				map2.style.height = '725px';
				map2.style.margin = 'auto';
				var input2 = document.getElementById("inputbox2");
				input2.style.margin = '50px';
				if (elem2.requestFullscreen) {
					elem2.requestFullscreen();
				}
				else if (elem2.webkitRequestFullscreen) {
					elem2.webkitRequestFullscreen();
				}
				open2.style.visibility = 'hidden';
				close2.style.visibility = 'visible';
				close2.style.float = 'left';
			}
			function closeFullscreen2() {
				var map2 = document.getElementById("map2");
				map2.style.width = '60%';
				map2.style.height = '540px';
				var input2 = document.getElementById("inputbox2");
				input2.style.margin = '0px';
				if (document.exitFullscreen) {
					document.exitFullscreen();
				}
				else if (document.webkitExitFullscreen) {
					document.webkitExitFullscreen();
				}
				open2.style.visibility = 'visible';
				close2.style.visibility = 'hidden';
				open2.style.float = 'left';
			}
			//color the table
			function colorize(param, value){
				//will get passed parameter and value returns span tag used in colorizing
				var good = "#00ff04";
				var moderate = "#eeff00";
				var unhealthyForSensitve = "#ffc700";
				var unhealthy = "#ff002e";
				var veryUnhealthy = "#9800ff";
				var hazardous = "#8c0046";

				//ozone
				if(param == "o3"){
					if(value <=.054 ){
						return good;
					}
					else if(value >= .055&& value <=.07){
						return moderate;
					}
					else if(value >= .071 && value <=.085){
						return unhealthyForSensitve;
					}
					else if(value >= .086 && value <=.105 ){
						return unhealthy;
					}
					else if(value >= .106&& value <=.206){
						return veryUnhealthy;
					}
					else if(value >=.207){
						return hazardous;
					}
				}//o3
				if(param == "pm25"){
					if(value <= 12.0){
						return good;
					}
					else if(value >=12.1 && value <=35.4){
						return moderate;
					}
					else if(value >= 35.5 && value <=55.4){
						return unhealthyForSensitve;
					}
					else if(value >= 55.5 && value <= 150.4){
						return unhealthy;
					}
					else if(value >=150.5 && value <=250.4){
						return veryUnhealthy;
					}
					else if(value >= 250.5){
						return hazardous;
					}
				}
				if(param == "pm10"){
					if(value <= 54){
						return good;
					}
					else if(value >= 55&& value <=154){
						return moderate;
					}
					else if(value >=155  && value <=254){
						return unhealthyForSensitve;
					}
					else if(value >= 255 && value <= 354){
						return unhealthy;
					}
					else if(value >=355 && value <=424){
						return veryUnhealthy;
					}
					else if(value >= 425){
						return hazardous;
					}
				}
				if(param == "co"){
					if(value <= 4.4 ){
						return good;
					}
					else if(value >= 4.5 && value <= 9.4){
						return moderate;
					}
					else if(value >= 9.5  && value <=12.4){
						return unhealthyForSensitve;
					}
					else if(value >=12.5  && value <= 15.4){
						return unhealthy;
					}
					else if(value >=15.5 && value <=30.4){
						return veryUnhealthy;
					}
					else if(value >= 30.5){
						return hazardous;
					}
				}//co
				if(param == "so2"){
					if(value <= 35){
						return good;
					}
					else if(value >=36 && value <=75){
						return moderate;
					}
					else if(value >= 76 && value <=185){
						return unhealthyForSensitve;
					}
					else if(value >=186  && value <= 304){
						return unhealthy;
					}
					else if(value >= 305&& value <=604){
						return veryUnhealthy;
					}
					else if(value >= 605){
						return hazardous;
					}
				}//so2
				if(param == "no2"){
					if(value <= 53){
						return good;
					}
					else if(value >=54 && value <=100){
						return moderate;
					}
					else if(value >= 101 && value <=360){
						return unhealthyForSensitve;
					}
					else if(value >=361  && value <=649 ){
						return unhealthy;
					}
					else if(value >= 650&& value <=1244){
						return veryUnhealthy;
					}
					else if(value >=1250 ){
						return hazardous;
					}
				}
				return null;
			}

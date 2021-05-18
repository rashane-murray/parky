mapboxgl.accessToken = 'pk.eyJ1IjoiZGFuamVuODc2IiwiYSI6ImNrbnQwZ2lnbDBiNGcyb3IwNGdlejRtcDIifQ.j5-YzgOallfWib7GFbkX_w';

//Variables are stored in latitude and longitude
var start = []; //start variable
var end = []; //destination variable

//needs navigator geolocation on
navigator.geolocation.getCurrentPosition(successLoc,
    errorLoc, {enableHighAccuracy: true})

function successLoc(position){ //starting point
    //console.log(position)
    start = [position.coords.longitude, position.coords.latitude];
    setupMap([position.coords.longitude, position.coords.latitude])
} 

function errorLoc(){ //starting point if something goes wrong
    setupMap([17.5949, -76.4736])//used Kingston city
}

//Creating the map
function setupMap(center){
    const map = new mapboxgl.Map({
        container: 'map',
        style: 'mapbox://styles/mapbox/streets-v11',
        center: center,
        zoom: 13
    });

    // Create a default Marker and add it to the map.
    var marker1 = new mapboxgl.Marker()
    .setLngLat([center[0], center[1]])
    .addTo(map);
    
    //Navigation Control Settings
    const nav = new mapboxgl.NavigationControl();
    map.addControl(nav, 'top-right');

    //Direction settings
    var directions = new MapboxDirections({
        accessToken: mapboxgl.accessToken
    });

    //Adding directions
    map.addControl(directions,'top-left');

    //const apikey = 'https://api.mapbox.com/geocoding/v5/mapbox.places/Jamaica.json?types=country&access_token='+mapboxgl.accessToken

    var geocode = new MapboxGeocoder({
        accessToken: mapboxgl.accessToken,
        // Limit search results to Jamaica.
        countries: 'JM',
        mapboxgl: mapboxgl
        })
    map.addControl(geocode);


    map.on('load', function() {
        map.addSource('single-point', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        // Adding the ending mark
        map.addLayer({
          id: 'point',
          source: 'single-point',
          type: 'circle',
          paint: {
            'circle-radius': 10,
            'circle-color': '#448ee4'
          }
        });
      
        // Listen for the `result` event from the Geocoder
        // `result` event is triggered when a user makes a selection
        //  Add a marker at the result's coordinates
        geocode.on('result', function(e) {
          map.getSource('single-point').setData(e.result.geometry);
          end = e.result.geometry.coordinates;
          console.log(start);
          console.log(end);

          //var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;
          

        });
    });
      
}


/*

  // create a function to make a directions request
    function getRoute(end) {
      // make a directions request using cycling profile
      // an arbitrary start will always be the same
      // only the end or destination will change
      var url = 'https://api.mapbox.com/directions/v5/mapbox/driving/' + start[0] + ',' + start[1] + ';' + end[0] + ',' + end[1] + '?steps=true&geometries=geojson&access_token=' + mapboxgl.accessToken;

      // make an XHR request https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.onload = function() {
        var json = JSON.parse(req.response);
        var data = json.routes[0];
        var route = data.geometry.coordinates;
        var geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };
        // if the route already exists on the map, reset it using setData
        if (map.getSource('route')) {
          console.log('trued');
          map.getSource('route').setData(geojson);
        } else { // otherwise, make a new request
          console.log('failed')
        }
        var instructions = document.getElementById('instructions');
        var steps = data.legs[0].steps;

        var tripInstructions = [];
        for (var i = 0; i < steps.length; i++) {
          tripInstructions.push('<br><li>' + steps[i].maneuver.instruction) + '</li>';
          instructions.innerHTML = '<br><span class="duration">Trip duration: ' + Math.floor(data.duration / 60) + ' min 🚴 </span>' + tripInstructions;
        }
      };
      req.send();
    }







map.on('load', function() {
  // make an initial directions request that
  // starts and ends at the same location
  getRoute(start);

  // Add starting point to the map
  map.addLayer({
    id: 'point',
    type: 'circle',
    source: {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: [{
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'Point',
            coordinates: start
          }
        }
        ]
      }
    },
    paint: {
      'circle-radius': 10,
      'circle-color': '#3887be'
    }
  });





  map.on('click', function(e) {
    var coordsObj = e.lngLat;
    canvas.style.cursor = '';
    var coords = Object.keys(coordsObj).map(function(key) {
      return coordsObj[key];
    });
    var end = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Point',
          coordinates: coords
        }
      }
      ]
    };
    if (map.getLayer('end')) {
      map.getSource('end').setData(end);
    } else {
      map.addLayer({
        id: 'end',
        type: 'circle',
        source: {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: [{
              type: 'Feature',
              properties: {},
              geometry: {
                type: 'Point',
                coordinates: coords
              }
            }]
          }
        },
        paint: {
          'circle-radius': 10,
          'circle-color': '#f30'
        }
      });
    }
    getRoute(coords);
  });
});
*/
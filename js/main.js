// Declaring Map Infowindow & map bounds
var map;
var infoWindow;
var bounds;

// Google Map Initialization
function initMap() {
    //Defining the basic map
    var Bhubaneswar = {
        lat: 20.2961,
        lng: 85.8245
    };
    map = new google.maps.Map(document.getElementById('map'), {
        zoom: 15,
        center: Bhubaneswar,
        mapTypeControl: false
    });

    infoWindow = new google.maps.InfoWindow();

    bounds = new google.maps.LatLngBounds();
    //Applying The Bindings With Knockout
    ko.applyBindings(new ViewModel());
}

// Map Error Handling
function googleMapsError() {
    alert('Error with Google Maps!');
}

// Location Model
var LocationMarker = function(data) {
    var self = this;

    this.title = data.title;
    this.position = data.location;
    this.street = '',
    this.city = '';

    this.visible = ko.observable(true);

    // Applying Colours to the Markers
    var defaultIcon = makeMarkerIcon('ff0000');
    var highlightedIcon = makeMarkerIcon('00fff0');

    //This is the Client ID & Client Secret Obtained from Foursquare API Website
    var clientID = 'GQC1C5J20EIESHRTF2GI5IP2ZIR1OPGOU2IHOY4YQKGQUWDC';
    var clientSecret = 'DA5CJDPOLTV13ZSOLV1AFNCPZG0CSRZJQJUSHGV14KIGOP0U';

    // Getting JSON Request with the data of Foursquare
    var reqURL = 'https://api.foursquare.com/v2/venues/search?ll=' + this.position.lat + ',' + this.position.lng + '&client_id=' + clientID + '&client_secret=' + clientSecret + '&v=20160118' + '&query=' + this.title;

    $.getJSON(reqURL).done(function(data) {
		var results = data.response.venues[0];
        self.street = results.location.formattedAddress[0] ? results.location.formattedAddress[0]: 'N/A';
        self.city = results.location.formattedAddress[1] ? results.location.formattedAddress[1]: 'N/A';
    }).fail(function() {
        alert('Error with Foursquare');
    });

    // Creating Markers for each location & storing them in an array
    this.marker = new google.maps.Marker({
        position: this.position,
        title: this.title,
        animation: google.maps.Animation.DROP,
        icon: defaultIcon
    });

    self.filterMarkers = ko.computed(function () {
        // Setting the Marker Bounds
        if(self.visible() === true) {
            self.marker.setMap(map);
            bounds.extend(self.marker.position);
            map.fitBounds(bounds);
        } else {
            self.marker.setMap(null);
        }
    });

    // Creating the click event on each marker
    this.marker.addListener('click', function() {
        populateInfoWindow(this, self.street, self.city, self.phone, infoWindow);
        toggleBounce(this);
        map.panTo(this.getPosition());
    });

    // Adding the Event Listener to the markers
    this.marker.addListener('mouseover', function() {
        this.setIcon(highlightedIcon);
    });
    this.marker.addListener('mouseout', function() {
        this.setIcon(defaultIcon);
    });

    // Showing the Markers on click in the list
    this.show = function(location) {
        google.maps.event.trigger(self.marker, 'click');
    };

    // Creating Bounce Effent with the Markers
    this.bounce = function(place) {
		google.maps.event.trigger(self.marker, 'click');
	};

};

// View Model
var ViewModel = function() {
    var self = this;

    this.searchItem = ko.observable('');

    this.mapList = ko.observableArray([]);

    // Adding the Markers to each location
    locations.forEach(function(location) {
        self.mapList.push( new LocationMarker(location) );
    });

    // Displaying Locations On the Map
    this.locationList = ko.computed(function() {
        var searchFilter = self.searchItem().toLowerCase();
        if (searchFilter) {
            return ko.utils.arrayFilter(self.mapList(), function(location) {
                var str = location.title.toLowerCase();
                var result = str.includes(searchFilter);
                location.visible(result);
				return result;
			});
        }
        self.mapList().forEach(function(location) {
            location.visible(true);
        });
        return self.mapList();
    }, self);
};

// Function for stylising the behaviour of Infowindow
function populateInfoWindow(marker, street, city, phone, infowindow) {
    // Check to make sure the infowindow is not already opened on this marker.
    if (infowindow.marker != marker) {
        // Clear the infowindow content to give the streetview time to load.
        infowindow.setContent('');
        infowindow.marker = marker;

        // Make sure the marker property is cleared if the infowindow is closed.
        infowindow.addListener('closeclick', function() {
            infowindow.marker = null;
        });

        var windowContent = '<h4>' + marker.title + '</h4>' +
            '<p>' + street + "<br>" + city + "</p>";

        infowindow.setContent(windowContent);

        infowindow.open(map, marker);
    }
}

function toggleBounce(marker) {
  if (marker.getAnimation() !== null) {
    marker.setAnimation(null);
  } else {
    marker.setAnimation(google.maps.Animation.BOUNCE);
    setTimeout(function() {
        marker.setAnimation(null);
    }, 1400);
  }
}

// Creating The Marker Image and Adding colour to the image
function makeMarkerIcon(markerColor) {
    var markerImage = new google.maps.MarkerImage(
        'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|' + markerColor +
        '|40|_|%E2%80%A2',
        new google.maps.Size(25, 40),
        new google.maps.Point(0, 0),
        new google.maps.Point(10, 34),
        new google.maps.Size(25, 40));
    return markerImage;
}


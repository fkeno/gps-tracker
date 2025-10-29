// GPS Tracker Dashboard JavaScript

let map;
let marker;
let trackingEnabled = true;
let positionHistory = [];
let polyline;

// Initialisierung der Karte
function initMap() {
    // Erstelle Karte mit Standardposition (Berlin)
    map = L.map('map').setView([52.520008, 13.404954], 13);

    // OpenStreetMap Tile Layer hinzufügen
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
    }).addTo(map);

    // Custom Marker Icon
    const trackerIcon = L.icon({
        iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    });

    // Marker zur Karte hinzufügen
    marker = L.marker([52.520008, 13.404954], {icon: trackerIcon}).addTo(map);
    marker.bindPopup("<b>GPS Tracker</b><br>Aktuelle Position").openPopup();

    // Polyline für die Route
    polyline = L.polyline([], {
        color: 'blue',
        weight: 3,
        opacity: 0.7
    }).addTo(map);
}

// Aktuelle Position vom Server abrufen
async function updatePosition() {
    try {
        const response = await fetch('/api/current-position');
        const data = await response.json();
        
        // Karte und Marker aktualisieren
        const newLatLng = [data.lat, data.lon];
        marker.setLatLng(newLatLng);
        
        // Popup aktualisieren
        marker.bindPopup(`
            <b>GPS Tracker</b><br>
            Position: ${data.lat.toFixed(6)}, ${data.lon.toFixed(6)}<br>
            Geschwindigkeit: ${data.speed} km/h<br>
            Höhe: ${data.altitude} m
        `);

        // Wenn Auto-Tracking aktiviert ist, Karte zentrieren
        if (trackingEnabled) {
            map.setView(newLatLng, map.getZoom());
        }

        // Position zur Historie hinzufügen
        positionHistory.push(newLatLng);
        if (positionHistory.length > 50) {
            positionHistory.shift(); // Alte Positionen entfernen
        }
        polyline.setLatLngs(positionHistory);

        // UI aktualisieren
        document.getElementById('current-lat').textContent = data.lat.toFixed(6);
        document.getElementById('current-lon').textContent = data.lon.toFixed(6);
        document.getElementById('current-speed').textContent = data.speed;
        document.getElementById('current-altitude').textContent = data.altitude;
        document.getElementById('current-location').textContent = data.location || 'Unbekannt';

        // Statistiken aktualisieren
        updateStatistics();
    } catch (error) {
        console.error('Fehler beim Abrufen der Position:', error);
    }
}

// Tracker-Status vom Server abrufen
async function updateTrackerStatus() {
    try {
        const response = await fetch('/api/tracker-status');
        const data = await response.json();

        // Status Badge aktualisieren
        const statusBadge = document.getElementById('status-badge');
        if (data.online) {
            statusBadge.textContent = 'Online';
            statusBadge.className = 'badge bg-success';
        } else {
            statusBadge.textContent = 'Offline';
            statusBadge.className = 'badge bg-danger';
        }

        // Batterie aktualisieren
        document.getElementById('battery-level').textContent = data.battery + '%';
        const batteryBar = document.getElementById('battery-bar');
        batteryBar.style.width = data.battery + '%';
        
        // Batterie-Farbe je nach Level
        if (data.battery > 50) {
            batteryBar.className = 'progress-bar bg-success';
        } else if (data.battery > 20) {
            batteryBar.className = 'progress-bar bg-warning';
        } else {
            batteryBar.className = 'progress-bar bg-danger';
        }

        // Signal-Stärke aktualisieren
        document.getElementById('signal-strength').textContent = data.signal_strength + '%';

        // Letzte Aktualisierung
        const lastUpdate = new Date(data.last_update);
        document.getElementById('last-update').textContent = lastUpdate.toLocaleString('de-DE');

    } catch (error) {
        console.error('Fehler beim Abrufen des Status:', error);
    }
}

// Statistiken aktualisieren
function updateStatistics() {
    // Max. Geschwindigkeit (simuliert)
    const maxSpeed = Math.floor(Math.random() * 120) + 30;
    document.getElementById('stat-max-speed').textContent = maxSpeed;

    // Zurückgelegte Strecke (simuliert)
    const distance = (Math.random() * 50).toFixed(1);
    document.getElementById('stat-distance').textContent = distance;

    // Dauer (simuliert)
    const hours = Math.floor(Math.random() * 5);
    const minutes = Math.floor(Math.random() * 60);
    document.getElementById('stat-duration').textContent = `${hours}h ${minutes}m`;

    // Erfasste Punkte
    document.getElementById('stat-points').textContent = positionHistory.length;
}

// Karte auf Tracker zentrieren
function centerMap() {
    if (marker) {
        map.setView(marker.getLatLng(), 15);
    }
}

// Auto-Tracking umschalten
function toggleTracking() {
    trackingEnabled = !trackingEnabled;
    const button = event.target;
    
    if (trackingEnabled) {
        button.innerHTML = '<i class="bi bi-pause-circle"></i> Auto-Tracking';
        button.className = 'btn btn-outline-secondary w-100 mb-2';
    } else {
        button.innerHTML = '<i class="bi bi-play-circle"></i> Auto-Tracking';
        button.className = 'btn btn-success w-100 mb-2';
    }
}

// Kartenansicht umschalten (zwischen OpenStreetMap und Satellit)
let satelliteView = false;
let currentTileLayer;

function toggleSatellite() {
    satelliteView = !satelliteView;
    
    if (satelliteView) {
        // Entferne aktuellen Layer
        map.eachLayer(function(layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // Füge Satellitenansicht hinzu
        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri',
            maxZoom: 19
        }).addTo(map);
    } else {
        // Entferne aktuellen Layer
        map.eachLayer(function(layer) {
            if (layer instanceof L.TileLayer) {
                map.removeLayer(layer);
            }
        });
        
        // Füge Standard OpenStreetMap hinzu
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(map);
    }
}

// Daten manuell aktualisieren
function refreshData() {
    updatePosition();
    updateTrackerStatus();
    
    // Feedback geben
    const button = event.target;
    const originalHTML = button.innerHTML;
    button.innerHTML = '<i class="bi bi-check-circle"></i> Aktualisiert!';
    button.className = 'btn btn-success w-100';
    
    setTimeout(() => {
        button.innerHTML = originalHTML;
        button.className = 'btn btn-outline-info w-100';
    }, 1500);
}

// Initialisierung beim Laden der Seite
document.addEventListener('DOMContentLoaded', function() {
    initMap();
    updatePosition();
    updateTrackerStatus();

    // Automatische Aktualisierung alle 5 Sekunden
    setInterval(() => {
        updatePosition();
        updateTrackerStatus();
    }, 5000);
});

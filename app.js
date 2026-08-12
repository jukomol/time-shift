// ============================================
// GLOBAL VARIABLES & CONFIGURATION
// ============================================

console.log('🔧 Initializing Global Time Checker...');
console.log('Window object available:', typeof window !== 'undefined');
console.log('dayjs available:', typeof dayjs !== 'undefined');

// Initialize Day.js plugins
try {
    if (typeof dayjs !== 'undefined') {
        console.log('📦 dayjs found, extending with plugins...');
        
        // Access plugins from window object
        if (window.dayjs_plugin_utc) {
            dayjs.extend(window.dayjs_plugin_utc);
            console.log('✓ UTC plugin loaded');
        } else {
            console.warn('⚠️ UTC plugin not found, trying fallback...');
            // Fallback method
            if (dayjs.utc) {
                console.log('✓ UTC available natively');
            }
        }
        
        if (window.dayjs_plugin_timezone) {
            dayjs.extend(window.dayjs_plugin_timezone);
            console.log('✓ Timezone plugin loaded');
        } else {
            console.warn('⚠️ Timezone plugin not found');
        }
    } else {
        console.error('❌ dayjs library not loaded!');
    }
} catch (error) {
    console.error('Error initializing Day.js plugins:', error);
}

const CONFIG = {
    IP_API: 'https://ipapi.co/json/',
    WEATHER_API: 'https://api.open-meteo.com/v1/forecast',
    GEOCODING_API: 'https://nominatim.openstreetmap.org/search',
    STORAGE_KEY: 'timecheckerCities',
};

let map = null;
let userLocation = null;
let userCoordinates = null;
let cities = [];
let markers = {};
let updateInterval = null;

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Show notification toast - with DOM element check
 */
function showNotification(message, type = 'info') {
    try {
        const notification = document.getElementById('notification');
        if (!notification) {
            console.warn('Notification element not found, falling back to console');
            console.log(`[${type.toUpperCase()}] ${message}`);
            return;
        }
        
        notification.textContent = message;
        notification.className = `notification ${type}`;
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    } catch (error) {
        console.error('Error showing notification:', error);
        console.log(`[${type.toUpperCase()}] ${message}`);
    }
}

/**
 * Show/hide loading spinner - with DOM element check
 */
function setLoading(show) {
    try {
        const spinner = document.getElementById('loadingSpinner');
        if (!spinner) {
            console.warn('Loading spinner element not found');
            return;
        }
        
        if (show) {
            spinner.classList.remove('hidden');
        } else {
            spinner.classList.add('hidden');
        }
    } catch (error) {
        console.error('Error setting loading state:', error);
    }
}

/**
 * Format time with leading zeros
 */
function formatTime(hour, minute, second) {
    return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:${String(second).padStart(2, '0')}`;
}

/**
 * Get weather icon based on condition
 */
function getWeatherIcon(weatherCode) {
    // WMO Weather interpretation codes
    if (!weatherCode) return 'fa-cloud';
    
    // 0: Clear sky
    if (weatherCode === 0) return 'fa-sun';
    // 1-3: Mainly clear
    if (weatherCode <= 3) return 'fa-cloud-sun';
    // 45-48: Foggy
    if (weatherCode >= 45 && weatherCode <= 48) return 'fa-smog';
    // 51-67: Drizzle/Rain
    if (weatherCode >= 51 && weatherCode <= 67) return 'fa-cloud-rain';
    // 71-77, 80-82: Snow/Rain
    if ((weatherCode >= 71 && weatherCode <= 77) || weatherCode >= 80 && weatherCode <= 82) return 'fa-cloud-rain';
    // 85-86: Heavy snow
    if (weatherCode >= 85 && weatherCode <= 86) return 'fa-snowflake';
    // 80-82: Rain showers
    if (weatherCode >= 80 && weatherCode <= 82) return 'fa-cloud-rain';
    // 85-86: Snow showers
    if (weatherCode >= 85 && weatherCode <= 86) return 'fa-snowflake';
    // 95-99: Thunderstorm
    if (weatherCode >= 95) return 'fa-bolt';
    
    return 'fa-cloud';
}

/**
 * Get weather description
 */
function getWeatherDescription(weatherCode) {
    if (!weatherCode) return 'Unknown';
    
    if (weatherCode === 0) return 'Clear sky';
    if (weatherCode <= 3) return 'Mainly clear';
    if (weatherCode >= 45 && weatherCode <= 48) return 'Foggy';
    if (weatherCode >= 51 && weatherCode <= 67) return 'Drizzle/Rain';
    if ((weatherCode >= 71 && weatherCode <= 77) || (weatherCode >= 80 && weatherCode <= 82)) return 'Rain/Snow';
    if (weatherCode >= 85 && weatherCode <= 86) return 'Heavy snow';
    if (weatherCode >= 95) return 'Thunderstorm';
    
    return 'Cloudy';
}

/**
 * Convert temperature from Celsius
 */
function convertTemperature(celsius) {
    return Math.round(celsius);
}

// ============================================
// API FUNCTIONS
// ============================================

/**
 * Fetch user location from IP
 */
async function fetchUserLocation() {
    try {
        console.log('Fetching user location...');
        
        // Add timeout to fetch (5 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const response = await fetch(CONFIG.IP_API, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`API returned status ${response.status}`);
        }
        
        const data = await response.json();
        console.log('Location data received:', data);
        
        userCoordinates = {
            lat: parseFloat(data.latitude) || 0,
            lon: parseFloat(data.longitude) || 0,
        };
        
        userLocation = {
            city: data.city || 'Unknown Location',
            country: data.country_name || 'Unknown',
            timezone: data.timezone || 'UTC',
            latitude: parseFloat(data.latitude) || 0,
            longitude: parseFloat(data.longitude) || 0,
            ip: data.ip || 'Unknown',
        };
        
        console.log('User location set:', userLocation);
        return userLocation;
    } catch (error) {
        console.error('Error fetching user location:', error);
        
        // Fallback to default location (London)
        console.warn('Using fallback location (London, UK)');
        userCoordinates = {
            lat: 51.5074,
            lon: -0.1278,
        };
        
        userLocation = {
            city: 'London',
            country: 'United Kingdom',
            timezone: 'Europe/London',
            latitude: 51.5074,
            longitude: -0.1278,
            ip: 'Unknown',
        };
        
        showNotification('Using default location. Enable location access for accurate time.', 'warning');
        return userLocation;
    }
}

/**
 * Fetch weather data from Open-Meteo
 */
async function fetchWeather(lat, lon) {
    try {
        console.log('Fetching weather for:', lat, lon);
        
        // Add timeout to fetch (5 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 5000);
        
        const url = `${CONFIG.WEATHER_API}?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`;
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            throw new Error(`Weather API returned status ${response.status}`);
        }
        
        const data = await response.json();
        
        return {
            temperature: data.current?.temperature_2m || 0,
            weatherCode: data.current?.weather_code || 0,
            humidity: data.current?.relative_humidity_2m || 0,
            windSpeed: data.current?.wind_speed_10m || 0,
            description: getWeatherDescription(data.current?.weather_code),
        };
    } catch (error) {
        console.error('Error fetching weather:', error);
        return {
            temperature: 0,
            weatherCode: 0,
            humidity: 0,
            windSpeed: 0,
            description: 'Data unavailable',
        };
    }
}

/**
 * Search city by name or ZIP code (Nominatim API)
 * Supports city names, ZIP codes, and postal codes
 */
async function searchCity(query) {
    try {
        if (!query || query.trim().length === 0) return [];
        
        // Check if input looks like a ZIP code (5-6 digits, possibly with country code)
        const zipPattern = /^[A-Z]{0,2}\s?\d{4,6}$/i;
        const isZipCode = zipPattern.test(query.trim());
        
        let url;
        if (isZipCode) {
            // Search by postal code
            url = `${CONFIG.GEOCODING_API}?postalcode=${encodeURIComponent(query.trim())}&format=json&limit=5`;
        } else {
            // Search by city name
            url = `${CONFIG.GEOCODING_API}?q=${encodeURIComponent(query.trim())}&format=json&limit=5`;
        }
        
        console.log('Searching for:', query);
        
        // Add timeout to search (3 seconds)
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(url, { signal: controller.signal });
        clearTimeout(timeout);
        
        if (!response.ok) {
            console.error('Search API error:', response.status);
            return [];
        }
        
        const data = await response.json();
        return Array.isArray(data) ? data : [];
    } catch (error) {
        console.error('Error searching city:', error);
        if (error.name === 'AbortError') {
            showNotification('Search timed out. Try again.', 'warning');
        } else {
            showNotification('Search service temporarily unavailable', 'warning');
        }
        return [];
    }
}

// ============================================
// TIME & TIMEZONE FUNCTIONS
// ============================================

/**
 * Format a date string for a given timezone.
 */
function formatDateInTimezone(timezone) {
    try {
        const safeTimezone = getSafeTimezone(timezone);
        if (dayjs.tz) {
            return dayjs().tz(safeTimezone).format('ddd, MMM D, YYYY');
        }
        return dayjs().format('ddd, MMM D, YYYY');
    } catch (error) {
        console.error('Error formatting date for timezone:', timezone, error);
        return dayjs().format('ddd, MMM D, YYYY');
    }
}

/**
 * Update current time display
 */
function updateCurrentTime() {
    if (!userLocation) return;
    
    try {
        const now = dayjs().tz(userLocation.timezone);
        const timeStr = formatTime(now.hour(), now.minute(), now.second());
        document.getElementById('currentTime').textContent = timeStr;
        document.getElementById('currentDate').textContent = formatDateInTimezone(userLocation.timezone);
    } catch (error) {
        console.error('Error updating current time:', error);
        // Show last known time instead of erroring out
    }
}

/**
 * Get current time in a specific timezone
 */
function getTimeInTimezone(timezone) {
    try {
        // Ensure timezone is safe before using
        const safeTimezone = getSafeTimezone(timezone);
        
        // Check if dayjs.tz is available (timezone plugin loaded)
        if (dayjs.tz) {
            const now = dayjs().tz(safeTimezone);
            return {
                time: formatTime(now.hour(), now.minute(), now.second()),
                hour: now.hour(),
                minute: now.minute(),
                second: now.second(),
            };
        } else {
            console.warn('Day.js timezone plugin not available, using UTC');
            // Fallback to UTC
            const now = dayjs.utc ? dayjs.utc() : dayjs();
            return {
                time: formatTime(now.hour(), now.minute(), now.second()),
                hour: now.hour(),
                minute: now.minute(),
                second: now.second(),
            };
        }
    } catch (error) {
        console.error(`Error getting time for timezone ${timezone}:`, error);
        // Fallback to UTC
        try {
            const now = dayjs.utc ? dayjs.utc() : dayjs();
            return {
                time: formatTime(now.hour(), now.minute(), now.second()),
                hour: now.hour(),
                minute: now.minute(),
                second: now.second(),
            };
        } catch (fallbackError) {
            console.error('UTC fallback also failed:', fallbackError);
            return {
                time: '00:00:00',
                hour: 0,
                minute: 0,
                second: 0,
            };
        }
    }
}

/**
 * Calculate time difference in hours between current location and another timezone.
 * Compare each timezone's UTC offset at the current instant rather than comparing
 * two timestamps, since both timestamps represent the same moment in time.
 */
function calculateTimeDifference(fromTz, toTz) {
    try {
        const fromOffsetMinutes = dayjs().tz(fromTz).utcOffset();
        const toOffsetMinutes = dayjs().tz(toTz).utcOffset();
        const diffHours = (toOffsetMinutes - fromOffsetMinutes) / 60;
        return Math.round(diffHours * 10) / 10; // Round to 1 decimal
    } catch (error) {
        console.error(`Error calculating time difference between ${fromTz} and ${toTz}:`, error);
        return 0; // Default to no difference if calculation fails
    }
}

// ============================================
// MAP FUNCTIONS
// ============================================

/**
 * Initialize Leaflet map
 */
function initializeMap() {
    if (!userCoordinates) return;
    
    map = L.map('map').setView([userCoordinates.lat, userCoordinates.lon], 4);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19,
    }).addTo(map);
    
    // Add user location marker
    L.circleMarker([userCoordinates.lat, userCoordinates.lon], {
        radius: 8,
        fillColor: '#4f46e5',
        color: '#ffffff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.8,
    })
    .addTo(map)
    .bindPopup(`<div class="popup-content">
        <strong>${userLocation.city}, ${userLocation.country}</strong>
        <br/>Your current location
        <br/><small>${userLocation.timezone}</small>
    </div>`);
    
    markers.userLocation = {
        lat: userCoordinates.lat,
        lon: userCoordinates.lon,
    };
    
    // Add map controls
    setupMapControls();
}

/**
 * Setup map control buttons
 */
function setupMapControls() {
    document.getElementById('zoomIn').addEventListener('click', () => {
        map.zoomIn();
    });
    
    document.getElementById('zoomOut').addEventListener('click', () => {
        map.zoomOut();
    });
    
    document.getElementById('centerMap').addEventListener('click', () => {
        map.setView([userCoordinates.lat, userCoordinates.lon], 4);
    });
}

/**
 * Remove stale city markers and redraw them so they persist reliably after refresh.
 */
function refreshCityMarkers() {
    if (!map) return;

    Object.keys(markers).forEach(key => {
        if (key !== 'userLocation' && markers[key] && map.hasLayer(markers[key])) {
            map.removeLayer(markers[key]);
            delete markers[key];
        }
    });

    cities.forEach(city => addCityMarker(city));
}

/**
 * Add city marker to map
 */
function addCityMarker(city) {
    if (!map || !city.lat || !city.lon) return;

    const safeName = (city.name || 'city')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    const markerKey = `marker_${safeName}_${city.lat.toFixed(4)}_${city.lon.toFixed(4)}`;

    // Remove any previous instance before re-adding
    if (city.markerId && map.hasLayer(markers[city.markerId])) {
        map.removeLayer(markers[city.markerId]);
    }

    city.markerId = markerKey;

    const marker = L.circleMarker([city.lat, city.lon], {
        radius: 9,
        fillColor: '#22d3ee',
        color: '#ecfeff',
        weight: 3,
        opacity: 1,
        fillOpacity: 0.95,
        riseOnHover: true,
        interactive: true,
        bubblingMouseEvents: true,
    }).addTo(map);

    marker.bindPopup(`<div class="popup-content">
        <strong>${city.name}</strong>
        <br/>Time: ${city.time}
        <br/><small>${city.timezone}</small>
    </div>`);

    marker.bindTooltip(city.name, {
        permanent: false,
        direction: 'top',
        offset: [0, -12],
        className: 'city-tooltip'
    });

    marker.on('mouseover', () => marker.setStyle({ radius: 11, weight: 4, fillOpacity: 1 }));
    marker.on('mouseout', () => marker.setStyle({ radius: 9, weight: 3, fillOpacity: 0.95 }));

    markers[city.markerId] = marker;
}

// ============================================
// CITY MANAGEMENT FUNCTIONS
// ============================================

/**
 * Load cities from localStorage
 */
function loadCitiesFromStorage() {
    const stored = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (stored) {
        cities = JSON.parse(stored);
        renderCities();
    }
}

/**
 * Save cities to localStorage
 */
function saveCitiesToStorage() {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(cities));
}

/**
 * Add a new city
 */
async function addCity(cityName) {
    if (!cityName.trim()) {
        showNotification('Please enter a city name or ZIP code', 'warning');
        return;
    }
    
    // Check if city already exists
    if (cities.some(c => c.name.toLowerCase() === cityName.toLowerCase())) {
        showNotification('This city is already added', 'warning');
        return;
    }
    
    setLoading(true);
    
    try {
        const results = await searchCity(cityName);
        
        if (results.length === 0) {
            showNotification('Location not found. Try another city or ZIP code.', 'error');
            setLoading(false);
            return;
        }
        
        const result = results[0];
        
        // Safely parse coordinates
        let lat, lon;
        try {
            lat = parseFloat(result.lat);
            lon = parseFloat(result.lon);
            
            if (isNaN(lat) || isNaN(lon)) {
                throw new Error('Invalid coordinates');
            }
        } catch (coordError) {
            console.error('Invalid coordinates:', result);
            showNotification('Could not determine location coordinates', 'error');
            setLoading(false);
            return;
        }
        
        // Extract display name
        let displayName = result.name || '';
        if (result.address) {
            displayName = result.address.split(',')[0].trim();
        }
        if (!displayName) displayName = cityName;
        
        // Get timezone for the city with error handling
        let timezone = getTimezoneFromCoordinates(lat, lon);
        timezone = getSafeTimezone(timezone);
        
        // Fetch weather for the city with error handling
        let weather = null;
        try {
            weather = await fetchWeather(lat, lon);
        } catch (weatherError) {
            console.error('Weather fetch error (using defaults):', weatherError);
            weather = {
                temperature: 0,
                weatherCode: 0,
                humidity: 0,
                windSpeed: 0,
                description: 'Data unavailable',
            };
        }
        
        // Get time with error handling
        let timeData = null;
        try {
            timeData = getTimeInTimezone(timezone);
        } catch (timeError) {
            console.error('Time calculation error:', timeError);
            // Try with UTC as fallback
            try {
                timezone = 'UTC';
                timeData = getTimeInTimezone('UTC');
            } catch (fallbackError) {
                console.error('Fallback time calculation failed:', fallbackError);
                showNotification('Could not calculate time for this location', 'error');
                setLoading(false);
                return;
            }
        }
        
        const newCity = {
            name: displayName,
            lat,
            lon,
            timezone,
            time: timeData.time,
            weather: weather,
        };
        
        cities.push(newCity);
        saveCitiesToStorage();
        renderCities();
        addCityMarker(newCity);
        
        document.getElementById('cityInput').value = '';
        document.getElementById('suggestions').innerHTML = '';
        document.getElementById('suggestions').classList.remove('active');
        
        showNotification(`Added ${displayName}!`, 'success');
    } catch (error) {
        console.error('Error adding city:', error);
        showNotification(`Error adding location: ${error.message || 'Unknown error'}`, 'error');
    } finally {
        setLoading(false);
    }
}

/**
 * Remove a city
 */
function removeCity(cityName) {
    cities = cities.filter(c => c.name !== cityName);
    saveCitiesToStorage();
    
    // Remove marker from map
    const markerId = `marker_${cityName}`;
    if (markerId in markers && map.hasLayer(markers[markerId])) {
        map.removeLayer(markers[markerId]);
        delete markers[markerId];
    }
    
    renderCities();
    showNotification(`Removed ${cityName}`, 'success');
}

/**
 * Clear all cities
 */
function clearAllCities() {
    if (cities.length === 0) return;
    
    if (confirm('Are you sure you want to remove all cities?')) {
        // Remove all markers
        Object.keys(markers).forEach(key => {
            if (key !== 'userLocation' && map.hasLayer(markers[key])) {
                map.removeLayer(markers[key]);
                delete markers[key];
            }
        });
        
        cities = [];
        saveCitiesToStorage();
        renderCities();
        showNotification('All cities cleared', 'success');
    }
}

/**
 * Render cities list
 */
function renderCities() {
    const citiesList = document.getElementById('citiesList');
    
    if (cities.length === 0) {
        citiesList.innerHTML = `
            <div class="no-cities">
                <i class="fas fa-inbox"></i>
                <p>No cities added yet</p>
                <small>Add cities to compare their time and weather</small>
            </div>
        `;
        return;
    }
    
    citiesList.innerHTML = cities.map(city => {
        const timeDiff = calculateTimeDifference(userLocation.timezone, city.timezone);
        const timeDiffClass = timeDiff > 0 ? 'ahead' : timeDiff < 0 ? 'behind' : '';
        const timeDiffText = timeDiff > 0 ? `+${timeDiff}h` : timeDiff < 0 ? `${timeDiff}h` : '0h';
        const cityDate = formatDateInTimezone(city.timezone);
        
        return `
            <div class="city-card">
                <div class="city-header">
                    <div>
                        <div class="city-name">${city.name}</div>
                        <div class="city-tz">${city.timezone}</div>
                    </div>
                    <button class="remove-btn" onclick="removeCity('${city.name}')">
                        <i class="fas fa-trash-alt"></i>
                    </button>
                </div>
                
                <div class="city-time" id="time_${city.name}">
                    ${city.time}
                </div>
                <div class="city-date" id="date_${city.name}">${cityDate}</div>
                
                <span class="time-diff ${timeDiffClass}">
                    ${timeDiffText}
                </span>
                
                <div class="city-weather">
                    <div class="city-weather-icon">
                        <i class="fas ${getWeatherIcon(city.weather?.weatherCode)}"></i>
                    </div>
                    <div class="city-weather-details">
                        <div class="city-weather-temp">${convertTemperature(city.weather?.temperature)}°C</div>
                        <div class="city-weather-condition">${city.weather?.description}</div>
                        <div class="city-weather-condition">Humidity: ${city.weather?.humidity}% | Wind: ${Math.round(city.weather?.windSpeed)} m/s</div>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

/**
 * Update all city times (called every second)
 */
function updateAllTimes() {
    try {
        // Update current time
        updateCurrentTime();
    } catch (error) {
        console.error('Error updating current time:', error);
    }
    
    // Update city times
    cities.forEach(city => {
        try {
            const timeData = getTimeInTimezone(city.timezone);
            city.time = timeData.time;
            
            const timeElement = document.getElementById(`time_${city.name}`);
            if (timeElement) {
                timeElement.textContent = city.time;
            }

            const dateElement = document.getElementById(`date_${city.name}`);
            if (dateElement) {
                dateElement.textContent = formatDateInTimezone(city.timezone);
            }
        } catch (error) {
            console.error(`Error updating time for city ${city.name}:`, error);
            // Keep previous time if update fails
        }
    });
}

/**
 * Get timezone from coordinates using IANA timezone names
 * Maps coordinates to proper IANA timezone identifiers
 */
function getTimezoneFromCoordinates(lat, lon) {
    try {
        // Map coordinates to IANA timezone names
        // Using major timezone regions for accurate coverage
        
        // Americas
        if (lon >= -165 && lon < -150 && lat > 50) return 'America/Anchorage';
        if (lon >= -160 && lon < -155) return 'Pacific/Honolulu';
        if (lon >= -130 && lon < -115 && lat > 45) return 'America/Los_Angeles';
        if (lon >= -125 && lon < -105 && lat > 45) return 'America/Denver';
        if (lon >= -105 && lon < -90 && lat > 40) return 'America/Chicago';
        if (lon >= -90 && lon < -75 && lat > 35) return 'America/New_York';
        if (lon >= -85 && lon < -70) return 'America/Toronto';
        if (lon >= -80 && lon < -60 && lat > 15) return 'America/Jamaica';
        if (lon >= -85 && lon < -60 && lat < 15 && lat > -20) return 'America/Caracas';
        if (lon >= -80 && lon < -60 && lat < -20) return 'America/Buenos_Aires';
        if (lon >= -75 && lon < -60 && lat > -25) return 'America/Sao_Paulo';
        if (lon >= -80 && lon < -70 && lat < -25) return 'America/Santiago';
        
        // Europe & Africa
        if (lon >= -15 && lon < 0 && lat > 50) return 'Europe/London';
        if (lon >= -5 && lon < 5 && lat > 45) return 'Europe/Paris';
        if (lon >= 5 && lon < 20 && lat > 40) return 'Europe/Rome';
        if (lon >= 20 && lon < 40 && lat > 35) return 'Europe/Athens';
        if (lon >= 15 && lon < 35 && lat > 30 && lat < 50) return 'Europe/Istanbul';
        if (lon >= -15 && lon < 40 && lat < 35 && lat > -30) return 'Africa/Cairo';
        if (lon >= 10 && lon < 40 && lat < 0) return 'Africa/Nairobi';
        if (lon >= 20 && lon < 50 && lat < -20) return 'Africa/Johannesburg';
        
        // Middle East & Central Asia
        if (lon >= 40 && lon < 60 && lat > 25 && lat < 40) return 'Asia/Dubai';
        if (lon >= 60 && lon < 80 && lat > 30 && lat < 50) return 'Asia/Kolkata';
        if (lon >= 75 && lon < 90 && lat > 25 && lat < 40) return 'Asia/Kolkata';
        if (lon >= 75 && lon < 100 && lat > 15 && lat < 30) return 'Asia/Bangkok';
        
        // East Asia
        if (lon >= 95 && lon < 110 && lat > 15 && lat < 35) return 'Asia/Shanghai';
        if (lon >= 100 && lon < 135 && lat > 30) return 'Asia/Tokyo';
        if (lon >= 120 && lon < 135 && lat > 30 && lat < 45) return 'Asia/Seoul';
        if (lon >= 105 && lon < 130 && lat > -10 && lat < 20) return 'Asia/Manila';
        
        // Oceania
        if (lon >= 130 && lon < 155 && lat > -20) return 'Australia/Sydney';
        if (lon >= 115 && lon < 130 && lat > -35 && lat < -10) return 'Australia/Perth';
        if (lon >= 145 && lon < 160 && lat > -50 && lat < -35) return 'Australia/Melbourne';
        if (lon >= 165 && lon <= 180 && lat > -50) return 'Pacific/Auckland';
        if (lon >= 170 && lon <= 180 && lat > -20 && lat < 0) return 'Pacific/Fiji';
        if (lon >= -180 && lon < -160 && lat > -20 && lat < 0) return 'Pacific/Pago_Pago';
        
        // Default based on longitude
        const hourOffset = Math.round(lon / 15);
        if (hourOffset === 0) return 'UTC';
        if (hourOffset > 0) return `Asia/Dubai`; // Default to positive timezone
        return 'America/New_York'; // Default to negative timezone
    } catch (error) {
        console.error('Error getting timezone:', error);
        return 'UTC'; // Fallback
    }
}

/**
 * Validate and get safe timezone
 * Falls back to UTC if timezone is invalid
 */
function getSafeTimezone(timezone) {
    try {
        // Test if timezone is valid by creating a date
        const testDate = dayjs.tz(new Date(), timezone);
        return timezone;
    } catch (error) {
        console.warn(`Invalid timezone "${timezone}", falling back to UTC`, error);
        return 'UTC';
    }
}

/**
 * Display user location info
 */
async function displayUserLocation() {
    if (!userLocation) return;
    
    document.getElementById('currentCity').textContent = userLocation.city;
    document.getElementById('currentCountry').textContent = userLocation.country.toUpperCase();
    document.getElementById('currentTimezone').textContent = userLocation.timezone;
    document.getElementById('coordinates').textContent = `Latitude: ${userLocation.latitude.toFixed(4)}, Longitude: ${userLocation.longitude.toFixed(4)}`;
    
    // Fetch weather for current location
    const weather = await fetchWeather(userLocation.latitude, userLocation.longitude);
    
    document.getElementById('currentTemp').textContent = `${convertTemperature(weather.temperature)}°C`;
    document.getElementById('currentCondition').textContent = weather.description;
    document.getElementById('currentHumidity').textContent = `Humidity: ${weather.humidity}%`;
    document.getElementById('currentWindSpeed').textContent = `Wind: ${Math.round(weather.windSpeed)} m/s`;
    
    const weatherIcon = document.getElementById('weatherIcon');
    weatherIcon.className = `fas ${getWeatherIcon(weather.weatherCode)}`;
    
    // Display quick info
    const quickInfo = document.getElementById('quickInfo');
    quickInfo.innerHTML = `
        <p><strong>Your IP:</strong> ${userLocation.ip}</p>
        <p><strong>Timezone:</strong> ${userLocation.timezone}</p>
        <p><strong>Coordinates:</strong> ${userLocation.latitude.toFixed(2)}°, ${userLocation.longitude.toFixed(2)}°</p>
    `;
}

// ============================================
// EVENT LISTENERS
// ============================================

// ============================================
// EVENT LISTENERS & AUTOCOMPLETE
// ============================================

// Debounce timer for search
let searchDebounceTimer = null;

/**
 * Setup city input autocomplete with debouncing
 */
document.getElementById('cityInput').addEventListener('input', (e) => {
    const query = e.target.value.trim();
    const suggestions = document.getElementById('suggestions');
    
    // Clear previous debounce timer
    if (searchDebounceTimer) {
        clearTimeout(searchDebounceTimer);
    }
    
    if (query.length < 2) {
        suggestions.innerHTML = '';
        suggestions.classList.remove('active');
        return;
    }
    
    // Show loading state
    suggestions.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-muted);"><small>Searching...</small></div>';
    suggestions.classList.add('active');
    
    // Debounce search (wait 300ms after user stops typing)
    searchDebounceTimer = setTimeout(async () => {
        try {
            const results = await searchCity(query);
            
            if (results.length === 0) {
                suggestions.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-muted);"><small>No results found for "' + query + '"</small></div>';
                suggestions.classList.add('active');
                return;
            }
            
            suggestions.innerHTML = results
                .slice(0, 8)
                .map((result, idx) => {
                    const address = result.address?.split(',').slice(-2).join(',').trim() || '';
                    const displayAddress = address ? `<small style="color: var(--text-muted);">${address}</small>` : '';
                    return `
                        <div class="suggestion-item" onclick="selectCity('${result.name.replace(/'/g, "\\'")}', event)" style="cursor: pointer; display: flex; flex-direction: column; gap: 0.25rem;">
                            <strong>${result.name}</strong>
                            ${displayAddress}
                        </div>
                    `;
                })
                .join('');
            suggestions.classList.add('active');
        } catch (error) {
            console.error('Error getting suggestions:', error);
            suggestions.innerHTML = '<div class="suggestion-item" style="text-align: center; color: var(--text-muted);"><small>Error searching. Try again.</small></div>';
            suggestions.classList.add('active');
        }
    }, 300); // Wait 300ms before searching
});

/**
 * Close suggestions when clicking outside
 */
document.addEventListener('click', (e) => {
    const suggestions = document.getElementById('suggestions');
    const cityInput = document.getElementById('cityInput');
    const addCityForm = document.querySelector('.add-city-form');
    
    if (!addCityForm.contains(e.target)) {
        suggestions.classList.remove('active');
    }
});

/**
 * Close suggestions with Escape key
 */
document.getElementById('cityInput').addEventListener('keydown', (e) => {
    const suggestions = document.getElementById('suggestions');
    if (e.key === 'Escape') {
        suggestions.classList.remove('active');
    }
});

/**
 * Select city from autocomplete
 */
window.selectCity = function(cityName, event) {
    if (event) {
        event.preventDefault();
        event.stopPropagation();
    }
    document.getElementById('cityInput').value = cityName;
    document.getElementById('suggestions').classList.remove('active');
};

/**
 * Add city on button click
 */
document.getElementById('addCityBtn').addEventListener('click', () => {
    const cityName = document.getElementById('cityInput').value.trim();
    if (cityName) {
        addCity(cityName);
    } else {
        showNotification('Please enter a city name or ZIP code', 'warning');
    }
});

/**
 * Add city on Enter key
 */
document.getElementById('cityInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        const cityName = document.getElementById('cityInput').value.trim();
        if (cityName) {
            addCity(cityName);
        }
    }
});

/**
 * Clear all cities
 */
document.getElementById('clearAllBtn').addEventListener('click', clearAllCities);

// ============================================
// INITIALIZATION
// ============================================

/**
 * Main initialization
 */
async function init() {
    console.log('=====================================');
    console.log('🌍 Global Time Checker - Initializing');
    console.log('=====================================');
    setLoading(true);
    
    try {
        // Fetch user location (with fallback if it fails)
        console.log('\n📍 Step 1: Fetching user location...');
        try {
            await fetchUserLocation();
            console.log('✓ Location fetched:', userLocation);
        } catch (locError) {
            console.error('✗ Location fetch failed, using fallback:', locError);
        }
        
        // Initialize map
        console.log('\n🗺️ Step 2: Initializing map...');
        try {
            if (typeof L !== 'undefined') {
                initializeMap();
                console.log('✓ Map initialized');
            } else {
                console.warn('⚠️ Leaflet library not available');
                map = null;
            }
        } catch (mapError) {
            console.error('✗ Map initialization failed:', mapError);
            showNotification('Map failed to load, but app will still work', 'warning');
        }
        
        // Display user location info
        console.log('\n ℹ️ Step 3: Displaying user location...');
        try {
            await displayUserLocation();
            console.log('✓ Location info displayed');
        } catch (displayError) {
            console.error('✗ Display location failed:', displayError);
        }
        
        // Load saved cities
        console.log('\n📚 Step 4: Loading saved cities...');
        loadCitiesFromStorage();
        console.log('✓ Cities loaded:', cities.length, 'cities');
        
        // Render city cards
        console.log('\n🎨 Step 5: Rendering cities...');
        renderCities();
        console.log('✓ Cities rendered');
        
        // Add map markers for all cities
        console.log('\n📌 Step 6: Adding map markers...');
        if (map) {
            try {
                refreshCityMarkers();
                console.log('✓ Map markers added');
            } catch (markerError) {
                console.error('✗ Failed to add markers:', markerError);
            }
        } else {
            console.warn('⚠️ Map not available, skipping markers');
        }
        
        // Start updating times every second
        console.log('\n⏱️ Step 7: Starting time updates...');
        updateCurrentTime();
        updateInterval = setInterval(updateAllTimes, 1000);
        console.log('✓ Time updates started');
        
        // Also refresh weather every 30 minutes
        console.log('\n🌤️ Step 8: Scheduling weather refresh...');
        setInterval(async () => {
            console.log('🔄 Refreshing weather data...');
            
            try {
                // Refresh user location weather
                const userWeather = await fetchWeather(userLocation.latitude, userLocation.longitude);
                const tempElem = document.getElementById('currentTemp');
                const condElem = document.getElementById('currentCondition');
                const humElem = document.getElementById('currentHumidity');
                const windElem = document.getElementById('currentWindSpeed');
                const iconElem = document.getElementById('weatherIcon');
                
                if (tempElem) tempElem.textContent = `${convertTemperature(userWeather.temperature)}°C`;
                if (condElem) condElem.textContent = userWeather.description;
                if (humElem) humElem.textContent = `Humidity: ${userWeather.humidity}%`;
                if (windElem) windElem.textContent = `Wind: ${Math.round(userWeather.windSpeed)} m/s`;
                if (iconElem) iconElem.className = `fas ${getWeatherIcon(userWeather.weatherCode)}`;
                
                // Refresh city weather
                for (let city of cities) {
                    const cityWeather = await fetchWeather(city.lat, city.lon);
                    city.weather = cityWeather;
                }
                
                renderCities();
                console.log('✓ Weather refreshed');
            } catch (refreshError) {
                console.error('✗ Weather refresh error:', refreshError);
            }
        }, 30 * 60 * 1000); // 30 minutes
        console.log('✓ Weather refresh scheduled');
        
        console.log('\n=====================================');
        console.log('✓ APP INITIALIZED SUCCESSFULLY!');
        console.log('=====================================\n');
        
        showNotification('Welcome! Your location detected.', 'success');
    } catch (error) {
        console.error('=====================================');
        console.error('❌ INITIALIZATION ERROR:', error);
        console.error('=====================================\n');
        console.error('Full error:', error);
        showNotification('App loaded with some issues. Try adding a city to get started.', 'warning');
    } finally {
        setLoading(false);
    }
}

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, checking dependencies...');
    
    // Check if required libraries are loaded
    if (typeof dayjs === 'undefined') {
        console.error('❌ Day.js not loaded!');
        alert('Error: Required library (Day.js) not loaded. Please refresh the page.');
        return;
    }
    
    if (typeof L === 'undefined') {
        console.warn('⚠️ Leaflet not loaded, map will not work');
    }
    
    console.log('✓ Dependencies loaded');
    console.log('✓ Starting initialization...');
    
    // Give a small delay to ensure all DOM elements are accessible
    setTimeout(() => {
        init();
    }, 100);
});

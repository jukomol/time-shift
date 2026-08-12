// Mobile-specific configuration and overrides
console.log('📱 Loading mobile-specific configuration...');

// Override map initialization for mobile
const originalInitializeMap = typeof initializeMap !== 'undefined' ? initializeMap : null;
window.initializeMap = function() {
    console.log('ℹ️ Map initialization skipped on mobile version');
    // Map is not available on mobile
    map = null;
};

const originalSetupMapControls = typeof setupMapControls !== 'undefined' ? setupMapControls : null;
window.setupMapControls = function() {
    console.log('ℹ️ Map controls setup skipped on mobile version');
    // No map controls on mobile
};

const originalAddCityMarker = typeof addCityMarker !== 'undefined' ? addCityMarker : null;
window.addCityMarker = function(city) {
    console.log('ℹ️ City markers skipped on mobile version');
    // No map markers on mobile
};

const originalRefreshCityMarkers = typeof refreshCityMarkers !== 'undefined' ? refreshCityMarkers : null;
window.refreshCityMarkers = function() {
    console.log('ℹ️ Marker refresh skipped on mobile version');
    // No markers to refresh on mobile
};

// Override removeCity to handle mobile safely
const originalRemoveCity = typeof removeCity !== 'undefined' ? removeCity : null;
window.removeCity = function(cityName) {
    cities = cities.filter(c => c.name !== cityName);
    saveCitiesToStorage();

    // Skip map marker removal on mobile (map is null)
    if (map && markers) {
        const markerId = `marker_${cityName}`;
        if (markerId in markers && map.hasLayer(markers[markerId])) {
            map.removeLayer(markers[markerId]);
            delete markers[markerId];
        }
    }

    renderCities();
    showNotification(`Removed ${cityName}`, 'success');
};

// Override clearAllCities to handle mobile safely
const originalClearAllCities = typeof clearAllCities !== 'undefined' ? clearAllCities : null;
window.clearAllCities = function() {
    if (cities.length === 0) return;

    if (confirm('Are you sure you want to remove all cities?')) {
        // Remove all markers only if map exists
        if (map && markers) {
            Object.keys(markers).forEach(key => {
                if (key !== 'userLocation' && map.hasLayer(markers[key])) {
                    map.removeLayer(markers[key]);
                    delete markers[key];
                }
            });
        }

        cities = [];
        saveCitiesToStorage();
        renderCities();
        showNotification('All cities cleared', 'success');
    }
};

// Set global flag for mobile
window.isMobileVersion = true;

console.log('✓ Mobile configuration loaded');

// Handle viewport detection
function checkViewportAndRedirect() {
    const isMobile = window.innerWidth < 768;
    const isDesktop = window.innerWidth >= 768;
    const isDesktopVersion = document.getElementById('map') !== null;
    const isMobileVersion = document.getElementById('loadingSpinner') !== null && !isDesktopVersion;

    // Only redirect if significantly different
    if (isDesktop && isMobileVersion && window.innerWidth > 900) {
        const shouldRedirect = confirm(
            'This page is optimized for mobile.\n\nWould you like to switch to the desktop version with the map?'
        );
        if (shouldRedirect) {
            window.location.href = 'index.html';
        }
    }
}

// Check on load
window.addEventListener('load', () => {
    setTimeout(checkViewportAndRedirect, 1000);
});

// Check on resize
window.addEventListener('resize', () => {
    checkViewportAndRedirect();
});

console.log('📱 Mobile version ready');

// Add switch to desktop button functionality
document.addEventListener('DOMContentLoaded', () => {
    const switchBtn = document.getElementById('switchToDesktop');
    if (switchBtn) {
        switchBtn.addEventListener('click', () => {
            if (confirm('Switch to desktop version with map?')) {
                window.location.href = 'index.html';
            }
        });
    }
});

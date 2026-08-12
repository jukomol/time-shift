# Global Time Checker 🌍⏰

An interactive webapp that detects your current location via IP and displays your local time. Add multiple cities to compare times, view time differences, and check weather conditions worldwide.

## Features

✨ **Key Features:**
- 🌐 **Automatic Geolocation**: Detects your location using IP address (no permissions needed)
- 🗺️ **Interactive Map**: Visual representation of your location and added cities (Leaflet)
- ⏰ **Real-time Clock**: Shows current time in your timezone and all added cities
- 🌡️ **Weather Information**: Temperature, conditions, humidity, and wind speed for each location
- 📊 **Time Differences**: Automatically calculates how many hours ahead/behind each city is
- 💾 **Persistent Storage**: Your added cities are saved locally (localStorage)
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices
- 🎨 **Smooth Animations**: Beautiful transitions and interactive elements
- 🚀 **No Backend Required**: Pure frontend application - runs entirely in your browser

## Tech Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Map Library**: Leaflet.js (OpenStreetMap tiles)
- **Timezone Handling**: Day.js with timezone plugin
- **APIs**: 
  - IP-API (geolocation)
  - Open-Meteo (weather - no key required)
  - Nominatim (geocoding)
- **Hosting**: GitHub Pages

## How to Use

### Online
1. Visit the live demo at: `https://jukomol.github.io/time-shift`
2. Your location will be detected automatically
3. Type a city name in the input field and press Enter or click "Add"
4. Select from the suggestions dropdown
5. See the city's current time, weather, and time difference from your location
6. Click the trash icon to remove a city
7. Your cities will persist even after you close the browser

### Local Development
1. Clone this repository
2. Open `index.html` in your browser
3. Start adding cities!

## Deploy to GitHub Pages

1. Push this repository to GitHub
2. Go to your repository settings
3. Scroll to "GitHub Pages" section
4. Select "Deploy from a branch"
5. Choose `main` branch and `/root` folder
6. Your site will be live at `https://yourusername.github.io/time-checker`

## File Structure

```
time-checker/
├── index.html          # Main HTML structure
├── styles.css          # All styling and responsive design
├── app.js             # Core JavaScript logic
├── README.md          # This file
└── .gitignore         # Git ignore rules
```

## API Limits & Notes

⚠️ **Free API Limits:**
- **IP-API**: 100 requests/day per IP
- **Open-Meteo Weather**: Unlimited (no key required)
- **Nominatim**: ~1 request/second recommended

💡 **Timezone Calculation**: Uses approximate timezone mapping based on coordinates. For 100% accuracy, consider adding a paid timezone API service.

## Features Roadmap

- [ ] Multiple city sort/reorder
- [ ] Favorites/starred cities
- [ ] Dark/Light theme toggle
- [ ] 12/24 hour time format preference
- [ ] Temperature unit toggle (°C/°F)
- [ ] Sunrise/Sunset times
- [ ] City search history
- [ ] Export/Import city list

## Troubleshooting

**Map doesn't load?**
- Check your internet connection
- Ensure OpenStreetMap tiles are accessible in your region
- Try clearing browser cache

**Weather shows "Unavailable"?**
- Open-Meteo API might be rate-limited
- Check browser console for errors
- Try refreshing the page

**Cities not saving?**
- Ensure localStorage is enabled in your browser
- Check if you're in private/incognito mode (localStorage may be disabled)
- Clear browser cache and try again

**Wrong timezone for a city?**
- The app uses approximate timezone based on coordinates
- Consider using precise timezone data for production use

## Contributing

Have ideas or found bugs? Feel free to open an issue or submit a pull request!

## License

This project is open source and available under the MIT License.

## Support

If you encounter any issues:
1. Check the troubleshooting section above
2. Open the browser console (F12) to see detailed error messages
3. Try adding a different city to test functionality
4. Clear localStorage and refresh to reset the app

---

**Made with ❤️ for global time travelers!**

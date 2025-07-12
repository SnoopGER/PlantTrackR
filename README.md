# Plant Tracker Web App

A simple web application for tracking plant growth with calendar functionality.

## Features
- Add new plants with seeding dates
- Track plant care events (watering, fertilizing, etc.)
- Delete or archive plants
- Export plant data as JSON

## Project Structure
```
plant-tracker/
├── index.html          # Main entry point
├── css/
│   └── styles.css      # Main stylesheet
├── js/
│   ├── main.js         # Main application logic
│   └── calendar.js     # Calendar functionality (to be implemented)
└── data/               # Directory for sample or exported data
```

## How to Use
1. Open `index.html` in a web browser
2. Click "Add Plant" to add new plants
3. Track care events using the calendar
4. Export your plant data using the "Export Data" button

## Development
To implement additional features:
- Add calendar functionality in `js/calendar.js`
- Extend the Plant class with more properties as needed
- Implement archive functionality for harvested plants
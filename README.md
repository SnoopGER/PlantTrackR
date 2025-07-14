# Plant Manager App

![Plant Manager Logo](logo_small.jpg)

## About

The Plant Manager app is a web application designed to help users manage their plants. It provides tools for tracking watering schedules, plant care tips, and maintaining a catalog of your plant collection.

## Features

- **Plant Catalog**: Keep track of all your plants with detailed information
- **Watering Schedule**: Set and receive reminders for when to water your plants
- **Care Instructions**: Store and view care tips for each plant species
- **Responsive Design**: Works on mobile, tablet, and desktop devices
- **Event Tracking**: Log and manage plant events (watering, fertilizing, etc.)
- **Growth Phases**: Track plant development through different growth phases
- **Archiving**: Archive plants that are no longer active
- **Data Export**: Export your plant data as JSON
- **Dark Mode**: Switch to dark mode for better visibility in low-light conditions

## Files

- `index.html`: Main entry point of the application
- `css/styles.css`: Stylesheet containing the app's design
- `js/calendar.js`: JavaScript file handling calendar functionality
- `js/main.js`: Main JavaScript file containing core app logic

## Getting Started

To use the Plant Manager app, simply open the `index.html` file in your web browser.

### Prerequisites

No special software is required. The app runs entirely in the browser and requires no installation.

### Installation

1. Clone the repository or download the files
2. Open `index.html` in any modern web browser

## Usage

1. **Add a Plant**: Click the "Add Plant" button to start tracking a new plant
2. **Set Watering Schedule**: Configure how often each plant needs to be watered
3. **View Care Tips**: Get plant-specific care instructions
4. **Receive Reminders**: The app will notify you when it's time to water your plants
5. **Track Growth**: Update and view plant growth phases
6. **Archive Plants**: Move inactive plants to the archive section
7. **Export Data**: Export your plant data for backup or transfer

## Customization

You can customize the app by modifying the following files:

- `css/styles.css`: Change the styling and design of the app
- `js/calendar.js`: Modify calendar-related functionality
- `js/main.js`: Update core app logic and features

## Code Documentation

### JavaScript Files

#### `js/main.js`
- Contains the core logic for the Plant Manager application
- Includes classes and functions for managing plants, handling events, and interacting with localStorage
- Features:
  - Plant tracking with name, seed date, and growth phases
  - Event management (watering, fertilizing, etc.)
  - LocalStorage persistence
  - Archive functionality
  - Data export/import

#### `js/calendar.js`
- Handles rendering and interaction with the calendar
- Features:
  - Monthly calendar view with navigation
  - Day selection for adding events
  - Integration with plant management system

### CSS File

#### `css/styles.css`
- Contains the CSS styles for the Plant Manager application
- Includes:
  - Base styles for layout and typography
  - Calendar component styling
  - Plant card styling (main content elements)
  - Dark mode styles
  - Responsive design adjustments

## License

This project is open-source and available under the MIT License.

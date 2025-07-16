# PlantTrackR Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [Project Structure](#project-structure)
3. [JavaScript Files](#javascript-files)
   - [main.js](#mainjs)
   - [calendar.js](#calendarjs)
   - [quickcards_final_complete.js](#quickcards_final_completejs)
   - [chartFix.js](#chartfixjs)
   - [dataUtils.js](#datautilsjs)
4. [CSS Files](#css-files)
   - [styles_new.css](#styles_newcss)
5. [HTML Structure](#html-structure)
6. [Project Configuration](#project-configuration)
7. [Usage Guide](#usage-guide)
8. [Contributing](#contributing)
9. [License](#license)

## Introduction

PlantTrackR is a comprehensive plant management application that helps users track their plants, manage growth phases, and maintain detailed records of plant care activities. This documentation provides an overview of the project structure, file contents, and technical details.

## Project Structure

```
src/
├── css/
│   ├── styles.css
│   └── styles_new.css
├── js/
│   ├── calendar.js
│   ├── main.js
│   ├── quickcards_final_complete.js
│   ├── chartFix.js
│   └── dataUtils.js
├── index.html
├── logo_small.jpg
├── README.md
├── server.log
└── jsconfig.json
```

## JavaScript Files

### main.js

- **Purpose**: Contains the core logic for the Plant Manager application
- **Classes**:
  - `Plant`: Represents individual plants with properties and methods
  - `PlantManager`: Singleton class managing all plant operations
- **Features**:
  - Plant tracking with name, seed date, and growth phases
  - Event management (watering, fertilizing, etc.)
  - LocalStorage persistence
  - Archive functionality
  - Data export/import

### calendar.js

- **Purpose**: Handles rendering and interaction with the calendar
- **Features**:
  - Rendering the calendar UI for the current month
  - Day selection for adding events
  - Integration with plant management system

### quickcards_final_complete.js

- **Purpose**: Manages Quick Card functionality
- **Classes**:
  - `QuickCard`: Represents individual Quick Cards
  - `QuickCardManager`: Manages all Quick Cards and their functionality
- **Features**:
  - Quick Card creation and storage
  - Drag-and-drop functionality
  - Integration with plant events

### chartFix.js

- **Purpose**: Contains fixes for chart rendering in plant cards
- **Features**:
  - Ensures proper dimensions and rendering of growth charts

### dataUtils.js

- **Purpose**: Contains utility functions for data compression/decompression
- **Features**:
  - Optimizes localStorage usage and improves performance

## CSS Files

### styles_new.css

- **Purpose**: Contains all CSS styles for the application
- **Sections**:
  - Base styles for layout and typography
  - Calendar component styling
  - Plant card styling (main content elements)
  - Dark mode styles
  - Responsive design adjustments

## HTML Structure

### index.html

- **Purpose**: Main HTML file that structures the application
- **Sections**:
  - Logo in top right corner
  - Main title of the application
  - Main content container with sidebar
  - Quick Cards sidebar
  - Plant list container
  - Add plant form
  - Calendar component
  - Archived plants section
  - Environment data inputs
  - Dark mode toggle
  - Main JavaScript files
  - Modal for adding new Quick Cards

## Project Configuration

### jsconfig.json

- **Purpose**: Project configuration file for JavaScript
- **Settings**:
  - Module: commonjs
  - Target: es6
  - AllowJs: true
  - Include: src/**/*

## Usage Guide

### Adding Plants

1. Click on the "Add New Plant" form
2. Enter the plant name and seed date
3. Click "Add Plant" button

### Managing Events

1. Click on a plant card to select it
2. Click "Add Event" button
3. Enter event type (e.g., "Watered", "Fertilized")
4. The event will be added to the selected plant

### Using Quick Cards

1. Click the "+" button in the Quick Cards sidebar
2. Enter label, details, and optional icon
3. Click "Save" to create the Quick Card
4. Drag and drop Quick Cards onto plant cards

### Calendar Integration

1. Click on a day in the calendar
2. Enter event type for the selected plant(s)
3. The event will be added to the selected day

### Dark Mode

1. Click the "🌙 Dark Mode umschalten" button
2. The interface will toggle between light and dark modes

## Contributing

Contributions are welcome! Please submit pull requests or open issues for any bugs, features, or improvements.

## License

This project is licensed under the MIT License.
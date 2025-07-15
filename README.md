# PlantTrackR - Plant Management Application

PlantTrackR is a comprehensive plant management application that helps users track their plants, manage growth phases, and maintain detailed records of plant care activities. The application features:

- Plant tracking with detailed growth phases
- Event management (watering, fertilizing, etc.)
- Drag-and-drop Quick Card functionality
- Calendar integration for event scheduling
- Dark mode support
- LocalStorage persistence
- Responsive design

## Features

### Plant Management
- Track multiple plants with detailed information
- Manage growth phases (Seedling, Mutter, Vegetative, Flowering, Drying, Curing)
- Add and view events for each plant
- Archive and unarchive plants

### Quick Cards
- Create custom Quick Cards for common tasks
- Drag-and-drop Quick Cards to plants for quick event logging
- Customizable labels and icons

### Calendar
- Interactive calendar for scheduling events
- Month navigation
- Day selection for event creation

### User Interface
- Clean, modern design with dark mode support
- Responsive layout for various screen sizes
- Intuitive plant card interface

## Project Structure

```
src/
├── css/
│   ├── styles.css
│   └── styles_new.css
├── js/
│   ├── calendar.js
│   ├── main.js
│   └── quickcards_final_complete.js
├── index.html
├── logo_small.jpg
├── README.md
└── server.log
```

## Getting Started

1. Clone the repository
2. Open `index.html` in a web browser
3. Start adding plants and managing your garden!

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

/**
 * Plant Manager App - Main JavaScript File
 *
 * This file contains the core logic for the Plant Manager application.
 * It includes classes and functions for managing plants, handling events,
 * and interacting with localStorage.
 *
 * Features:
 * - Plant tracking with name, seed date, and growth phases
 * - Event management (watering, fertilizing, etc.)
 * - LocalStorage persistence
 * - Archive functionality
 * - Data export/import
 *
 * Classes:
 * - Plant: Represents individual plants with properties and methods
 * - PlantManager: Singleton class managing all plant operations
 *
 * Functions:
 * - generateUUID(): Generates unique identifiers for plants
 * - DOMContentLoaded event handler: Initializes the application
 */
/**
 * Plant growth phases
 * @type {string[]}
 * @description Defines the different growth stages a plant can go through
 * Phases: Seedling, Mutter, Vegetative, Flowering, Drying, Curing, Harvested
 * @constant
 */
const PLANT_PHASES = [
    'Seedling',
    'Mutter',
    'Vegetative',
    'Flowering',
    'Drying',
    'Curing',
    'Harvested'
];


/**
 * Generate a unique identifier
 * Uses cryptographic random values for better uniqueness guarantees
 * @returns {string} Unique ID string (UUID v4 format)
 */
function generateUUID() {
    if (crypto && crypto.getRandomValues) {
        // Use cryptographic random values for better security
        const randomArray = new Uint8Array(16);
        crypto.getRandomValues(randomArray);
        // Convert to UUID version 4 format
        return (
            (randomArray[0] & 0x3f | 0x40).toString(16) +
            (randomArray[1] & 0x0f | 0x40).toString(16) +
            (randomArray[2] & 0x0f | 0x40).toString(16) +
            (randomArray[3] & 0x0f | 0x40).toString(16) +
            '-' +
            (randomArray[4] & 0x0f | 0x40).toString(16) +
            (randomArray[5] & 0x3f | 0x40).toString(16) +
            '-' +
            (randomArray[6] & 0x0f | 0x40).toString(16) +
            (randomArray[7] & 0x3f | 0x40).toString(16) +
            '-' +
            (randomArray[8] & 0x3f | 0x40).toString(16) +
            (randomArray[9] & 0x0f | 0x40).toString(16) +
            '-' +
            ((randomArray[10] & 0x3f | 0x40).toString(16) +
            (randomArray[11] & 0x0f | 0x40).toString(16) +
            (randomArray[12] & 0x3f | 0x40).toString(16) +
            (randomArray[13] & 0xff).toString(16))
        );
    } else {
        // Fallback to Math.random() for older environments
        return 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxx'.replace(/x/g, y => {
            const r = Math.random() * 16 | 0;
            return (y === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }
}

// UUID generation is now cryptographically secure using crypto.getRandomValues()

document.addEventListener('DOMContentLoaded', function() {
    try {
        const plantManager = PlantManager.getInstance();
        plantManager.setupEventListeners();

        const calendar = Calendar.getInstance();
        calendar.renderCalendar();

        // Set up event delegation for calendar day clicks
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
                const day = e.target.dataset.day;
                if (day) {
                    calendar.selectDay(parseInt(day, 10));
                }
            }
        });

        console.log('DOMContentLoaded event fired, plantManager and calendar initialized');

        // Attach the PlantManager instance to the window object for global access
        window.plantManager = plantManager;

    } catch (error) {
        console.error('Error during DOMContentLoaded:', error);
    }

    // Initialize the QuickCardManager when the DOM is loaded
    const quickCardManager = QuickCardManager.getInstance();
    quickCardManager.setupModalEventListeners();
    quickCardManager.setupEventListeners();

    // Set up drag-and-drop and modal functionality after plants are rendered
    plantManager.renderPlants = (function(originalRenderPlants) {
        return function() {
            console.log('Custom renderPlants called');
            originalRenderPlants.call(plantManager);
            console.log('Calling quickCardManager.renderQuickCards() to update UI');
            quickCardManager.renderQuickCards();
        };
    })(plantManager.renderPlants);
});

/**
 * Class representing a plant
 * @class
 * @param {string} name - The name of the plant
 * @param {string} seedDate - The seed date in YYYY-MM-DD format
 * @param {string} [id] - Optional plant ID (will be generated if not provided)
 * @param {string} [strain] - The strain of the plant (e.g., "Blue Dream", "Northern Lights")
 * @param {string} [growMedium] - The grow medium (e.g., "Soil", "Hydroponics", "Coco")
 * @param {string} [lightCycle] - The light cycle (e.g., "18/6", "12/12")
 * @param {string} [nutrientSchedule] - The nutrient schedule (e.g., "General Hydroponics", "Advanced Nutrients")
 * @description Represents a plant with name, seed date, growth phase, events, and unique ID
 * @property {string} name - The name of the plant
 * @property {string} seedDate - The seed date in YYYY-MM-DD format
 * @property {string} strain - The strain of the plant
 * @property {string} growMedium - The grow medium
 * @property {string} lightCycle - The light cycle
 * @property {string} nutrientSchedule - The nutrient schedule
 * @property {Array} events - Array of events for the plant
 * @property {string} phase - Current growth phase
 * @property {string} id - Unique identifier for the plant
 * @property {Array} heightData - Array of height measurements
 * @property {Array} weightData - Array of weight measurements
 */
class Plant {
    constructor(name, seedDate, id, strain, growMedium, lightCycle, nutrientSchedule) {
        this.name = name;
        this.seedDate = seedDate;
        this.strain = strain || '';
        this.growMedium = growMedium || '';
        this.lightCycle = lightCycle || '';
        this.nutrientSchedule = nutrientSchedule || '';
        this.events = [];
        this.phase = PLANT_PHASES[0]; // Default to first phase
        this.id = id || generateUUID(); // Assign ID, generate new one if not provided
        this.heightData = []; // Array to store height measurements: [{date: 'YYYY-MM-DD', height: number}]
        this.weightData = []; // Array to store weight measurements: [{date: 'YYYY-MM-DD', weight: number}]
    }

    /**
     * Add an event to the plant
     * @param {string} eventType - Type of event (e.g., "Watered", "Fertilized")
     * @param {string} date - Date of the event in YYYY-MM-DD format
     * @returns {Object} The event object that was added
     * @description Adds a new event to the plant's event history
     */
    addEvent(eventType, date) {
        const event = { type: eventType, date };
        this.events.push(event);
        return event;
    }

    /**
     * Remove an event from the plant
     * @param {number} index - Index of the event to remove
     * @returns {boolean} True if event was removed, false otherwise
     */
    removeEvent(index) {
        if (index >= 0 && index < this.events.length) {
            this.events.splice(index, 1);
            return true;
        }
        return false;
    }

    /**
     * Add height measurement
     * @param {number} height - Height in centimeters
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Object} The height measurement object that was added
     */
    addHeightMeasurement(height, date) {
        const measurement = { height, date };
        this.heightData.push(measurement);
        return measurement;
    }

    /**
     * Add weight measurement
     * @param {number} weight - Weight in grams
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Object} The weight measurement object that was added
     */
    addWeightMeasurement(weight, date) {
        const measurement = { weight, date };
        this.weightData.push(measurement);
        return measurement;
    }

    /**
     * Update the growth phase of the plant
     * @param {string} newPhase - New growth phase (e.g., "Vegetative", "Flowering")
     */
    updatePhase(newPhase) {
        this.phase = newPhase;

        // Automatically add a phase change event
        const today = new Date();
        const eventDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
        this.addEvent(`Phase Changed to ${newPhase}`, eventDate);
    }
}

/**
 * Singleton class managing all plant operations
 * @class
 * @description Manages plant data, UI rendering, and interactions
 * @singleton
 * @property {Array} plants - Array of active plants
 * @property {Array} archivedPlants - Array of archived plants
 * @property {Set} selectedPlants - Set of selected plant IDs
 * @property {Object} expandedEvents - Tracks which event sections are expanded
 * @property {string} currentTab - Tracks current tab for filtering (all, seedling, mutter, etc.)
 */
class PlantManager {
    constructor() {
        if (PlantManager.instance) {
            return PlantManager.instance;
        }

        this.plants = [];
        this.archivedPlants = [];
        this.selectedPlants = new Set(); // Track multiple selected plants using a Set of plant IDs
        this.expandedEvents = {}; // Track which event sections are expanded: {plantId: true/false}
        this.currentTab = 'all'; // Track current tab for filtering (all, seedling, mutter, etc.)

        // Initialize storage and load data only once
        this.initStorage();
        this.loadPlants();
        this.loadArchivedPlants();
        this.loadSelectedPlants(); // Load selected plants from localStorage

        // Store bound functions for proper cleanup
        this.handleDocumentClick = this.handleDocumentClick.bind(this);

        // Set the instance
        PlantManager.instance = this;

        // Attach PlantManager class to window object for global access
        window.PlantManager = PlantManager;

        // Initialize tab navigation
        this.setupTabNavigation();

        return this;
    }

    static getInstance() {
        if (!PlantManager.instance) {
            PlantManager.instance = new PlantManager();
        }
        return PlantManager.instance;
    }

    /**
     * Initialize localStorage if needed
     * @description Initializes localStorage items if they don't exist
     * @private
     */
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('plants')) {
            localStorage.setItem('plants', JSON.stringify([]));
        }
        if (!localStorage.getItem('archivedPlants')) {
            localStorage.setItem('archivedPlants', JSON.stringify([]));
        }
        // Initialize expandedEvents storage if needed
        if (!localStorage.getItem('expandedEvents')) {
            localStorage.setItem('expandedEvents', JSON.stringify({}));
        }
        // Initialize selectedPlants storage if needed
        if (!localStorage.getItem('selectedPlants')) {
            localStorage.setItem('selectedPlants', JSON.stringify([]));
        }
    }

    /**
     * Load plants from localStorage and render them
     */
    loadPlants() {
        try {
            const storedPlants = localStorage.getItem('plants');
            if (storedPlants) {
                try {
                    this.plants = JSON.parse(storedPlants).map(p => {
                        try {
                            const plant = new Plant(
                                p.name,
                                p.seedDate,
                                p.id,
                                p.strain || '',
                                p.growMedium || '',
                                p.lightCycle || '',
                                p.nutrientSchedule || ''
                            ); // Pass ID if available
                            // Ensure events are properly deserialized
                            if (p.events && Array.isArray(p.events)) {
                                plant.events = p.events;
                            }
                            // Set phase if available (phase is set after construction to avoid default override)
                            if (p.phase) {
                                plant.phase = p.phase;
                            }
                            // Deserialize height and weight data if available
                            if (p.heightData && Array.isArray(p.heightData)) {
                                plant.heightData = p.heightData;
                            }
                            if (p.weightData && Array.isArray(p.weightData)) {
                                plant.weightData = p.weightData;
                            }
                            return plant;
                        } catch (plantError) {
                            console.error('Error creating plant:', plantError);
                            return null;
                        }
                    }).filter(p => p !== null);

                    // Load expanded events state from localStorage if available
                    const storedExpandedEvents = localStorage.getItem('expandedEvents');
                    if (storedExpandedEvents) {
                        try {
                            Object.assign(this.expandedEvents, JSON.parse(storedExpandedEvents));
                        } catch (parseError) {
                            console.error('Error parsing expanded events state:', parseError);
                        }
                    }

                    this.renderPlants();
                } catch (parseError) {
                    console.error('Error parsing plants from localStorage:', parseError);
                }
            }
        } catch (error) {
            console.error('Error loading plants:', error);
        }
    }

    /**
     * Load selected plants from localStorage
     */
    loadSelectedPlants() {
        try {
            const storedSelectedPlants = localStorage.getItem('selectedPlants');
            if (storedSelectedPlants) {
                try {
                    const selectedPlantIds = JSON.parse(storedSelectedPlants);
                    this.selectedPlants = new Set(selectedPlantIds);
                    // Update UI to reflect the loaded selection state
                    this.updateSelectionUI();
                } catch (parseError) {
                    console.error('Error parsing selected plants from localStorage:', parseError);
                }
            }
        } catch (error) {
            console.error('Error loading selected plants:', error);
        }
    }

    /**
     * Save selected plants to localStorage
     */
    saveSelectedPlants() {
        try {
            localStorage.setItem('selectedPlants', JSON.stringify(Array.from(this.selectedPlants)));
        } catch (error) {
            console.error('Error saving selected plants to localStorage:', error);
        }
    }

    /**
     * Update UI to reflect current selection state
     */
    updateSelectionUI() {
        document.querySelectorAll('.plant-card').forEach(card => {
            const cardPlantId = card.dataset.plantId;
            if (this.selectedPlants.has(cardPlantId)) {
                card.classList.add('selected');
            } else {
                card.classList.remove('selected');
            }
        });

        // Save selection state to localStorage whenever UI is updated
        this.saveSelectedPlants();
    }

    /**
     * Load archived plants from localStorage and render them
     */
    loadArchivedPlants() {
        const storedArchived = localStorage.getItem('archivedPlants');
        if (storedArchived) {
            this.archivedPlants = JSON.parse(storedArchived).map(p => {
                const plant = new Plant(p.name, p.seedDate, p.id); // Pass ID if available
                // Ensure events are properly deserialized
                if (p.events && Array.isArray(p.events)) {
                    plant.events = p.events;
                }
                return plant;
            });
            this.renderArchivedPlants();
        }
    }

    /**
     * Add a new plant to the collection
     * @param {string} name - Name of the plant
     * @param {string} seedDate - Seed date in YYYY-MM-DD format
     * @param {string} [strain] - The strain of the plant (e.g., "Blue Dream", "Northern Lights")
     * @param {string} [growMedium] - The grow medium (e.g., "Soil", "Hydroponics", "Coco")
     * @param {string} [lightCycle] - The light cycle (e.g., "18/6", "12/12")
     * @param {string} [nutrientSchedule] - The nutrient schedule (e.g., "General Hydroponics", "Advanced Nutrients")
     * @returns {boolean} True if plant was added, false otherwise
     * @description Creates a new plant and adds it to the collection
     */
    addPlant(name, seedDate, strain, growMedium, lightCycle, nutrientSchedule) {
        if (!name || !seedDate) {
            alert('Please provide both plant name and seed date.');
            return false;
        }

        // Validate the date format
        const parsedDate = this.parseDate(seedDate);
        if (!parsedDate) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
            return false;
        }

        const newPlant = new Plant(name, seedDate, null, strain, growMedium, lightCycle, nutrientSchedule); // ID is automatically generated
        // Initialize expanded state for the new plant (default to collapsed)
        this.expandedEvents[newPlant.id] = false;

        this.plants.push(newPlant);

        // Save to localStorage
        localStorage.setItem('plants', JSON.stringify(this.plants));
        localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

        // Update UI
        this.renderPlants();

        // Add the new plant to the selectedPlants set if it was just added via multi-selection
        // This allows for adding multiple plants and having them selected immediately
        if (this.selectedPlants.size > 0) {
            this.selectedPlants.add(newPlant.id);
        }

        // Save selection state to localStorage
        this.saveSelectedPlants();

        return true;
    }

    /**
     * Add an event to all selected plants
     * @param {string} eventType - Type of event (e.g., "Watered", "Fertilized")
     * @param {string} date - Date of the event in YYYY-MM-DD format
     * @returns {number} Number of plants that had events added
     */
       addEventToSelectedPlants(eventType, date) {
           if (this.selectedPlants.size === 0) {
               alert('No plants selected. Please select one or more plants first.');
               return 0;
           }

           if (!eventType) {
               alert('Please provide an event type.');
               return 0;
           }

           // Validate the date format
           const parsedDate = this.parseDate(date);
           if (!parsedDate) {
               alert('Invalid date format. Please use YYYY-MM-DD.');
               return 0;
           }

           let eventCount = 0;

          // Add event to each selected plant
          this.plants.forEach(plant => {
              if (this.selectedPlants.has(plant.id)) {
                  plant.addEvent(eventType, date);
                  eventCount++;
              }
          });

          // Save updated plant data to localStorage
          localStorage.setItem('plants', JSON.stringify(this.plants));

          // Update UI to show new events
          this.renderPlants();

          // Show success message
          alert(`Added ${eventType} event to ${eventCount} ${eventCount === 1 ? 'plant' : 'plants'}`);

          // Add a "Deselect All" button after adding events to multiple plants
          if (eventCount > 1) {
              this.addDeselectAllButton();
          }

          return eventCount;
      }

    /**
     * Add height measurement to all selected plants
     * @param {number} height - Height in centimeters
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {number} Number of plants that had height measurements added
     */
    addHeightToSelectedPlants(height, date) {
        if (this.selectedPlants.size === 0) {
            alert('No plants selected. Please select one or more plants first.');
            return 0;
        }

        if (isNaN(height) || height <= 0) {
            alert('Please provide a valid height in centimeters.');
            return 0;
        }

        // Validate the date format
        const parsedDate = this.parseDate(date);
        if (!parsedDate) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
            return 0;
        }

        let heightCount = 0;

        // Add height measurement to each selected plant
        this.plants.forEach(plant => {
            if (this.selectedPlants.has(plant.id)) {
                plant.addHeightMeasurement(height, date);
                heightCount++;
            }
        });

        // Save updated plant data to localStorage
        localStorage.setItem('plants', JSON.stringify(this.plants));

        // Update UI to show new height measurements
        this.renderPlants();

        // Show success message
        alert(`Added height measurement to ${heightCount} ${heightCount === 1 ? 'plant' : 'plants'}`);

        return heightCount;
    }

    /**
     * Add weight measurement to all selected plants
     * @param {number} weight - Weight in grams
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {number} Number of plants that had weight measurements added
     */
    addWeightToSelectedPlants(weight, date) {
        if (this.selectedPlants.size === 0) {
            alert('No plants selected. Please select one or more plants first.');
            return 0;
        }

        if (isNaN(weight) || weight <= 0) {
            alert('Please provide a valid weight in grams.');
            return 0;
        }

        // Validate the date format
        const parsedDate = this.parseDate(date);
        if (!parsedDate) {
            alert('Invalid date format. Please use YYYY-MM-DD.');
            return 0;
        }

        let weightCount = 0;

        // Add weight measurement to each selected plant
        this.plants.forEach(plant => {
            if (this.selectedPlants.has(plant.id)) {
                plant.addWeightMeasurement(weight, date);
                weightCount++;
            }
        });

        // Save updated plant data to localStorage
        localStorage.setItem('plants', JSON.stringify(this.plants));

        // Update UI to show new weight measurements
        this.renderPlants();

        // Show success message
        alert(`Added weight measurement to ${weightCount} ${weightCount === 1 ? 'plant' : 'plants'}`);

        return weightCount;
    }

    /**
     * Parse date string and validate format
     * @param {string} dateStr - Date string in YYYY-MM-DD format
     * @returns {Date|null} Parsed Date object or null if invalid
     */
    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;
        const [year, month, day] = parts;
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;

        // Create a Date object directly in local timezone
        // This ensures consistent handling without UTC conversion
        const date = new Date(year, month - 1, day);

        // Validate the date (handle invalid dates like February 30)
        // Check local date components for accuracy
        if (date.getFullYear() !== parseInt(year) ||
            date.getMonth() !== parseInt(month) - 1 ||
            date.getDate() !== parseInt(day)) {
            return null;
        }

        // Return the local date object
        return date;
    }

    /**
     * Render growth charts for a plant
     * @param {Plant} plant - The plant to render charts for
     * @param {string} plantId - The plant's ID
     */
    renderGrowthCharts(plant, plantId) {
        // Render height chart
        const heightChart = document.getElementById(`height-chart-${plantId}`);
        if (heightChart) {
            heightChart.innerHTML = '';

            if (plant.heightData.length > 0) {
                // Create a simple line chart for height data
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 100;
                heightChart.appendChild(canvas);

                const ctx = canvas.getContext('2d');

                // Set up chart
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#007bff';
                ctx.lineWidth = 2;

                // Draw height data
                const maxHeight = Math.max(...plant.heightData.map(d => d.height));
                const days = plant.heightData.map((d, i) => i);

                // Draw x-axis
                ctx.beginPath();
                ctx.moveTo(10, canvas.height - 10);
                ctx.lineTo(canvas.width - 10, canvas.height - 10);
                ctx.stroke();

                // Draw y-axis
                ctx.beginPath();
                ctx.moveTo(10, canvas.height - 10);
                ctx.lineTo(10, 10);
                ctx.stroke();

                // Draw data points and line
                ctx.beginPath();
                ctx.moveTo(10 + days[0] * ((canvas.width - 20) / days.length), canvas.height - 10 - (plant.heightData[0].height / maxHeight) * (canvas.height - 20));

                for (let i = 1; i < plant.heightData.length; i++) {
                    const x = 10 + days[i] * ((canvas.width - 20) / days.length);
                    const y = canvas.height - 10 - (plant.heightData[i].height / maxHeight) * (canvas.height - 20);
                    ctx.lineTo(x, y);
                }

                ctx.stroke();

                // Add labels
                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.fillText('Height (cm)', 10, 15);
                ctx.fillText('Days', canvas.width - 30, canvas.height - 5);
            } else {
                heightChart.innerHTML = '<p>No height data yet.</p>';
            }
        }

        // Render weight chart
        const weightChart = document.getElementById(`weight-chart-${plantId}`);
        if (weightChart) {
            weightChart.innerHTML = '';

            if (plant.weightData.length > 0) {
                // Create a simple line chart for weight data
                const canvas = document.createElement('canvas');
                canvas.width = 200;
                canvas.height = 100;
                weightChart.appendChild(canvas);

                const ctx = canvas.getContext('2d');

                // Set up chart
                ctx.fillStyle = '#fff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.strokeStyle = '#28a745';
                ctx.lineWidth = 2;

                // Draw weight data
                const maxWeight = Math.max(...plant.weightData.map(d => d.weight));
                const days = plant.weightData.map((d, i) => i);

                // Draw x-axis
                ctx.beginPath();
                ctx.moveTo(10, canvas.height - 10);
                ctx.lineTo(canvas.width - 10, canvas.height - 10);
                ctx.stroke();

                // Draw y-axis
                ctx.beginPath();
                ctx.moveTo(10, canvas.height - 10);
                ctx.lineTo(10, 10);
                ctx.stroke();

                // Draw data points and line
                ctx.beginPath();
                ctx.moveTo(10 + days[0] * ((canvas.width - 20) / days.length), canvas.height - 10 - (plant.weightData[0].weight / maxWeight) * (canvas.height - 20));

                for (let i = 1; i < plant.weightData.length; i++) {
                    const x = 10 + days[i] * ((canvas.width - 20) / days.length);
                    const y = canvas.height - 10 - (plant.weightData[i].weight / maxWeight) * (canvas.height - 20);
                    ctx.lineTo(x, y);
                }

                ctx.stroke();

                // Add labels
                ctx.fillStyle = '#333';
                ctx.font = '10px Arial';
                ctx.fillText('Weight (g)', 10, 15);
                ctx.fillText('Days', canvas.width - 30, canvas.height - 5);
            } else {
                weightChart.innerHTML = '<p>No weight data yet.</p>';
            }
        }
    }

    /**
     * Setup tab navigation and event listeners
     */
    setupTabNavigation() {
        // Get all tab buttons
        const tabButtons = document.querySelectorAll('#plant-tabs .tab-btn');
        if (tabButtons.length > 0) {
            // Set up click event listeners for each tab
            tabButtons.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.stopPropagation();
                    // Remove active class from all tabs
                    tabButtons.forEach(btn => btn.classList.remove('active'));
                    // Add active class to clicked tab
                    button.classList.add('active');
                    // Update current tab
                    this.currentTab = button.dataset.phase;
                    // Re-render plants with the new filter
                    this.renderPlants();
                });
            });
        }
    }

    /**
     * Setup event listeners for the document
     */
    setupEventListeners() {
        // Add plant button
        document.getElementById('addPlantFinalBtn').addEventListener('click', () => {
            const plantName = document.getElementById('plantNameInput').value;
            const plantSeedDate = document.getElementById('plantSeedDateInput').value;
            const plantStrain = document.getElementById('plantStrainInput').value || '';
            const plantGrowMedium = document.getElementById('plantGrowMediumInput').value || '';
            const plantLightCycle = document.getElementById('plantLightCycleInput').value || '';
            const plantNutrientSchedule = document.getElementById('plantNutrientScheduleInput').value || '';

            if (this.addPlant(plantName, plantSeedDate, plantStrain, plantGrowMedium, plantLightCycle, plantNutrientSchedule)) {
                // Clear input fields after successful addition
                document.getElementById('plantNameInput').value = '';
                document.getElementById('plantStrainInput').value = '';
                document.getElementById('plantGrowMediumInput').value = '';
                document.getElementById('plantLightCycleInput').value = '';
                document.getElementById('plantNutrientScheduleInput').value = '';

                // Set current date as default value for seed date field
                const today = new Date();
                const yyyy = today.getFullYear();
                const mm = String(today.getMonth() + 1).padStart(2, '0'); // Months are zero-based
                const dd = String(today.getDate()).padStart(2, '0');
                document.getElementById('plantSeedDateInput').value = `${yyyy}-${mm}-${dd}`;
            }
        });

        // Export data button
        document.getElementById('export-data-btn').addEventListener('click', () => {
            const plantData = this.exportPlants();
            const blob = new Blob([plantData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plants.json';
            a.click();
            URL.revokeObjectURL(url);
        });

        // Import data button
        document.getElementById('import-data-btn').addEventListener('click', () => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.json';
            input.addEventListener('change', (event) => {
                const file = event.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                        try {
                            const jsonStr = e.target.result;
                            if (this.importPlants(jsonStr)) {
                                alert('Plants imported successfully!');
                            }
                        } catch (error) {
                            alert('Error importing plants: ' + error.message);
                        }
                    };
                    reader.readAsText(file);
                }
            });
            input.click();
        });

        // Add events to selected plants button
        document.getElementById('add-events-to-selected-btn').addEventListener('click', () => {
            const eventType = prompt('Enter event type (e.g., Watered, Fertilized):');
            if (eventType) {
                const today = new Date();
                const eventDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                this.addEventToSelectedPlants(eventType, eventDate);
            }
        });

        // Add height to selected plants button
        const addHeightToSelectedBtn = document.createElement('button');
        addHeightToSelectedBtn.id = 'add-height-to-selected-btn';
        addHeightToSelectedBtn.innerHTML = '<span>📏</span> Add Height to Selected';
        addHeightToSelectedBtn.addEventListener('click', () => {
            const height = prompt('Enter height in centimeters:');
            if (height !== null) {
                const heightNum = parseFloat(height);
                if (!isNaN(heightNum) && heightNum > 0) {
                    const today = new Date();
                    const heightDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                    this.addHeightToSelectedPlants(heightNum, heightDate);
                } else {
                    alert('Please enter a valid height in centimeters.');
                }
            }
        });
        document.getElementById('add-plant-form').appendChild(addHeightToSelectedBtn);

        // Add weight to selected plants button
        const addWeightToSelectedBtn = document.createElement('button');
        addWeightToSelectedBtn.id = 'add-weight-to-selected-btn';
        addWeightToSelectedBtn.innerHTML = '<span>🏋️</span> Add Weight to Selected';
        addWeightToSelectedBtn.addEventListener('click', () => {
            const weight = prompt('Enter weight in grams:');
            if (weight !== null) {
                const weightNum = parseFloat(weight);
                if (!isNaN(weightNum) && weightNum > 0) {
                    const today = new Date();
                    const weightDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                    this.addWeightToSelectedPlants(weightNum, weightDate);
                } else {
                    alert('Please enter a valid weight in grams.');
                }
            }
        });
        document.getElementById('add-plant-form').appendChild(addWeightToSelectedBtn);

        // Clear selection button
        document.getElementById('clear-selection-btn').addEventListener('click', () => {
            this.selectedPlants.clear();
            // Update UI to remove selection from all cards
            document.querySelectorAll('.plant-card').forEach(card => {
                card.classList.remove('selected');
            });
            // Save cleared selection state to localStorage
            this.saveSelectedPlants();
        });

        // Archive section toggle
        const archiveHeader = document.querySelector('.archive-section h2');
        if (archiveHeader) {
            archiveHeader.addEventListener('click', () => {
                const archivedPlantsDiv = document.getElementById('archived-plants');
                if (archivedPlantsDiv) {
                    if (archivedPlantsDiv.style.display === 'none' || !archivedPlantsDiv.style.display) {
                        archivedPlantsDiv.style.display = 'block';
                        archiveHeader.textContent = 'Archived Plants ▼';
                    } else {
                        archivedPlantsDiv.style.display = 'none';
                        archiveHeader.textContent = 'Archived Plants ▶';
                    }
                }
            });
        }

        // Handle clicks outside of plant cards to close menus
        document.addEventListener('click', this.handleDocumentClick);
    }

    /**
     * Handle document click events
     * Closes phase menus and events sections when clicking outside
     * @param {MouseEvent} event - The click event
     */
    handleDocumentClick(event) {
        // Close phase menus when clicking outside
        document.querySelectorAll('.phase-menu').forEach(menu => {
            if (!menu.contains(event.target) && !event.target.classList.contains('phase-btn')) {
                menu.style.display = 'none';
            }
        });

        // Close events sections when clicking outside and update expanded state
        document.querySelectorAll('.events-dropdown').forEach(section => {
            const toggleBtn = section.querySelector('.toggle-events-btn');
            if (toggleBtn && !section.contains(event.target) && !event.target.classList.contains('toggle-events-btn') &&
                !event.target.classList.contains('delete-event-btn') && !event.target.closest('.events-list')) {
                // Update expanded state when closing
                const plantId = section.closest('.plant-card').dataset.plantId;
                if (plantId) {
                    this.expandedEvents[plantId] = false;
                    localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                }
                section.style.display = 'none';
            }
        });
    }

    /**
     * Export plant data to JSON
     * @returns {string} JSON string containing plant data
     */
    exportPlants() {
        return JSON.stringify(this.plants);
    }

    /**
     * Import plant data from JSON
     * @param {string} jsonStr - JSON string containing plant data
     * @returns {boolean} True if import was successful, false otherwise
     */
    importPlants(jsonStr) {
        try {
            const importedPlants = JSON.parse(jsonStr);
            if (!Array.isArray(importedPlants)) {
                throw new Error('Invalid plant data format');
            }

            // Reset expanded events state before importing
            this.expandedEvents = {};

            this.plants = importedPlants.map(p => {
                const plant = new Plant(
                    p.name,
                    p.seedDate,
                    p.id,
                    p.strain || '',
                    p.growMedium || '',
                    p.lightCycle || '',
                    p.nutrientSchedule || ''
                );
                if (p.events && Array.isArray(p.events)) {
                    plant.events = p.events;
                }
                if (p.phase) {
                    plant.phase = p.phase;
                }
                // Deserialize height and weight data if available
                if (p.heightData && Array.isArray(p.heightData)) {
                    plant.heightData = p.heightData;
                }
                if (p.weightData && Array.isArray(p.weightData)) {
                    plant.weightData = p.weightData;
                }
                return plant;
            });

            // Initialize expanded state for all imported plants (default to collapsed)
            this.plants.forEach(plant => {
                this.expandedEvents[plant.id] = false;
            });
            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

            localStorage.setItem('plants', jsonStr);
            this.renderPlants();
            return true;
        } catch (error) {
            alert('Error importing plants: ' + error.message);
            return false;
        }
    }

    /**
     * Archive a plant
     * @param {number} index - Index of the plant to archive
     * @returns {boolean} True if plant was archived, false otherwise
     */
    archivePlant(index) {
        if (index >= 0 && index < this.plants.length) {
            const archivedPlant = this.plants.splice(index, 1)[0];
            // Remove the expanded state for this plant when it's archived
            delete this.expandedEvents[archivedPlant.id];
            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

            this.archivedPlants.push(archivedPlant);
            localStorage.setItem('plants', JSON.stringify(this.plants));
            localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
            this.renderPlants();
            this.renderArchivedPlants();
            return true;
        }
        return false;
    }

    /**
     * Unarchive a plant
     * @param {number} index - Index of the archived plant to unarchive
     * @returns {boolean} True if plant was unarchived, false otherwise
     */
    unarchivePlant(index) {
        if (index >= 0 && index < this.archivedPlants.length) {
            const unarchivedPlant = this.archivedPlants.splice(index, 1)[0];
            // Initialize expanded state for the unarchived plant (default to collapsed)
            this.expandedEvents[unarchivedPlant.id] = false;
            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

            this.plants.push(unarchivedPlant);
            localStorage.setItem('plants', JSON.stringify(this.plants));
            localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
            this.renderPlants();
            this.renderArchivedPlants();
            return true;
        }
        return false;
    }

    /**
     * Delete an archived plant
     * @param {number} index - Index of the archived plant to delete
     * @returns {boolean} True if plant was deleted, false otherwise
     */
    deleteArchivedPlant(index) {
        if (index >= 0 && index < this.archivedPlants.length) {
            const deletedPlant = this.archivedPlants.splice(index, 1)[0];
            // Remove the expanded state for this plant when it's deleted
            delete this.expandedEvents[deletedPlant.id];
            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

            localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
            this.renderArchivedPlants();
            return true;
        }
        return false;
    }

    /**
     * Render all plants in the UI
     */
    renderPlants() {
        console.log('renderPlants called with tab:', this.currentTab);
        const plantList = document.getElementById('plant-list');
        if (!plantList) {
            console.log('plant-list element not found');
            return;
        }

        // Clear existing plants
        plantList.innerHTML = '';
        console.log('Rendering', this.plants.length, 'plants');

        // Preserve expanded state before rendering
        const expandedState = {};
        Object.keys(this.expandedEvents).forEach(plantId => {
            expandedState[plantId] = this.expandedEvents[plantId];
        });

        // Filter plants based on current tab
        const plantsToRender = this.filterPlantsByPhase(this.currentTab);

        // Render each plant
        plantsToRender.forEach((plant, index) => {
            console.log(`Rendering plant ${index}: ${plant.name} with ${plant.events.length} events`);
            const plantCard = document.createElement('div');
            plantCard.className = 'plant-card';
            plantCard.dataset.index = index;
            plantCard.dataset.plantId = plant.id; // Add plant ID for selection tracking

            // Set initial selected state
            if (this.selectedPlants.has(plant.id)) {
                plantCard.classList.add('selected');
            }

            // Add selection functionality
            plantCard.addEventListener('click', (e) => {
                // Prevent event from bubbling up when clicking on edit button or other child elements
                if (e.target.classList.contains('edit-name-btn') ||
                    e.target.classList.contains('phase-btn') ||
                    e.target.classList.contains('archive-btn') ||
                    e.target.classList.contains('delete-btn') ||
                    e.target.classList.contains('add-event-btn') ||
                    e.target.classList.contains('add-height-btn') ||
                    e.target.classList.contains('add-weight-btn') ||
                    e.target.classList.contains('toggle-events-btn') ||
                    e.target.classList.contains('edit-event-btn') ||
                    e.target.classList.contains('delete-event-btn')) {
                    return;
                }

                // Handle plant selection (toggle selection)
                if (this.selectedPlants.has(plant.id)) {
                    this.selectedPlants.delete(plant.id);
                    plantCard.classList.remove('selected');
                } else {
                    this.selectedPlants.add(plant.id);
                    plantCard.classList.add('selected');
                }

                // Save selection state to localStorage
                this.saveSelectedPlants();

                // Update UI to show selection state
                this.updateSelectionUI();
            });

            // Plant name and seed date with edit button
            plantCard.innerHTML = `
                <div class="card-header">
                    <h3>${plant.name}</h3>
                    <button class="edit-name-btn" data-plant-id="${plant.id}">✏️</button>
                    <p>Seed Date: ${plant.seedDate}</p>
                </div>
                <div class="plant-details">
                    <p><strong>Strain:</strong> ${plant.strain || 'Not specified'}</p>
                    <p><strong>Grow Medium:</strong> ${plant.growMedium || 'Not specified'}</p>
                    <p><strong>Light Cycle:</strong> ${plant.lightCycle || 'Not specified'}</p>
                    <p><strong>Nutrient Schedule:</strong> ${plant.nutrientSchedule || 'Not specified'}</p>
                </div>
                <div class="phase-control">
                    <label>Phase:</label>
                    <button class="phase-btn phase-btn-${plant.phase.toLowerCase().replace(' ', '-')}">${plant.phase}</button>
                </div>
                <div class="growth-tracking">
                    <div class="height-tracking">
                        <h4>Height Tracking</h4>
                        <div id="height-chart-${plant.id}" class="height-chart"></div>
                        <button class="add-height-btn" data-plant-id="${plant.id}">Add Height</button>
                    </div>
                    <div class="weight-tracking">
                        <h4>Weight Tracking</h4>
                        <div id="weight-chart-${plant.id}" class="weight-chart"></div>
                        <button class="add-weight-btn" data-plant-id="${plant.id}">Add Weight</button>
                    </div>
                </div>
                <div class="card-actions">
                    <button class="archive-btn">Archive</button>
                </div>
            `;

            // Edit name button functionality - move this after the element is created
            const editNameBtn = plantCard.querySelector('.edit-name-btn');
            editNameBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const newName = prompt('Edit plant name:', plant.name);
                if (newName && newName.trim() !== '') {
                    plant.name = newName.trim();

                    // Save updated plant data to localStorage
                    localStorage.setItem('plants', JSON.stringify(this.plants));

                    // Preserve expanded state before rendering
                    const expandedState = {};
                    Object.keys(this.expandedEvents).forEach(plantId => {
                        expandedState[plantId] = this.expandedEvents[plantId];
                    });

                    // Render plants to update the UI with the new name
                    this.renderPlants();

                    // Restore expanded state after rendering
                    Object.keys(expandedState).forEach(plantId => {
                        this.expandedEvents[plantId] = expandedState[plantId];
                        // Update the UI to reflect the expanded state
                        const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                        if (eventsSection) {
                            eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                        }
                    });
                    localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                }
            });

            // Add Event button
            const addEventBtn = document.createElement('button');
            addEventBtn.className = 'add-event-btn';
            addEventBtn.innerHTML = '<span>📅</span> Add Event';
            addEventBtn.setAttribute('tooltip', 'Add an event to this plant');
            addEventBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                // Handle add event functionality
                const eventType = prompt('Enter event type (e.g., Watered, Fertilized):');
                if (eventType) {
                    const today = new Date();
                    const eventDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

                    // Check if multiple plants are selected
                    if (this.selectedPlants.size > 1) {
                        const confirmed = confirm(`You have multiple plants selected. Do you want to add this event to all selected plants?`);
                        if (confirmed) {
                            this.addEventToSelectedPlants(eventType, eventDate);
                        } else {
                            // Add event to just this plant
                            plant.addEvent(eventType, eventDate);

                            // Save updated plant data to localStorage
                            localStorage.setItem('plants', JSON.stringify(this.plants));

                            // Preserve expanded state before rendering
                            const expandedState = {};
                            Object.keys(this.expandedEvents).forEach(plantId => {
                                expandedState[plantId] = this.expandedEvents[plantId];
                            });

                            // Render plants
                            this.renderPlants();

                            // Restore expanded state after rendering
                            Object.keys(expandedState).forEach(plantId => {
                                this.expandedEvents[plantId] = expandedState[plantId];
                                // Update the UI to reflect the expanded state
                                const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                                if (eventsSection) {
                                    eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                                }
                            });
                            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                            alert(`Added ${eventType} event for ${plant.name}`);
                        }
                    } else {
                        // Add event to just this plant
                        plant.addEvent(eventType, eventDate);

                        // Save updated plant data to localStorage
                        localStorage.setItem('plants', JSON.stringify(this.plants));

                        // Preserve expanded state before rendering
                        const expandedState = {};
                        Object.keys(this.expandedEvents).forEach(plantId => {
                            expandedState[plantId] = this.expandedEvents[plantId];
                        });

                        // Render plants
                        this.renderPlants();

                        // Restore expanded state after rendering
                        Object.keys(expandedState).forEach(plantId => {
                            this.expandedEvents[plantId] = expandedState[plantId];
                            // Update the UI to reflect the expanded state
                            const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                            if (eventsSection) {
                                eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                            }
                        });
                        localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                        alert(`Added ${eventType} event for ${plant.name}`);
                    }
                }
            });

            // Add Height button
            const addHeightBtn = plantCard.querySelector('.add-height-btn');
            addHeightBtn.setAttribute('tooltip', 'Add height measurement');
            addHeightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const height = prompt('Enter height in centimeters:');
                if (height !== null) {
                    const heightNum = parseFloat(height);
                    if (!isNaN(heightNum) && heightNum > 0) {
                        const today = new Date();
                        const heightDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

                        // Add height measurement to this plant
                        plant.addHeightMeasurement(heightNum, heightDate);

                        // Save updated plant data to localStorage
                        localStorage.setItem('plants', JSON.stringify(this.plants));

                        // Render plants to update the UI with the new height measurement
                        this.renderPlants();

                        alert(`Added height measurement for ${plant.name}`);
                    } else {
                        alert('Please enter a valid height in centimeters.');
                    }
                }
            });

            // Add Weight button
            const addWeightBtn = plantCard.querySelector('.add-weight-btn');
            addWeightBtn.setAttribute('tooltip', 'Add weight measurement');
            addWeightBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const weight = prompt('Enter weight in grams:');
                if (weight !== null) {
                    const weightNum = parseFloat(weight);
                    if (!isNaN(weightNum) && weightNum > 0) {
                        const today = new Date();
                        const weightDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format

                        // Add weight measurement to this plant
                        plant.addWeightMeasurement(weightNum, weightDate);

                        // Save updated plant data to localStorage
                        localStorage.setItem('plants', JSON.stringify(this.plants));

                        // Render plants to update the UI with the new weight measurement
                        this.renderPlants();

                        alert(`Added weight measurement for ${plant.name}`);
                    } else {
                        alert('Please enter a valid weight in grams.');
                    }
                }
            });

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<span>🗑️</span> Delete';
            deleteBtn.setAttribute('tooltip', 'Delete this plant');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${plant.name}?`)) {
                    // Remove the expanded state for this plant when it's deleted
                    delete this.expandedEvents[plant.id];
                    localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));

                    this.plants.splice(index, 1);
                    localStorage.setItem('plants', JSON.stringify(this.plants));
                    // Preserve expanded state before rendering
                    const expandedState = {};
                    Object.keys(this.expandedEvents).forEach(plantId => {
                        expandedState[plantId] = this.expandedEvents[plantId];
                    });

                    // Render plants
                    this.renderPlants();

                    // Restore expanded state after rendering
                    Object.keys(expandedState).forEach(plantId => {
                        this.expandedEvents[plantId] = expandedState[plantId];
                        // Update the UI to reflect the expanded state
                        const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                        if (eventsSection) {
                            eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                        }
                    });
                    localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                }
            });

            // Phase dropdown menu
            const phaseMenu = document.createElement('div');
            phaseMenu.className = 'phase-menu';
            phaseMenu.style.display = 'none';

            PLANT_PHASES.forEach(phase => {
                const phaseOption = document.createElement('button');
                phaseOption.className = `phase-option phase-${phase.toLowerCase().replace(' ', '-')}`;
                phaseOption.textContent = phase;
                phaseOption.addEventListener('click', (e) => {
                    e.stopPropagation();
                    plant.updatePhase(phase);

                    // Save updated plant data to localStorage before rendering
                    localStorage.setItem('plants', JSON.stringify(this.plants));

                    // Preserve expanded state before rendering
                    const expandedState = {};
                    Object.keys(this.expandedEvents).forEach(plantId => {
                        expandedState[plantId] = this.expandedEvents[plantId];
                    });

                    // Render plants
                    this.renderPlants();

                    // Restore expanded state after rendering
                    Object.keys(expandedState).forEach(plantId => {
                        this.expandedEvents[plantId] = expandedState[plantId];
                        // Update the UI to reflect the expanded state
                        const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                        if (eventsSection) {
                            eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                        }
                    });
                    localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                });
                phaseMenu.appendChild(phaseOption);
            });

            // Add buttons to actions div in the desired order: Add Event, Archive, Delete
            const actionsDiv = plantCard.querySelector('.card-actions');
            // Remove the existing archive button from the DOM
            const existingArchiveBtn = actionsDiv.querySelector('.archive-btn');
            if (existingArchiveBtn) {
                existingArchiveBtn.remove();
            }

            // Add buttons in the desired order
            actionsDiv.appendChild(addEventBtn);
            actionsDiv.appendChild(deleteBtn);

            // Create and add the archive button
            const newArchiveBtn = document.createElement('button');
            newArchiveBtn.className = 'archive-btn';
            newArchiveBtn.innerHTML = '<span>✏️</span> Archive';
            newArchiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.archivePlant(index);
            });
            actionsDiv.appendChild(newArchiveBtn);

            // Render growth charts after the plant card is created
            this.renderGrowthCharts(plant, plant.id);

            // Add drop-zone class for drag-and-drop functionality
            plantCard.classList.add('drop-zone');
            plantCard.dataset.plantId = plant.id;

            // Create the toggle button with the 📋 icon
            const toggleEventsBtn = document.createElement('button');
            toggleEventsBtn.className = 'toggle-events-btn';
            toggleEventsBtn.innerHTML = '<span>📋</span> View Events';

            // Events section (will be toggled)
            const eventsSection = document.createElement('div');
            eventsSection.className = 'events-dropdown';
            eventsSection.style.display = 'none';

            const eventsList = document.createElement('div');
            eventsList.className = 'events-list';

            if (plant.events && plant.events.length > 0) {
                plant.events.forEach((event, eventIndex) => {
                    const eventItem = document.createElement('div');
                    eventItem.className = 'event';
                    eventItem.innerHTML = `
                        ${event.type} - ${event.date}
                        <button class="edit-event-btn" data-event-index="${eventIndex}">✏️</button>
                        <button class="delete-event-btn" data-event-index="${eventIndex}">✕</button>
                    `;

                    // Edit event button functionality
                    const editEventBtn = eventItem.querySelector('.edit-event-btn');
                    editEventBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        // Get current event data
                        const currentType = prompt('Edit event type:', event.type);

                        // Update event type only
                        plant.events[eventIndex].type = currentType;

                        // Save updated plant data to localStorage
                        localStorage.setItem('plants', JSON.stringify(this.plants));

                        // Preserve expanded state before rendering
                        const expandedState = {};
                        Object.keys(this.expandedEvents).forEach(plantId => {
                            expandedState[plantId] = this.expandedEvents[plantId];
                        });

                        // Render plants
                        this.renderPlants();

                        // Restore expanded state after rendering
                        Object.keys(expandedState).forEach(plantId => {
                            this.expandedEvents[plantId] = expandedState[plantId];
                            // Update the UI to reflect the expanded state
                            const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                            if (eventsSection) {
                                eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                            }
                        });
                        localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                    });

                    // Delete event button functionality
                    const deleteEventBtn = eventItem.querySelector('.delete-event-btn');
                    deleteEventBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this event?')) {
                            plant.removeEvent(eventIndex);

                            // Save updated plant data to localStorage
                            localStorage.setItem('plants', JSON.stringify(this.plants));

                            // Preserve expanded state before rendering
                            const expandedState = {};
                            Object.keys(this.expandedEvents).forEach(plantId => {
                                expandedState[plantId] = this.expandedEvents[plantId];
                            });

                            // Render plants
                            this.renderPlants();

                            // Restore expanded state after rendering
                            Object.keys(expandedState).forEach(plantId => {
                                this.expandedEvents[plantId] = expandedState[plantId];
                                // Update the UI to reflect the expanded state
                                const eventsSection = document.querySelector(`.plant-card[data-plant-id="${plantId}"] .events-dropdown`);
                                if (eventsSection) {
                                    eventsSection.style.display = expandedState[plantId] ? 'block' : 'none';
                                }
                            });
                            localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
                        }
                    });

                    eventsList.appendChild(eventItem);
                });
            } else {
                eventsList.innerHTML = '<p>No events yet.</p>';
            }

            eventsSection.appendChild(eventsList);

            // Add button and events section to card
            plantCard.appendChild(toggleEventsBtn);
            plantCard.appendChild(eventsSection);

            // Set initial display state based on expandedEvents tracking
            if (this.expandedEvents[plant.id]) {
                eventsSection.style.display = 'block';
            } else {
                eventsSection.style.display = 'none';
            }

            // Add click event to toggle events display and update tracking
            toggleEventsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const isExpanded = eventsSection.style.display === 'block';
                this.expandedEvents[plant.id] = !isExpanded;
                eventsSection.style.display = !isExpanded ? 'block' : 'none';

                // Save expanded state to localStorage
                localStorage.setItem('expandedEvents', JSON.stringify(this.expandedEvents));
            });

            // Phase button with dropdown functionality
            const phaseBtn = plantCard.querySelector('.phase-btn');
            phaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                phaseMenu.style.display = phaseMenu.style.display === 'none' ? 'block' : 'none';

                // Position the menu relative to the button
                if (phaseMenu.style.display === 'block') {
                    const btnRect = phaseBtn.getBoundingClientRect();
                    const cardRect = plantCard.getBoundingClientRect();

                    // Calculate position relative to the card
                    const menuLeft = btnRect.left - cardRect.left;
                    const menuTop = btnRect.bottom - cardRect.top + 8; // 8px margin

                    phaseMenu.style.left = `${menuLeft}px`;
                    phaseMenu.style.top = `${menuTop}px`;
                }
            });

            // Add phase menu to card
            plantCard.appendChild(phaseMenu);

            // Archive button functionality
            const archiveBtn = plantCard.querySelector('.archive-btn');
            archiveBtn.innerHTML = '<span>✏️</span> Archive';
            archiveBtn.setAttribute('tooltip', 'Archive this plant');
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.archivePlant(index);
            });

            plantList.appendChild(plantCard);
        });
    }

    /**
     * Filter plants by phase based on current tab
     * @param {string} phase - The phase to filter by, or 'all' for all plants
     * @returns {Plant[]} Array of plants to render
     */
    filterPlantsByPhase(phase) {
        if (phase === 'all') {
            return this.plants;
        } else {
            return this.plants.filter(plant => plant.phase.toLowerCase() === phase);
        }
    }

    /**
     * Render all archived plants in the UI
     */
    renderArchivedPlants() {
        const archivedPlantsDiv = document.getElementById('archived-plants');
        if (!archivedPlantsDiv) return;

        // Clear existing archived plants
        archivedPlantsDiv.innerHTML = '';

        // Render each archived plant
        this.archivedPlants.forEach((plant, index) => {
            const archivedPlant = document.createElement('div');
            archivedPlant.className = 'archived-plant';
            archivedPlant.dataset.index = index;

            archivedPlant.innerHTML = `
                <div class="card-header">
                    <h4>${plant.name}</h4>
                    <p>Seed Date: ${plant.seedDate}</p>
                </div>
                <div class="card-actions">
                    <button class="unarchive-btn">Unarchive</button>
                </div>
            `;

            // Unarchive button functionality
            const unarchiveBtn = archivedPlant.querySelector('.unarchive-btn');
            unarchiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.unarchivePlant(index);
            });

            // Delete button functionality
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-archived-btn';
            deleteBtn.innerHTML = 'Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to permanently delete ${plant.name}?`)) {
                    this.deleteArchivedPlant(index);
                }
            });

            // Add delete button to actions div
            const actionsDiv = archivedPlant.querySelector('.card-actions');
            actionsDiv.appendChild(deleteBtn);

            archivedPlantsDiv.appendChild(archivedPlant);
        });
    }
}
   

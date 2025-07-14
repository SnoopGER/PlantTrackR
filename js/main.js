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
 */
/**
 * Plant growth phases
 * @type {string[]}
 */
const PLANT_PHASES = [
    'Seedling',
    'Mutter',
    'Vegetative',
    'Flowering',
    'Drying',
    'Curing'
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
    } catch (error) {
        console.error('Error during DOMContentLoaded:', error);
    }
});

/**
 * Class representing a plant
 */
class Plant {
    constructor(name, seedDate, id) {
        this.name = name;
        this.seedDate = seedDate;
        this.events = [];
        this.phase = PLANT_PHASES[0]; // Default to first phase
        this.id = id || generateUUID(); // Assign ID, generate new one if not provided
    }

    /**
     * Add an event to the plant
     * @param {string} eventType - Type of event (e.g., "Watered", "Fertilized")
     * @param {string} date - Date of the event in YYYY-MM-DD format
     * @returns {Object} The event object that was added
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
     * Update the growth phase of the plant
     * @param {string} newPhase - New growth phase (e.g., "Vegetative", "Flowering")
     */
    updatePhase(newPhase) {
        this.phase = newPhase;
    }
}

/**
 * Singleton class managing all plant operations
 */
class PlantManager {
    constructor() {
        if (PlantManager.instance) {
            return PlantManager.instance;
        }

        this.plants = [];
        this.archivedPlants = [];
        this.selectedPlants = new Set(); // Track multiple selected plants using a Set of plant IDs

        // Initialize storage and load data only once
        this.initStorage();
        this.loadPlants();
        this.loadArchivedPlants();

        // Store bound functions for proper cleanup
        this.handleDocumentClick = this.handleDocumentClick.bind(this);

        // Set the instance
        PlantManager.instance = this;

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
     */
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('plants')) {
            localStorage.setItem('plants', JSON.stringify([]));
        }
        if (!localStorage.getItem('archivedPlants')) {
            localStorage.setItem('archivedPlants', JSON.stringify([]));
        }
    }

    /**
     * Load plants from localStorage and render them
     */
    loadPlants() {
        try {
            const storedPlants = localStorage.getItem('plants');
            console.log('Loaded plants from storage:', storedPlants);
            if (storedPlants) {
                try {
                    this.plants = JSON.parse(storedPlants).map(p => {
                        try {
                            const plant = new Plant(p.name, p.seedDate, p.id); // Pass ID if available
                            // Ensure events are properly deserialized
                            if (p.events && Array.isArray(p.events)) {
                                plant.events = p.events;
                            }
                            // Set phase if available
                            if (p.phase) {
                                plant.phase = p.phase;
                            }
                            return plant;
                        } catch (plantError) {
                            console.error('Error creating plant:', plantError);
                            return null;
                        }
                    }).filter(p => p !== null);
                    console.log('Parsed plants:', this.plants);
                    this.renderPlants();
                } catch (parseError) {
                    console.error('Error parsing plants from localStorage:', parseError);
                }
            } else {
                console.log('No plants found in localStorage');
            }
        } catch (error) {
            console.error('Error loading plants:', error);
        }
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
     * @returns {boolean} True if plant was added, false otherwise
     */
     addPlant(name, seedDate) {
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

         const newPlant = new Plant(name, seedDate); // ID is automatically generated
         this.plants.push(newPlant);

         // Save to localStorage
         localStorage.setItem('plants', JSON.stringify(this.plants));

         // Update UI
         this.renderPlants();

         // Add the new plant to the selectedPlants set if it was just added via multi-selection
         // This allows for adding multiple plants and having them selected immediately
         if (this.selectedPlants.size > 0) {
             this.selectedPlants.add(newPlant.id);
         }

         return true;
     }

    /**
     * Add an event to all selected plants
     * @param {string} eventType - Type of event (e.g., "Watered", "Fertilized")
     * @param {string} date - Date of the event in YYYY-MM-DD format
     * @returns {number} Number of plants that had events added
     */
     addEventToSelectedPlants(eventType, date) {
         let eventCount = 0;

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
             const deselectAllBtn = document.createElement('button');
             deselectAllBtn.id = 'deselect-all-btn';
             deselectAllBtn.innerHTML = '<span>🗕</span> Deselect All';
             deselectAllBtn.style.position = 'fixed';
             deselectAllBtn.style.top = '50%';
             deselectAllBtn.style.left = '50%';
             deselectAllBtn.style.transform = 'translate(-50%, -50%)';
             deselectAllBtn.style.padding = '12px 24px';
             deselectAllBtn.style.backgroundColor = '#ff6347';
             deselectAllBtn.style.color = 'white';
             deselectAllBtn.style.border = 'none';
             deselectAllBtn.style.borderRadius = '8px';
             deselectAllBtn.style.cursor = 'pointer';
             deselectAllBtn.style.zIndex = '1000';
             deselectAllBtn.style.boxShadow = '0 4px 10px rgba(0,0,0,0.3)';
             deselectAllBtn.style.transition = 'opacity 0.3s ease';
             deselectAllBtn.style.fontSize = '16px';
             deselectAllBtn.style.fontWeight = 'bold';
             deselectAllBtn.style.minWidth = '200px';
             deselectAllBtn.style.textAlign = 'center';

             // Add countdown text
             const countdownText = document.createElement('div');
             countdownText.style.fontSize = '12px';
             countdownText.style.color = 'white';
             countdownText.style.marginTop = '8px';
             countdownText.textContent = 'This button will disappear in 3 seconds...';

             deselectAllBtn.appendChild(countdownText);

             deselectAllBtn.addEventListener('click', () => {
                 this.selectedPlants.clear();
                 // Update UI to remove selection from all cards
                 document.querySelectorAll('.plant-card').forEach(card => {
                     card.classList.remove('selected');
                 });
                 // Remove the deselect button immediately on click
                 if (deselectAllBtn.parentNode) {
                     deselectAllBtn.parentNode.removeChild(deselectAllBtn);
                 }
             });

             // Add the button to the body
             document.body.appendChild(deselectAllBtn);

             // Remove the button after 6 seconds
             setTimeout(() => {
                 if (deselectAllBtn.parentNode) {
                     deselectAllBtn.parentNode.removeChild(deselectAllBtn);
                 }
             }, 6000);

             // Update countdown text every second
             let countdown = 6;
             const countdownInterval = setInterval(() => {
                 countdown--;
                 countdownText.textContent = `This button will disappear in ${countdown} seconds...`;
                 if (countdown <= 0) {
                     clearInterval(countdownInterval);
                 }
             }, 1000);
         }

         return eventCount;
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
        const date = new Date(year, month - 1, day);
        // Validate the date (handle invalid dates like February 30)
        if (date.getFullYear() !== parseInt(year) ||
            date.getMonth() !== parseInt(month) - 1 ||
            date.getDate() !== parseInt(day)) {
            return null;
        }
        return date;
    }

    /**
     * Setup event listeners for the document
     */
    setupEventListeners() {
        // Add plant button
        document.getElementById('addPlantFinalBtn').addEventListener('click', () => {
            const plantName = document.getElementById('plantNameInput').value;
            const plantSeedDate = document.getElementById('plantSeedDateInput').value;

            if (this.addPlant(plantName, plantSeedDate)) {
                // Clear input fields after successful addition
                document.getElementById('plantNameInput').value = '';
                document.getElementById('plantSeedDateInput').value = '';
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

        // Add events to selected plants button
        const addEventsToSelectedBtn = document.createElement('button');
        addEventsToSelectedBtn.id = 'add-events-to-selected-btn';
        addEventsToSelectedBtn.innerHTML = '<span>📅</span> Add Event to Selected';
        addEventsToSelectedBtn.addEventListener('click', () => {
            const eventType = prompt('Enter event type (e.g., Watered, Fertilized):');
            if (eventType) {
                const today = new Date();
                const eventDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
                this.addEventToSelectedPlants(eventType, eventDate);
            }
        });

        // Clear selection button
        const clearSelectionBtn = document.createElement('button');
        clearSelectionBtn.id = 'clear-selection-btn';
        clearSelectionBtn.innerHTML = '<span>🗑️</span> Clear Selection';
        clearSelectionBtn.addEventListener('click', () => {
            this.selectedPlants.clear();
            // Update UI to remove selection from all cards
            document.querySelectorAll('.plant-card').forEach(card => {
                card.classList.remove('selected');
            });
        });

        // Add buttons to actions section
        const actionsSection = document.getElementById('actions');
        if (actionsSection) {
            actionsSection.appendChild(addEventsToSelectedBtn);
            actionsSection.appendChild(clearSelectionBtn);
        }

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

        // Close events sections when clicking outside
        document.querySelectorAll('.events-dropdown').forEach(section => {
            const toggleBtn = section.querySelector('.toggle-events-btn');
            if (toggleBtn && !section.contains(event.target) && !event.target.classList.contains('toggle-events-btn') &&
                !event.target.classList.contains('delete-event-btn') && !event.target.closest('.events-list')) {
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
            this.plants = importedPlants.map(p => {
                const plant = new Plant(p.name, p.seedDate, p.id);
                if (p.events && Array.isArray(p.events)) {
                    plant.events = p.events;
                }
                if (p.phase) {
                    plant.phase = p.phase;
                }
                return plant;
            });
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
     * Render all plants in the UI
     */
    renderPlants() {
        console.log('renderPlants called');
        const plantList = document.getElementById('plant-list');
        if (!plantList) {
            console.log('plant-list element not found');
            return;
        }

        // Clear existing plants
        plantList.innerHTML = '';
        console.log('Rendering', this.plants.length, 'plants');

        // Render each plant
        this.plants.forEach((plant, index) => {
            console.log(`Rendering plant ${index}: ${plant.name}`);
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
                // Handle plant selection (toggle selection)
                if (this.selectedPlants.has(plant.id)) {
                    this.selectedPlants.delete(plant.id);
                    plantCard.classList.remove('selected');
                } else {
                    this.selectedPlants.add(plant.id);
                    plantCard.classList.add('selected');
                }

                // Update UI to show selection state
                document.querySelectorAll('.plant-card').forEach(card => {
                    const cardPlantId = card.dataset.plantId;
                    if (this.selectedPlants.has(cardPlantId)) {
                        card.classList.add('selected');
                    } else {
                        card.classList.remove('selected');
                    }
                });
            });

            // Plant name and seed date
            plantCard.innerHTML = `
                <div class="card-header">
                    <h3>${plant.name}</h3>
                    <p>Seed Date: ${plant.seedDate}</p>
                </div>
                <div class="phase-control">
                    <label>Phase:</label>
                    <button class="phase-btn phase-btn-${plant.phase.toLowerCase().replace(' ', '-')}">${plant.phase}</button>
                </div>
                <div class="card-actions">
                    <button class="archive-btn">Archive</button>
                </div>
            `;

            // Add Event button
            const addEventBtn = document.createElement('button');
            addEventBtn.className = 'add-event-btn';
            addEventBtn.innerHTML = '<span>📅</span> Add Event';
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

                            this.renderPlants(); // Update UI to show new event
                            alert(`Added ${eventType} event for ${plant.name}`);
                        }
                    } else {
                        // Add event to just this plant
                        plant.addEvent(eventType, eventDate);

                        // Save updated plant data to localStorage
                        localStorage.setItem('plants', JSON.stringify(this.plants));

                        this.renderPlants(); // Update UI to show new event
                        alert(`Added ${eventType} event for ${plant.name}`);
                    }
                }
            });

            // Delete button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.innerHTML = '<span>🗑️</span> Delete';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm(`Are you sure you want to delete ${plant.name}?`)) {
                    this.plants.splice(index, 1);
                    localStorage.setItem('plants', JSON.stringify(this.plants));
                    this.renderPlants(); // Update UI to remove deleted plant
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
                    this.renderPlants(); // Update UI to show new phase
                });
                phaseMenu.appendChild(phaseOption);
            });

            // Phase button with dropdown functionality
            const phaseBtn = plantCard.querySelector('.phase-btn');
            phaseBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                phaseMenu.style.display = phaseMenu.style.display === 'none' ? 'block' : 'none';
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

                        this.renderPlants(); // Update UI to show edited event
                    });

                    // Delete event button functionality
                    const deleteEventBtn = eventItem.querySelector('.delete-event-btn');
                    deleteEventBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        if (confirm('Are you sure you want to delete this event?')) {
                            plant.removeEvent(eventIndex);

                            // Save updated plant data to localStorage
                            localStorage.setItem('plants', JSON.stringify(this.plants));

                            this.renderPlants(); // Update UI to remove deleted event
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

            // Add click event to toggle events display
            toggleEventsBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                eventsSection.style.display = eventsSection.style.display === 'none' ? 'block' : 'none';
            });

            // Add phase menu to card
            plantCard.appendChild(phaseMenu);

            // Archive button functionality
            const archiveBtn = plantCard.querySelector('.archive-btn');
            archiveBtn.innerHTML = '<span>✏️</span> Archive';
            archiveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.archivePlant(index);
            });

            plantList.appendChild(plantCard);
        });
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

            archivedPlantsDiv.appendChild(archivedPlant);
        });
    }
}
   

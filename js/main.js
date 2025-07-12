document.addEventListener('DOMContentLoaded', function() {
    // Initialize plant manager using singleton pattern
    const plantManager = PlantManager.getInstance();

    // Set up event listeners for plants with proper cleanup
    const addPlantBtn = document.getElementById('add-plant-btn');
    if (addPlantBtn) {
        // Add click event listener to the button
        addPlantBtn.addEventListener('click', function() {
            plantManager.addPlant();
        });
    }

    const exportDataBtn = document.getElementById('export-data-btn');
    if (exportDataBtn) {
        // Remove existing event listeners first by replacing the element
        const parent = exportDataBtn.parentNode;
        const newExportDataBtn = exportDataBtn.cloneNode(true);
        parent.replaceChild(newExportDataBtn, exportDataBtn);
    
        // Add event listener to the new button
        newExportDataBtn.addEventListener('click', function() {
            plantManager.exportData();
        });
    }

    // Set up archive toggle
    const archiveToggle = document.querySelector('#archive-list h2');
    if (archiveToggle) {
        // Remove existing event listeners first by replacing the element
        const newArchiveToggle = archiveToggle.cloneNode(true);
        archiveToggle.parentNode.replaceChild(newArchiveToggle, archiveToggle);

        // Add click event listener to the new element
        newArchiveToggle.addEventListener('click', function() {
            const archivedPlantsDiv = document.getElementById('archived-plants');
            if (archivedPlantsDiv.style.display === 'none') {
                archivedPlantsDiv.style.display = 'block';
            } else {
                archivedPlantsDiv.style.display = 'none';
            }
        });
    }

    // Set up event delegation for the entire document
    plantManager.setupEventListeners();

    // Initialize Calendar using singleton pattern
    const calendar = Calendar.getInstance();
    calendar.renderCalendar();
});

// Plant class to represent a plant
class Plant {
    constructor(name, seedDate) {
        this.name = name;
        this.seedDate = seedDate;
        this.events = [];
        this.phase = 'Germination'; // Default phase
    }

    addEvent(eventType, date) {
        const event = { type: eventType, date };
        this.events.push(event);
        return event;
    }

    removeEvent(index) {
        if (index >= 0 && index < this.events.length) {
            this.events.splice(index, 1);
            return true;
        }
        return false;
    }

    updatePhase(newPhase) {
        this.phase = newPhase;
    }
}

// PlantManager class to handle plant operations
class PlantManager {
    constructor() {
        if (PlantManager.instance) {
            return PlantManager.instance;
        }

        this.plants = [];
        this.archivedPlants = [];

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

// Event handler functions for edit buttons (using event delegation)
// These are no longer needed as all event handling is done through the singleton instance

// PlantManager class to handle plant operations
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('plants')) {
            localStorage.setItem('plants', JSON.stringify([]));
        }
        if (!localStorage.getItem('archivedPlants')) {
            localStorage.setItem('archivedPlants', JSON.stringify([]));
        }
    }

    loadPlants() {
        const storedPlants = localStorage.getItem('plants');
        console.log('Loaded plants from storage:', storedPlants);
        if (storedPlants) {
            this.plants = JSON.parse(storedPlants).map(p => {
                const plant = new Plant(p.name, p.seedDate);
                // Ensure events are properly deserialized
                if (p.events && Array.isArray(p.events)) {
                    plant.events = p.events;
                }
                // Set phase if available
                if (p.phase) {
                    plant.phase = p.phase;
                }
                return plant;
            });
            console.log('Parsed plants:', this.plants);
            this.renderPlants();
        }
    }

    loadArchivedPlants() {
        const storedArchived = localStorage.getItem('archivedPlants');
        if (storedArchived) {
            this.archivedPlants = JSON.parse(storedArchived).map(p => {
                const plant = new Plant(p.name, p.seedDate);
                // Ensure events are properly deserialized
                if (p.events && Array.isArray(p.events)) {
                    plant.events = p.events;
                }
                return plant;
            });
            this.renderArchivedPlants();
        }
    }

    addPlant() {
        const name = prompt('Enter plant name:');
        const seedDate = prompt('Enter seeding date (YYYY-MM-DD):');

        if (name && seedDate) {
            const newPlant = new Plant(name, seedDate);
            this.plants.push(newPlant);

            // Save to localStorage
            localStorage.setItem('plants', JSON.stringify(this.plants));

            // Update UI
            this.renderPlants();
        }
    }

    renderPlants() {
        const plantList = document.getElementById('plant-list');
        plantList.innerHTML = '<h2>My Plants</h2>';

        this.plants.forEach(plant => {
            console.log(`Rendering plant ${plant.name} with events:`, plant.events);
            const plantDiv = document.createElement('div');
            plantDiv.className = 'plant';
            plantDiv.innerHTML = `
                <h3>${plant.name}</h3>
                <p>Seeded on: ${plant.seedDate}</p>

                <!-- Phase dropdown -->
                <div class="phase-dropdown">
                    <label for="phase-${plant.name}">Phase:</label>
                    <select id="phase-${plant.name}" data-name="${plant.name}">
                        <option value="Germination" ${plant.phase === 'Germination' ? 'selected' : ''}>Germination</option>
                        <option value="Seedling" ${plant.phase === 'Seedling' ? 'selected' : ''}>Seedling</option>
                        <option value="Vegetative" ${plant.phase === 'Vegetative' ? 'selected' : ''}>Vegetative</option>
                        <option value="Flowering" ${plant.phase === 'Flowering' ? 'selected' : ''}>Flowering</option>
                        <option value="Drying" ${plant.phase === 'Drying' ? 'selected' : ''}>Drying</option>
                        <option value="Curing" ${plant.phase === 'Curing' ? 'selected' : ''}>Curing</option>
                    </select>
                </div>

                <button class="add-event-btn" data-name="${plant.name}">Add Event</button>
                <button class="delete-btn" data-name="${plant.name}">Delete</button>
                <button class="archive-btn" data-name="${plant.name}">Archive</button>

                <!-- Events dropdown -->
                <div class="events-dropdown">
                    <button class="toggle-events-btn" data-name="${plant.name}">View Events ▼</button>
                    <div class="events-list" id="events-${plant.name}" style="display: none;">
                        ${this.renderEvents(plant.events, plant.name)}
                    </div>
                </div>

            `;
            plantList.appendChild(plantDiv);
        });

        // Note: All event listeners are now handled through delegation in setupEventListeners()
    }

    renderArchivedPlants() {
        const archiveList = document.getElementById('archived-plants');
        if (archiveList) {
            archiveList.innerHTML = '';

            this.archivedPlants.forEach(plant => {
                const plantDiv = document.createElement('div');
                plantDiv.className = 'archived-plant';
                plantDiv.innerHTML = `
                    <h3>${plant.name}</h3>
                    <p>Seeded on: ${plant.seedDate}</p>

                    <!-- Delete archived plant button -->
                    <button class="delete-archived-btn" data-name="${plant.name}">Delete</button>

                    <!-- Events list -->
                    <div class="events-list">
                        ${this.renderEvents(plant.events, plant.name)}
                    </div>
                `;
                archiveList.appendChild(plantDiv);
            });
        }
    }

    renderEvents(events, plantName) {
        console.log('Rendering events:', events);
        return events.map((event, index) => `
            <div class="event">
                <strong>${event.type}</strong> on ${new Date(event.date).toLocaleDateString()}
                <button class="edit-event-btn" data-plant="${plantName}" data-index="${index}">Edit</button>
                <button class="delete-event-btn" data-plant="${plantName}" data-index="${index}">X</button>
            </div>
        `).join('');
    }


    deletePlant(name) {
        this.plants = this.plants.filter(plant => plant.name !== name);
        localStorage.setItem('plants', JSON.stringify(this.plants));
        this.renderPlants();
    }

    updatePlantPhase(plantName, newPhase) {
        const plant = this.plants.find(p => p.name === plantName);
        if (plant) {
            plant.updatePhase(newPhase);

            // Save to localStorage
            localStorage.setItem('plants', JSON.stringify(this.plants));

            console.log(`Updated phase for ${plantName} to ${newPhase}`);
        }
    }

    removeEvent(plantName, eventIndex) {
        let plant = this.plants.find(p => p.name === plantName);

        // If not found in active plants, check archived plants
        if (!plant) {
            plant = this.archivedPlants.find(p => p.name === plantName);
        }

        if (plant && plant.removeEvent(eventIndex)) {
            // Save to localStorage - determine which storage to use
            if (this.plants.includes(plant)) {
                localStorage.setItem('plants', JSON.stringify(this.plants));
            } else { // archived plants
                localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
            }

            // Update UI - find the specific events list for this plant and update it
            const eventsList = document.getElementById(`events-${plantName}`);
            if (eventsList) {
                // Replace all events in the list to show complete history
                eventsList.innerHTML = this.renderEvents(plant.events, plant.name);
            }

            // Note: All event listeners are now handled through delegation in setupEventListeners()
        }
    }

    archivePlant(name) {
        const plantIndex = this.plants.findIndex(p => p.name === name);
        if (plantIndex !== -1) {
            const archivedPlant = this.plants.splice(plantIndex, 1)[0];
            this.archivedPlants.push(archivedPlant);

            // Save to localStorage
            localStorage.setItem('plants', JSON.stringify(this.plants));
            localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));

            // Update UI
            this.renderPlants();
            this.renderArchivedPlants();

            alert(`${name} has been archived`);
        }
    }

    deleteArchivedPlant(name) {
        const plantIndex = this.archivedPlants.findIndex(p => p.name === name);
        if (plantIndex !== -1) {
            // Remove from archived plants
            const deletedPlant = this.archivedPlants.splice(plantIndex, 1)[0];

            // Save to localStorage
            localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));

            // Update UI
            this.renderArchivedPlants();

            alert(`${name} has been permanently deleted`);
        }
    }

    exportData() {
        const data = localStorage.getItem('plants');
        if (data) {
            const blob = new Blob([data], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'plant_data.json';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
    }

    addEventToPlant(plantName, eventType, date) {
        console.log(`Adding event ${eventType} to plant ${plantName}`);
        let plant = this.plants.find(p => p.name === plantName);

        // If not found in active plants, check archived plants
        if (!plant) {
            plant = this.archivedPlants.find(p => p.name === plantName);
        }

        if (plant) {
            const event = plant.addEvent(eventType, date);

            // Save to localStorage - determine which storage to use
            if (this.plants.includes(plant)) {
                localStorage.setItem('plants', JSON.stringify(this.plants));
            } else { // archived plants
                localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
            }

            // Update UI - find the specific events list for this plant and update it
            const eventsList = document.getElementById(`events-${plantName}`);
            if (eventsList) {
                // Replace all events in the list to show complete history
                eventsList.innerHTML = this.renderEvents(plant.events, plant.name);
            }

            // Note: All event listeners are now handled through delegation in setupEventListeners()
        }
    }

    editEvent(plantName, eventIndex) {
        // Get the selected plant
        let plant = this.plants.find(p => p.name === plantName);

        // If not found in active plants, check archived plants
        if (!plant) {
            plant = this.archivedPlants.find(p => p.name === plantName);
        }
        
        if (plant && eventIndex >= 0 && eventIndex < plant.events.length) {
            const currentEvent = plant.events[eventIndex];
            const newType = prompt('Enter new event type:', currentEvent.type);
        
            if (newType) {
                // Update the event
                plant.events[eventIndex].type = newType;
        
                // Save to localStorage - determine which storage to use
                if (this.plants.includes(plant)) {
                    localStorage.setItem('plants', JSON.stringify(this.plants));
                } else { // archived plants
                    localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
                }
        
                // Update UI - find the specific events list for this plant and update it
                const eventsList = document.getElementById(`events-${plantName}`);
                if (eventsList) {
                    // Replace all events in the list to show complete history
                    eventsList.innerHTML = this.renderEvents(plant.events, plant.name);
                }
        
                alert(`Updated event for ${plantName}`);
            }
        } else {
            alert('Invalid event selection');
        }
    }

    editDate(plantName, eventIndex) {
        // Get the selected plant
        let plant = this.plants.find(p => p.name === plantName);

        // If not found in active plants, check archived plants
        if (!plant) {
            plant = this.archivedPlants.find(p => p.name === plantName);
        }
        
        if (plant && eventIndex >= 0 && eventIndex < plant.events.length) {
            const currentEvent = plant.events[eventIndex];
            const newDateStr = prompt('Enter new date (YYYY-MM-DD):', this.formatDateForInput(currentEvent.date));
        
            // Validate and parse the date
            const newDate = this.parseDate(newDateStr);
            if (newDate) {
                // Update the event
                plant.events[eventIndex].date = newDate.toISOString();
        
                // Save to localStorage - determine which storage to use
                if (this.plants.includes(plant)) {
                    localStorage.setItem('plants', JSON.stringify(this.plants));
                } else { // archived plants
                    localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
                }
        
                // Update UI - find the specific events list for this plant and update it
                const eventsList = document.getElementById(`events-${plantName}`);
                if (eventsList) {
                    // Replace all events in the list to show complete history
                    eventsList.innerHTML = this.renderEvents(plant.events, plant.name);
                }
        
                alert(`Updated date for ${plantName}'s event`);
            } else {
                alert('Invalid date format. Please use YYYY-MM-DD.');
            }
        } else {
            alert('Invalid event selection');
        }
    }

    parseDate(dateStr) {
        if (!dateStr) return null;
        const parts = dateStr.split('-');
        if (parts.length !== 3) return null;

        const year = parseInt(parts[0]);
        const month = parseInt(parts[1]) - 1; // Months are 0-based in JS Date
        const day = parseInt(parts[2]);

        // Validate date components
        if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
        if (year < 1000 || month < 0 || month > 11 || day < 1) return null;

        const date = new Date(year, month, day);
        // Check if the date is valid (accounting for month/day boundaries)
        if (date.getFullYear() === year && date.getMonth() === month && date.getDate() === day) {
            return date;
        }
        return null;
    }

    formatDateForInput(dateStr) {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
// Centralized event listener setup using delegation
setupEventListeners() {
    // Remove existing event listeners if they exist to prevent duplicates
    document.removeEventListener('click', this.handleDocumentClick);

    // Set up event delegation for the entire document
    document.addEventListener('click', this.handleDocumentClick);
}


    handleDocumentClick(e) {
        // Edit event buttons
        if (e.target.classList.contains('edit-event-btn')) {
            const plantName = e.target.dataset.plant;
            const eventIndex = parseInt(e.target.dataset.index);
            this.editEvent(plantName, eventIndex);
            e.stopPropagation();
            return;
        }

        // Edit date buttons
        if (e.target.classList.contains('edit-date-btn')) {
            const plantName = e.target.dataset.plant;
            const eventIndex = parseInt(e.target.dataset.index);
            this.editDate(plantName, eventIndex);
            e.stopPropagation();
            return;
        }

        // Delete event buttons
        if (e.target.classList.contains('delete-event-btn')) {
            const plantName = e.target.dataset.plant;
            const eventIndex = parseInt(e.target.dataset.index);
            this.removeEvent(plantName, eventIndex);
            e.stopPropagation();
            return;
        }

        // Add event buttons
        if (e.target.classList.contains('add-event-btn')) {
            const calendar = Calendar.getInstance();
            calendar.addEventToPlant(e.target.dataset.name);
            e.stopPropagation();
            return;
        }

        // Delete plant buttons
        if (e.target.classList.contains('delete-btn')) {
            this.deletePlant(e.target.dataset.name);
            e.stopPropagation();
            return;
        }

        // Archive plant buttons
        if (e.target.classList.contains('archive-btn')) {
            this.archivePlant(e.target.dataset.name);
            e.stopPropagation();
            return;
        }

        // Delete archived plant buttons
        if (e.target.classList.contains('delete-archived-btn')) {
            const plantName = e.target.dataset.name;
            const confirmed = confirm(`Are you sure you want to permanently delete ${plantName}? This action cannot be undone.`);
            if (confirmed) {
                this.deleteArchivedPlant(plantName);
            }
            e.stopPropagation();
            return;
        }

        // Toggle events view buttons
        if (e.target.classList.contains('toggle-events-btn')) {
            const plantName = e.target.dataset.name;
            const eventsList = document.getElementById(`events-${plantName}`);
            if (eventsList.style.display === 'none') {
                eventsList.style.display = 'block';
            } else {
                eventsList.style.display = 'none';
            }
            e.stopPropagation();
        }

        // Phase dropdown change
        if (e.target.tagName === 'SELECT' && e.target.classList.contains('phase-dropdown')) {
            const plantName = e.target.dataset.name;
            const newPhase = e.target.value;
            this.updatePlantPhase(plantName, newPhase);
            e.stopPropagation();
        }
    }
}
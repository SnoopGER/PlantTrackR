document.addEventListener('DOMContentLoaded', function() {
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
});

// Plant class to represent a plant
class Plant {
    constructor(name, seedDate) {
        this.name = name;
        this.seedDate = seedDate;
        this.events = [];
        this.phase = 'Seedling'; // New default phase
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
        this.selectedPlant = null; // Track the currently selected plant

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

        const newPlant = new Plant(name, seedDate);
        this.plants.push(newPlant);

        // Save to localStorage
        localStorage.setItem('plants', JSON.stringify(this.plants));

        // Update UI
        this.renderPlants();

        return true;
    }

    renderPlants() {
        const plantList = document.getElementById('plant-list');
        plantList.innerHTML = ''; // Clear existing content first

        this.plants.forEach(plant => {
            console.log(`Rendering plant ${plant.name} with events:`, plant.events);
            const plantDiv = document.createElement('div');
            // Add 'selected' class if this is the selected plant
            plantDiv.className = `plant-card${this.selectedPlant && this.selectedPlant.name === plant.name ? ' selected' : ''}`;

            // Create card header
            const cardHeader = document.createElement('div');
            cardHeader.className = 'card-header';
            const headerTitle = document.createElement('h3');
            headerTitle.textContent = plant.name;
            const headerSubtitle = document.createElement('p');
            headerSubtitle.textContent = `Seeded on: ${plant.seedDate}`;
            cardHeader.appendChild(headerTitle);
            cardHeader.appendChild(headerSubtitle);

            // Create phase control
            const phaseControl = document.createElement('div');
            phaseControl.className = 'phase-control';
            const phaseLabel = document.createElement('label');
            phaseLabel.setAttribute('for', `phase-${plant.name}`);
            phaseLabel.textContent = 'Phase:';
            const phaseButton = document.createElement('button');
            phaseButton.className = `phase-btn phase-btn-${plant.phase.toLowerCase().replace(' ', '-')}`;
            phaseButton.dataset.name = plant.name;
            phaseButton.textContent = plant.phase;

            // Create phase menu
            const phaseMenu = document.createElement('div');
            phaseMenu.className = 'phase-menu';
            phaseMenu.id = `phase-menu-${plant.name}`;
            phaseMenu.style.display = 'none';

            const phases = ['Seedling', 'Vegetative', 'Flowering', 'Drying', 'Curing', 'Mutter'];
            phases.forEach(phase => {
                const option = document.createElement('button');
                option.className = `phase-option phase-${phase.toLowerCase().replace(' ', '-')}`;
                option.dataset.phase = phase;
                option.dataset.name = plant.name;
                option.textContent = phase;
                phaseMenu.appendChild(option);
            });

            phaseControl.appendChild(phaseLabel);
            phaseControl.appendChild(phaseButton);
            phaseControl.appendChild(phaseMenu);

            // Create action buttons
            const cardActions = document.createElement('div');
            cardActions.className = 'card-actions';

            const addEventBtn = document.createElement('button');
            addEventBtn.className = 'add-event-btn';
            addEventBtn.dataset.name = plant.name;
            addEventBtn.title = this.selectedPlant && this.selectedPlant.name === plant.name ? 'Add event to this plant' : 'Select this plant by clicking its card (➡️)';
            addEventBtn.innerHTML = '<span>📅</span> Add Event';

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'delete-btn';
            deleteBtn.dataset.name = plant.name;
            deleteBtn.innerHTML = '<span>🗑️</span> Delete';

            const archiveBtn = document.createElement('button');
            archiveBtn.className = 'archive-btn';
            archiveBtn.dataset.name = plant.name;
            archiveBtn.innerHTML = '<span>✏️</span> Archive';

            cardActions.appendChild(addEventBtn);
            cardActions.appendChild(deleteBtn);
            cardActions.appendChild(archiveBtn);

            // Create events dropdown
            const eventsDropdown = document.createElement('div');
            eventsDropdown.className = 'events-dropdown';

            const toggleEventsBtn = document.createElement('button');
            toggleEventsBtn.className = 'toggle-events-btn';
            toggleEventsBtn.dataset.name = plant.name;
            toggleEventsBtn.innerHTML = '<span>📋</span> View Events ▼';

            const eventsList = document.createElement('div');
            eventsList.className = 'events-list';
            eventsList.id = `events-${plant.name}`;
            eventsList.style.display = 'none';
            eventsList.innerHTML = this.renderEvents(plant.events, plant.name);

            eventsDropdown.appendChild(toggleEventsBtn);
            eventsDropdown.appendChild(eventsList);

            // Append all elements to the card
            plantDiv.appendChild(cardHeader);
            plantDiv.appendChild(phaseControl);
            plantDiv.appendChild(cardActions);
            plantDiv.appendChild(eventsDropdown);
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

            // Re-render the plants to update all UI elements
            this.renderPlants();
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
        // Export both plants and archivedPlants data
        const plantsData = localStorage.getItem('plants') || '[]';
        const archivedPlantsData = localStorage.getItem('archivedPlants') || '[]';

        const exportData = {
            plants: JSON.parse(plantsData),
            archivedPlants: JSON.parse(archivedPlantsData)
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'plant_data.json';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        alert('Plant data exported successfully!');
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
            // Eingabe wird jetzt per Eingabemaske abgewickelt

            // Validate and parse the date
            const newDateStr = prompt('Enter new date (YYYY-MM-DD):', this.formatDateForInput(currentEvent.date));
            if (newDateStr) {
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

    setupEventListeners() {
        // Remove existing event listeners if they exist to prevent duplicates
        document.removeEventListener('click', this.handleDocumentClick);

        // Set up event delegation for the entire document
        document.addEventListener('click', this.handleDocumentClick);

        // Set up form-based plant addition
        const addPlantBtn = document.getElementById('addPlantFinalBtn');
        if (addPlantBtn) {
            addPlantBtn.addEventListener('click', () => {
                const nameInput = document.getElementById('plantNameInput');
                const dateInput = document.getElementById('plantSeedDateInput');

                const name = nameInput.value.trim();
                const seedDate = dateInput.value;

                if (!name || !seedDate) {
                    alert('Please enter both plant name and seed date.');
                    return;
                }

                this.addPlant(name, seedDate);

                // Clear the form
                nameInput.value = '';
                dateInput.value = '';
            });
        }

        // Set up export button event listener
        const exportBtn = document.getElementById('export-data-btn');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                this.exportData();
            });
        }

        // Set up archive toggle
        const archiveToggle = document.querySelector('#archive-list h2');
        if (archiveToggle) {
            // Remove existing event listeners first by replacing the element
            const newArchiveToggle = archiveToggle.cloneNode(true);
            archiveToggle.parentNode.replaceChild(newArchiveToggle, archiveToggle);

            // Add click event listener to the new element
            newArchiveToggle.addEventListener('click', () => {
                const archivedPlantsDiv = document.getElementById('archived-plants');
                if (archivedPlantsDiv.style.display === 'none') {
                    archivedPlantsDiv.style.display = 'block';
                } else {
                    archivedPlantsDiv.style.display = 'none';
                }
            });
        }
    }

    handleDocumentClick(e) {
        // Plant card click - select/deselect plant (only if not clicking on a button or link)
        if (e.target.closest('.plant-card') && !e.target.closest('button, a')) {
            const plantName = e.target.closest('.plant-card').querySelector('h3').textContent.trim();

            // If clicking on the same selected plant, deselect it
            if (this.selectedPlant && this.selectedPlant.name === plantName) {
                this.selectedPlant = null;
            } else {
                this.selectedPlant = { name: plantName };
            }

            // Update UI to reflect selection changes
            this.renderPlants();
            e.stopPropagation();
            return;
        }

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

        // Phase button click - toggle menu
        if (e.target.classList.contains('phase-btn')) {
            const plantName = e.target.dataset.name;
            const phaseMenu = document.getElementById(`phase-menu-${plantName}`);

            // Close all other phase menus first
            document.querySelectorAll('.phase-menu').forEach(menu => {
                if (menu.id !== `phase-menu-${plantName}`) {
                    menu.style.display = 'none';
                }
            });

            // Toggle this menu
            if (phaseMenu) {
                const isVisible = phaseMenu.style.display === 'block';
                phaseMenu.style.display = isVisible ? 'none' : 'block';

                // Prevent menu from being cut off by card boundaries or viewport
                if (!isVisible) {
                    setTimeout(() => {
                        // Check if menu would be cut off and adjust position if needed
                        const rect = phaseMenu.getBoundingClientRect();
                        const cardRect = e.target.closest('.plant-card').getBoundingClientRect();

                        if (rect.bottom > window.innerHeight || rect.top < 0) {
                            // Move menu up if it goes beyond viewport boundaries
                            phaseMenu.style.bottom = 'auto';
                            phaseMenu.style.top = `${Math.max(0, -rect.top + 10)}px`;
                        } else if (rect.bottom > cardRect.bottom) {
                            // Move menu up if it goes beyond card boundaries
                            phaseMenu.style.bottom = 'auto';
                            phaseMenu.style.top = `${Math.max(0, rect.bottom - cardRect.bottom + 5)}px`;
                        }
                    }, 10);
                } else {
                    // Reset position when closing
                    phaseMenu.style.top = 'auto';
                    phaseMenu.style.bottom = '100%';
                }
            }

            e.stopPropagation();
        }

        // Phase option click - update plant phase
        if (e.target.classList.contains('phase-option')) {
            const plantName = e.target.dataset.name;
            const newPhase = e.target.dataset.phase;

            this.updatePlantPhase(plantName, newPhase);

            // Update the button text and class
            const phaseBtn = document.querySelector(`button.phase-btn[data-name="${plantName}"]`);
            if (phaseBtn) {
                phaseBtn.textContent = newPhase;
                phaseBtn.className = `phase-btn phase-btn-${newPhase.toLowerCase().replace(' ', '-')}`;

                // Close the menu after selection
                const phaseMenu = document.getElementById(`phase-menu-${plantName}`);
                if (phaseMenu) {
                    phaseMenu.style.display = 'none';
                }
            }

            e.stopPropagation();
        }

        // Close phase menus when clicking outside
        if (!e.target.closest('.phase-control')) {
            document.querySelectorAll('.phase-menu').forEach(menu => {
                menu.style.display = 'none';
            });
        }
    }
}

// 🌿 LocalStorage: Speichern und Laden der Pflanzendaten
function saveToLocalStorage(data) {
    localStorage.setItem("plantTrackRData", JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem("plantTrackRData");
    return data ? JSON.parse(data) : null;
}

// 🌱 Beispiel: Automatisches Speichern nach jedem Event (kann weiter verfeinert werden)
window.addEventListener("beforeunload", () => {
    if (window.plantManager && plantManager.plants) {
        saveToLocalStorage({ plants: plantManager.plants });
    }
});

// Beispiel: Beim Start laden
window.addEventListener("DOMContentLoaded", () => {
    const saved = loadFromLocalStorage();
    if (saved && saved.plants) {
        saved.plants.forEach(p => {
            const plant = new Plant(p.name, p.seedDate);
            if (p.events) plant.events = p.events;
            if (p.phase) plant.phase = p.phase;
            plantManager.plants.push(plant);
        });
        plantManager.renderPlants();
    }
});

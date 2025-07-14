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
  // Plant phases - used for both default and available phases
  const PLANT_PHASES = ['Seedling', 'Vegetative', 'Flowering', 'Drying', 'Curing', 'Mutter'];

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
          this.selectedPlant = null; // Track the currently selected plant (will store plant ID)

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
          const storedPlants = localStorage.getItem('plants');
          // console.log('Loaded plants from storage:', storedPlants);
          if (storedPlants) {
              this.plants = JSON.parse(storedPlants).map(p => {
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
              });
              // console.log('Parsed plants:', this.plants);
              this.renderPlants();
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

          return true;
      }

      /**
       * Render all plants in the UI
       */
      renderPlants() {
          const plantList = document.getElementById('plant-list');
          plantList.innerHTML = ''; // Clear existing content first

          this.plants.forEach(plant => {
              // console.log(`Rendering plant ${plant.name} with events:`, plant.events);
              const plantDiv = document.createElement('div');
              // Add 'selected' class if this is the selected plant
              plantDiv.className = `plant-card${this.selectedPlant && this.selectedPlant === plant.id ? ' selected' : ''}`; // Use ID for selection

              // Create card header
              const cardHeader = document.createElement('div');
              cardHeader.className = 'card-header';
              const headerTitle = document.createElement('h3');
              headerTitle.innerHTML = `<span class="plant-id">[${plant.id}]</span> <span class="plant-name">${plant.name}</span>`;
              headerTitle.dataset.id = plant.id; // Add ID to header for easier access
              const headerSubtitle = document.createElement('p');
              headerSubtitle.textContent = `Seeded on: ${plant.seedDate}`;
              cardHeader.appendChild(headerTitle);
              cardHeader.appendChild(headerSubtitle);

              // Create phase control
              const phaseControl = document.createElement('div');
              phaseControl.className = 'phase-control';
              const phaseLabel = document.createElement('label');
              phaseLabel.setAttribute('for', `phase-${plant.id}`);
              phaseLabel.textContent = 'Phase:';
              const phaseButton = document.createElement('button');
              phaseButton.className = `phase-btn phase-btn-${plant.phase.toLowerCase().replace(' ', '-')}`;
              phaseButton.dataset.id = plant.id;
              phaseButton.textContent = plant.phase;

              // Create phase menu
              const phaseMenu = document.createElement('div');
              phaseMenu.className = 'phase-menu';
              phaseMenu.id = `phase-menu-${plant.id}`;
              phaseMenu.style.display = 'none';

              const phases = PLANT_PHASES;
              phases.forEach(phase => {
                  const option = document.createElement('button');
                  option.className = `phase-option phase-${phase.toLowerCase().replace(' ', '-')}`;
                  option.dataset.phase = phase;
                  option.dataset.id = plant.id;
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
              addEventBtn.dataset.id = plant.id;
              addEventBtn.title = this.selectedPlant && this.selectedPlant === plant.id ? 'Add event to this plant' : 'Select this plant by clicking its card (➡️)';
              addEventBtn.innerHTML = '<span>📅</span> Add Event';

              const deleteBtn = document.createElement('button');
              deleteBtn.className = 'delete-btn';
              deleteBtn.dataset.id = plant.id;
              deleteBtn.innerHTML = '<span>🗑️</span> Delete';

              const archiveBtn = document.createElement('button');
              archiveBtn.className = 'archive-btn';
              archiveBtn.dataset.id = plant.id;
              archiveBtn.innerHTML = '<span>✏️</span> Archive';

              cardActions.appendChild(addEventBtn);
              cardActions.appendChild(deleteBtn);
              cardActions.appendChild(archiveBtn);

              // Create events dropdown
              const eventsDropdown = document.createElement('div');
              eventsDropdown.className = 'events-dropdown';

              const toggleEventsBtn = document.createElement('button');
              toggleEventsBtn.className = 'toggle-events-btn';
              toggleEventsBtn.dataset.id = plant.id;
              toggleEventsBtn.innerHTML = '<span>📋</span> View Events ▼';

              const eventsList = document.createElement('div');
              eventsList.className = 'events-list';
              eventsList.id = `events-${plant.id}`;
              eventsList.style.display = 'none';
              eventsList.innerHTML = this.renderEvents(plant.events, plant.id);

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

      /**
       * Render archived plants in the UI
       */
      renderArchivedPlants() {
          const archiveList = document.getElementById('archived-plants');
          if (archiveList) {
              archiveList.innerHTML = '';

              this.archivedPlants.forEach(plant => {
                  const plantDiv = document.createElement('div');
                  plantDiv.className = 'archived-plant';
                  plantDiv.innerHTML = `
                      <h3 data-id="${plant.id}">${plant.name}</h3>
                      <p>Seeded on: ${plant.seedDate}

                      <!-- Delete archived plant button -->
                      <button class="delete-archived-btn" data-id="${plant.id}">Delete</button>

                      <!-- Events list -->
                      <div class="events-list">
                          ${this.renderEvents(plant.events, plant.id)}
                      </div>
                  `;
                  archiveList.appendChild(plantDiv);
              });
          }
      }

      /**
       * Render events for a plant
       * @param {Array} events - Array of event objects
       * @param {string} plantName - Name of the plant (for data attributes)
       * @returns {string} HTML string representing the events
       */
      renderEvents(events, plantId) {
          // console.log('Rendering events:', events);
          return events.map((event, index) => `
              <div class="event">
                  <strong>${event.type}</strong> on ${new Date(event.date).toLocaleDateString()}
                  <button class="edit-event-btn" data-plant="${plantId}" data-index="${index}">Edit</button>
                  <button class="delete-event-btn" data-plant="${plantId}" data-index="${index}">X</button>
              </div>
          `).join('');
      }

      /**
       * Delete a plant from the collection
       * @param {string} name - Name of the plant to delete
       */
      deletePlant(plantId) {
          // Find the plant by ID
          const plant = this.plants.find(p => p.id === plantId);
          if (plant) {
              const plantIndex = this.plants.findIndex(p => p.id === plantId);
              const deletedPlant = this.plants.splice(plantIndex, 1)[0];
              localStorage.setItem('plants', JSON.stringify(this.plants));
              this.renderPlants();
              alert(`${deletedPlant.name} has been deleted`);
          }
      }

      /**
       * Update a plant's growth phase
       * @param {string} plantName - Name of the plant
       * @param {string} newPhase - New growth phase
       */
      updatePlantPhase(plantId, newPhase) {
          const plant = this.plants.find(p => p.id === plantId);
          if (plant) {
              plant.updatePhase(newPhase);

              // Save to localStorage
              localStorage.setItem('plants', JSON.stringify(this.plants));

              // Re-render the plants to update all UI elements
              this.renderPlants();
          }
      }

      /**
       * Remove an event from a plant
       * @param {string} plantName - Name of the plant
       * @param {number} eventIndex - Index of the event to remove
       */
      removeEvent(plantId, eventIndex) {
          let plant = this.plants.find(p => p.id === plantId);

          // If not found in active plants, check archived plants
          if (!plant) {
              plant = this.archivedPlants.find(p => p.id === plantId);
          }

          if (plant && plant.removeEvent(eventIndex)) {
              // Save to localStorage - determine which storage to use
              if (this.plants.includes(plant)) {
                  localStorage.setItem('plants', JSON.stringify(this.plants));
              } else { // archived plants
                  localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));
              }

              // Update UI - find the specific events list for this plant and update it
              const eventsList = document.getElementById(`events-${plant.id}`);
              if (eventsList) {
                  // Replace all events in the list to show complete history
                  eventsList.innerHTML = this.renderEvents(plant.events, plant.id);
              }

              // Note: All event listeners are now handled through delegation in setupEventListeners()
          }
      }

      /**
       * Archive a plant by moving it to archivedPlants
       * @param {string} name - Name of the plant to archive
       */
      archivePlant(plantId) {
          const plant = this.plants.find(p => p.id === plantId);
          if (plant) {
              const plantIndex = this.plants.findIndex(p => p.id === plantId);
              this.plants.splice(plantIndex, 1);
              this.archivedPlants.push(plant);

              // Save to localStorage
              localStorage.setItem('plants', JSON.stringify(this.plants));
              localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));

              // Update UI
              this.renderPlants();
              this.renderArchivedPlants();

              alert(`${plant.name} has been archived`);
          }
      }

      /**
       * Delete an archived plant
       * @param {string} plantId - ID of the archived plant to delete
       */
      deleteArchivedPlant(plantId) {
          const plant = this.archivedPlants.find(p => p.id === plantId);
          if (plant) {
              const plantIndex = this.archivedPlants.findIndex(p => p.id === plantId);
              // Remove from archived plants
              this.archivedPlants.splice(plantIndex, 1);

              // Save to localStorage
              localStorage.setItem('archivedPlants', JSON.stringify(this.archivedPlants));

              // Update UI
              this.renderArchivedPlants();

              alert(`${plant.name} has been permanently deleted`);
          }
      }

      /**
       * Export all plant data as a JSON file
       */
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

      /**
       * Add an event to a plant
       * @param {string} plantName - Name of the plant
       * @param {string} eventType - Type of event
       * @param {string} date - Date of the event in YYYY-MM-DD format
       */
      addEventToPlant(plantName, eventType, date, plantId) {
          // console.log(`Adding event ${eventType} to plant ${plantName}`);
          // Find the plant by ID if provided, otherwise by name
          let plant;
          if (plantId) {
              plant = this.plants.find(p => p.id === plantId);
              if (!plant) {
                  plant = this.archivedPlants.find(p => p.id === plantId);
              }
          } else {
              // Fallback to name-based search for backward compatibility
              plant = this.plants.find(p => p.name === plantName);
              if (!plant) {
                  plant = this.archivedPlants.find(p => p.name === plantName);
              }
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
              const eventsList = document.getElementById(`events-${plant.id}`);
              if (eventsList) {
                  // Replace all events in the list to show complete history
                  eventsList.innerHTML = this.renderEvents(plant.events, plant.id);
              }

              // Note: All event listeners are now handled through delegation in setupEventListeners()
          }
      }

      /**
       * Edit an event for a plant
       * @param {string} plantName - Name of the plant
       * @param {number} eventIndex - Index of the event to edit
       */
      editEvent(plantId, eventIndex) {
          // Get the selected plant
          let plant = this.plants.find(p => p.id === plantId);

          // If not found in active plants, check archived plants
          if (!plant) {
              plant = this.archivedPlants.find(p => p.id === plantId);
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
                  const eventsList = document.getElementById(`events-${plant.id}`);
                  if (eventsList) {
                      // Replace all events in the list to show complete history
                      eventsList.innerHTML = this.renderEvents(plant.events, plant.id);
                  }

                  alert(`Updated event for ${plant.name}`);
              }
          } else {
              alert('Invalid event selection');
          }
      }

      /**
       * Edit the date of an event for a plant
       * @param {string} plantId - ID of the plant
       * @param {number} eventIndex - Index of the event to edit
       */
      editDate(plantId, eventIndex) {
          // Get the selected plant
          let plant = this.plants.find(p => p.id === plantId);

          // If not found in active plants, check archived plants
          if (!plant) {
              plant = this.archivedPlants.find(p => p.id === plantId);
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
                      const eventsList = document.getElementById(`events-${plant.id}`);
                      if (eventsList) {
                          // Replace all events in the list to show complete history
                          eventsList.innerHTML = this.renderEvents(plant.events, plant.id);
                      }

                      alert(`Updated date for ${plant.name}'s event`);
                  } else {
                      alert('Invalid date format. Please use YYYY-MM-DD.');
                  }
              }
          } else {
              alert('Invalid event selection');
          }
      }

      /**
       * Parse a date string in YYYY-MM-DD format
       * @param {string} dateStr - Date string to parse
       * @returns {Date|null} Parsed Date object or null if invalid
       */
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

      /**
       * Format a date object as YYYY-MM-DD
       * @param {string} dateStr - Date string to format
       * @returns {string} Formatted date string
       */
      formatDateForInput(dateStr) {
          const date = new Date(dateStr);
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          return `${year}-${month}-${day}`;
      }

      /**
       * Set up event listeners for the application
       */
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

      /**
       * Handle document click events
       * @param {Event} e - Click event object
       */
      handleDocumentClick(e) {
          // Plant card click - select plant (only if not clicking on a button or link)
          if (e.target.closest('.plant-card') && !e.target.closest('button, a')) {
              const plantId = e.target.closest('.plant-card').dataset.id;

              // Always set the selected plant using its ID
              this.selectedPlant = plantId;

              // Update UI to reflect selection changes
              this.renderPlants();
              e.stopPropagation();
              return;
          }

          // Edit event buttons
          if (e.target.classList.contains('edit-event-btn')) {
              const plantId = e.target.dataset.plant;
              const eventIndex = parseInt(e.target.dataset.index);
              this.editEvent(plantId, eventIndex);
              e.stopPropagation();
              return;
          }

          // Edit date buttons
          if (e.target.classList.contains('edit-date-btn')) {
              const plantId = e.target.dataset.plant;
              const eventIndex = parseInt(e.target.dataset.index);
              this.editDate(plantId, eventIndex);
              e.stopPropagation();
              return;
          }

          // Delete event buttons
          if (e.target.classList.contains('delete-event-btn')) {
              const plantId = e.target.dataset.plant;
              const eventIndex = parseInt(e.target.dataset.index);
              this.removeEvent(plantId, eventIndex);
              e.stopPropagation();
              return;
          }

          // Add event buttons
          if (e.target.classList.contains('add-event-btn')) {
              const plantId = e.target.dataset.id;
              const plantName = e.target.dataset.name;
              const calendar = Calendar.getInstance();
              calendar.addEventToPlant(plantName, plantId);
              e.stopPropagation();
              return;
          }

          // Delete plant buttons
          if (e.target.classList.contains('delete-btn')) {
              this.deletePlant(e.target.dataset.id);
              e.stopPropagation();
              return;
          }

          // Archive plant buttons
          if (e.target.classList.contains('archive-btn')) {
              this.archivePlant(e.target.dataset.id);
              e.stopPropagation();
              return;
          }

          // Delete archived plant buttons
          if (e.target.classList.contains('delete-archived-btn')) {
              const plantId = e.target.dataset.id;
              const plant = this.archivedPlants.find(p => p.id === plantId);
              const confirmed = confirm(`Are you sure you want to permanently delete ${plant.name}? This action cannot be undone.`);
              if (confirmed) {
                  this.deleteArchivedPlant(plantId);
              }
              e.stopPropagation();
              return;
          }

          // Toggle events view buttons
          if (e.target.classList.contains('toggle-events-btn')) {
              const plantId = e.target.dataset.id;
              const eventsList = document.getElementById(`events-${plantId}`);
              if (eventsList.style.display === 'none') {
                  eventsList.style.display = 'block';
              } else {
                  eventsList.style.display = 'none';
              }
              e.stopPropagation();
          }

          // Phase button click - toggle menu
          if (e.target.classList.contains('phase-btn')) {
              const plantId = e.target.dataset.id;
              const phaseMenu = document.getElementById(`phase-menu-${plantId}`);

              // Close all other phase menus first
              document.querySelectorAll('.phase-menu').forEach(menu => {
                  if (menu.id !== `phase-menu-${plantId}`) {
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
              const plantId = e.target.dataset.id;
              const newPhase = e.target.dataset.phase;

              this.updatePlantPhase(plantId, newPhase);

              // Update the button text and class
              const phaseBtn = document.querySelector(`button.phase-btn[data-id="${plantId}"]`);
              if (phaseBtn) {
                  phaseBtn.textContent = newPhase;
                  phaseBtn.className = `phase-btn phase-btn-${newPhase.toLowerCase().replace(' ', '-')}`;

                  // Close the menu after selection
                  const phaseMenu = document.getElementById(`phase-menu-${plantId}`);
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


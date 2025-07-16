/**
 * QuickCard Component - Handles Quick Card functionality
 *
 * This file contains the QuickCard class which manages:
 * - Quick Card creation and storage
 * - Drag-and-drop functionality
 * - Integration with plant events
 *
 * Features:
 * - Singleton pattern implementation for QuickCardManager
 * - LocalStorage persistence
 * - Drag-and-drop event handling
 * - Plant event logging
 *
 * Classes:
 * - QuickCard: Represents individual Quick Cards
 * - QuickCardManager: Manages all Quick Cards and their functionality
 */

/**
 * Class representing a Quick Card
 * @class
 * @param {string} label - The label for the Quick Card
 * @param {string} inputDetails - The input details for the Quick Card
 * @param {string} [icon='📝'] - Optional icon for the Quick Card
 * @description Represents a Quick Card with label, details, icon, and pinned state
 * @property {string} id - Unique identifier for the Quick Card
 * @property {string} label - The label for the Quick Card
 * @property {string} inputDetails - The input details for the Quick Card
 * @property {string} icon - The icon for the Quick Card
 * @property {boolean} pinned - Indicates if the Quick Card is pinned
 */
class QuickCard {
    constructor(label, inputDetails, icon = '📝') {
        this.id = generateUUID();
        this.label = label;
        this.inputDetails = inputDetails;
        this.icon = icon;
        this.pinned = false;
    }

    /**
     * Convert QuickCard to JSON
     * @returns {Object} JSON representation of the QuickCard
     */
    toJSON() {
        return {
            id: this.id,
            label: this.label,
            inputDetails: this.inputDetails,
            icon: this.icon,
            pinned: this.pinned
        };
    }

    /**
     * Create QuickCard from JSON
     * @param {Object} json - JSON object representing a QuickCard
     * @returns {QuickCard} The created QuickCard instance
     */
    static fromJSON(json) {
        return new QuickCard(json.label, json.inputDetails, json.icon);
    }
}

/**
 * QuickCardManager Class - Manages all QuickCards
 *
 * This file contains the QuickCardManager class which manages:
 * - QuickCard creation and storage
 * - QuickCard rendering and UI management
 * - Drag-and-drop functionality
 * - Integration with plant management system
 *
 * Features:
 * - Singleton pattern implementation
 * - LocalStorage persistence
 * - Drag-and-drop event handling
 * - Plant event logging
 *
 * @class
 * @singleton
 * @property {Array} quickCards - Array of Quick Cards
 * @property {Object|null} selectedQuickCard - Currently selected Quick Card
 */
class QuickCardManager {
    constructor() {
        if (QuickCardManager.instance) {
            return QuickCardManager.instance;
        }

        this.quickCards = [];
        this.selectedQuickCard = null;

        // Initialize storage and load data only once
        this.initStorage();
        this.loadQuickCards();

        // Set the instance
        QuickCardManager.instance = this;
        window.QuickCardManager = QuickCardManager; // Attach to window object
        return this;
    }

    static getInstance() {
        if (!QuickCardManager.instance) {
            QuickCardManager.instance = new QuickCardManager();
        }
        return QuickCardManager.instance;
    }

    /**
     * Initialize localStorage if needed
     * @description Initializes localStorage items if they don't exist
     * @private
     */
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('quickCards')) {
            localStorage.setItem('quickCards', JSON.stringify([]));
        }
    }

    /**
     * Load QuickCards from localStorage and render them
     * @description Loads QuickCard data from localStorage and renders the UI
     * @private
     */
    loadQuickCards() {
        try {
            const storedQuickCards = localStorage.getItem('quickCards');
            console.log('Loaded QuickCards from storage:', storedQuickCards);
            if (storedQuickCards) {
                try {
                    this.quickCards = JSON.parse(storedQuickCards).map(q => {
                        try {
                            const quickCard = new QuickCard(q.label, q.inputDetails, q.icon);
                            quickCard.id = q.id;
                            quickCard.pinned = q.pinned || false;
                            return quickCard;
                        } catch (cardError) {
                            console.error('Error creating QuickCard:', cardError);
                            return null;
                        }
                    }).filter(q => q !== null);
                    console.log('Parsed QuickCards:', this.quickCards);
                    this.renderQuickCards();
                } catch (parseError) {
                    console.error('Error parsing QuickCards from localStorage:', parseError);
                }
            } else {
                console.log('No QuickCards found in localStorage');
            }
        } catch (error) {
            console.error('Error loading QuickCards:', error);
        }
    }

    /**
     * Add a new QuickCard to the collection
     * @param {string} label - Label for the QuickCard
     * @param {string} inputDetails - Original input details
     * @param {string} [icon='📝'] - Optional icon for the QuickCard
     * @returns {boolean} True if QuickCard was added, false otherwise
     * @description Adds a new QuickCard to the collection and saves it to localStorage
     * @private
     */
    addQuickCard(label, inputDetails, icon = '📝') {
        if (!label || !inputDetails) {
            alert('Please provide both label and input details.');
            return false;
        }

        // Check if a QuickCard with the same label already exists (excluding icon)
        const existingQuickCard = this.quickCards.find(q => q.label === label);
        if (existingQuickCard) {
            return false;
        }

        const newQuickCard = new QuickCard(label, inputDetails, icon);
        this.quickCards.push(newQuickCard);

        // Save to localStorage
        localStorage.setItem('quickCards', JSON.stringify(this.quickCards));

        // Update UI
        this.renderQuickCards();

        return true;
    }

    /**
     * Render all QuickCards in the UI
     * @description Renders all QuickCards in the UI with drag-and-drop functionality
     * @private
     */
    renderQuickCards() {
        console.log('renderQuickCards called');
        const quickCardList = document.getElementById('quick-card-list');
        if (!quickCardList) {
            console.log('quick-card-list element not found');
            return;
        }

        // Clear existing QuickCards
        quickCardList.innerHTML = '';

        // Sort QuickCards: pinned first, then by label
        const sortedQuickCards = [...this.quickCards];
        sortedQuickCards.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return a.label.localeCompare(b.label);
        });

        // Render each QuickCard
        sortedQuickCards.forEach((quickCard, index) => {
            console.log(`Rendering QuickCard ${index}: ${quickCard.label}`);
            const quickCardElement = document.createElement('div');
            quickCardElement.className = 'quick-card';
            quickCardElement.dataset.index = index;
            quickCardElement.dataset.quickCardId = quickCard.id;
            quickCardElement.draggable = true;

            // Add drag start event listener
            quickCardElement.addEventListener('dragstart', (e) => {
                console.log(`Drag started on QuickCard: ${quickCard.id} - ${quickCard.label}`);
                try {
                    e.dataTransfer.setData('text/plain', quickCard.id);
                    e.dataTransfer.setData('application/json', JSON.stringify(quickCard));
                    console.log(`Set drag data for QuickCard ${quickCard.id}:`, {
                        id: quickCard.id,
                        label: quickCard.label,
                        data: JSON.stringify(quickCard)
                    });
                    console.log('DataTransfer contents:', {
                        'text/plain': e.dataTransfer.getData('text/plain'),
                        'application/json': e.dataTransfer.getData('application/json')
                    });
                } catch (error) {
                    console.error(`Error setting drag data for QuickCard ${quickCard.id}:`, error);
                }
                quickCardElement.classList.add('dragging');
            });

            // Add drag end event listener
            quickCardElement.addEventListener('dragend', (e) => {
                console.log(`Drag ended on QuickCard: ${quickCard.id} - ${quickCard.label}`);
                quickCardElement.classList.remove('dragging');
            });

            // QuickCard content
            quickCardElement.innerHTML = `
                <div class="quick-card-header">
                    <span class="quick-card-icon">${quickCard.icon}</span>
                    <span class="quick-card-label">${quickCard.label}</span>
                </div>
                <div class="quick-card-actions">
                    ${quickCard.pinned ? '<button class="unpin-btn">📌</button>' : '<button class="pin-btn">📌</button>'}
                    <button class="delete-btn">❌</button>
                </div>
            `;

            // Pin button functionality
            const pinBtn = quickCardElement.querySelector('.pin-btn');
            const unpinBtn = quickCardElement.querySelector('.unpin-btn');
            if (pinBtn) {
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    quickCard.pinned = true;
                    this.saveQuickCards();
                    this.renderQuickCards();
                });
            }
            if (unpinBtn) {
                unpinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    quickCard.pinned = false;
                    this.saveQuickCards();
                    this.renderQuickCards();
                });
            }

            // Delete button functionality
            const deleteBtn = quickCardElement.querySelector('.delete-btn');
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to delete this QuickCard?')) {
                    // Find the card by ID instead of using index
                    this.quickCards = this.quickCards.filter(card => card.id !== quickCard.id);
                    this.saveQuickCards();
                    this.renderQuickCards();
                }
            });

            quickCardList.appendChild(quickCardElement);
        });

        // Setup event listeners for drop zones (plant cards) after rendering
        // This ensures that event listeners are attached to dynamically created plant cards
        this.setupEventListeners();
    }

    /**
     * Save QuickCards to localStorage
     */
    saveQuickCards() {
        localStorage.setItem('quickCards', JSON.stringify(this.quickCards));
    }

    /**
     * Log QuickCard event to plant
     * @param {string} plantId - The ID of the plant
     * @param {Object} quickCardData - The QuickCard data
     * @description Logs a QuickCard event to the specified plant
     * @private
     */
    logQuickCardToPlant(plantId, quickCardData) {
        console.log(`logQuickCardToPlant called for plantId: ${plantId}, quickCardData:`, quickCardData);
        console.log('PlantManager instance:', window.plantManager);
        console.log('PlantManager plants:', window.plantManager ? window.plantManager.plants : 'PlantManager not available');

        // Get the plant from PlantManager instance
        const plantManager = window.plantManager;
        const plant = plantManager.plants.find(p => p.id === plantId);

        if (plant) {
            console.log(`Found plant ${plantId}: ${plant.name}`);

            // Check if the event already exists to prevent duplicates
            const today = new Date();
            const eventDate = today.toISOString().split('T')[0]; // YYYY-MM-DD format
            const existingEvent = plant.events.find(event =>
                event.type === quickCardData.label && event.date === eventDate
            );

            if (!existingEvent) {
                // Add the event using the Plant class's addEvent method
                plant.addEvent(quickCardData.label, eventDate);

                console.log(`Added event to plant ${plantId}: ${quickCardData.label}`);

                // Save updated plant data to localStorage
                localStorage.setItem('plants', JSON.stringify(plantManager.plants));

                // Update UI using PlantManager's renderPlants method to preserve UI state
                plantManager.renderPlants();
            } else {
                console.log(`Event already exists for plant ${plantId}: ${quickCardData.label} on ${eventDate}`);
            }
        } else {
            console.error(`Plant with ID ${plantId} not found`);
            console.error('Available plant IDs:', plantManager.plants.map(p => p.id));
        }
    }

    /**
     * Show the add quick card modal
     */
    showAddQuickCardModal() {
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            modal.style.display = 'block';
        } else {
            console.error('Add QuickCard modal not found');
        }
    }

    /**
     * Hide the add quick card modal
     */
    hideAddQuickCardModal() {
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            modal.style.display = 'none';
        } else {
            console.error('Add QuickCard modal not found');
        }
    }

    /**
     * Setup event listeners for the modal
     */
    setupModalEventListeners() {
        const addQuickCardForm = document.getElementById('add-quick-card-form');
        if (addQuickCardForm) {
            addQuickCardForm.addEventListener('submit', (e) => {
                e.preventDefault();
                const label = document.getElementById('quick-card-label').value;
                const inputDetails = document.getElementById('quick-card-details').value;
                const icon = document.getElementById('quick-card-icon').value || '📝';

                if (this.addQuickCard(label, inputDetails, icon)) {
                    this.hideAddQuickCardModal();
                    // Refresh the page after successfully adding a quick card
                    window.location.reload();
                }
            });
        }
    
        // Close modal when clicking outside
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideAddQuickCardModal();
                }
            });
        }
    }

    /**
     * Setup event listeners for the main functionality
     */
    setupEventListeners() {
        // Add QuickCard button
        const addQuickCardBtn = document.getElementById('add-quick-card-btn');
        if (addQuickCardBtn) {
            addQuickCardBtn.addEventListener('click', (e) => {
                e.stopPropagation(); // Prevent event from bubbling up to avoid sidebar collapse
                this.showAddQuickCardModal();
            });
        }

        // Drag and drop functionality
        const dropZones = document.querySelectorAll('.drop-zone');
        console.log('Setting up drop zones:', dropZones);
        dropZones.forEach(zone => {
            console.log('Setting up drop zone:', zone, 'with plantId:', zone.dataset.plantId);

            // Always attach event listeners to ensure they're present on dynamically created elements
            // Use function references for event handlers to ensure they're only attached once
            const handleDragOver = (e) => {
                console.log('Drag over drop zone');
                e.preventDefault();
                zone.classList.add('dragover');
            };

            const handleDragLeave = () => {
                console.log('Drag leave drop zone');
                zone.classList.remove('dragover');
            };

            const handleDrop = (e) => {
                console.log('Drop event on zone');
                e.preventDefault();
                zone.classList.remove('dragover');

                const quickCardId = e.dataTransfer.getData('text/plain');
                const quickCardData = JSON.parse(e.dataTransfer.getData('application/json'));

                console.log('Drop event data - quickCardId:', quickCardId);
                console.log('Drop event data - quickCardData:', quickCardData);
                console.log('Drop zone plantId:', zone.dataset.plantId);

                if (quickCardId && quickCardData) {
                    console.log(`Dropped QuickCard ${quickCardId} on zone: ${zone.id}`);
                    // Handle the drop action (e.g., log to plant)
                    this.logQuickCardToPlant(zone.dataset.plantId, quickCardData);
                } else {
                    console.error('Invalid QuickCard data in drop event');
                }
            };

            // Add event listeners
            zone.addEventListener('dragover', handleDragOver);
            zone.addEventListener('dragleave', handleDragLeave);
            zone.addEventListener('drop', handleDrop);
        });
    }
}

// Initialize the QuickCardManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quickCardManager = QuickCardManager.getInstance();
    quickCardManager.setupEventListeners();
    quickCardManager.setupModalEventListeners();
});
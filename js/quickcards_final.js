/**
 * QuickCard Component - Handles Quick Card functionality
 *
 * This file contains the QuickCard class which manages:
 * - Quick Card creation and storage
 * - Drag-and-drop functionality
 * - Integration with plant events
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
     */
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('quickCards')) {
            localStorage.setItem('quickCards', JSON.stringify([]));
        }
    }

    /**
     * Load QuickCards from localStorage and render them
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
     * @param {string} [icon] - Optional icon for the QuickCard
     * @returns {boolean} True if QuickCard was added, false otherwise
     */
    addQuickCard(label, inputDetails, icon = '📝') {
        if (!label || !inputDetails) {
            alert('Please provide both label and input details.');
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
                        label: quickCard.label
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

            // Add drag end event listener
            quickCardElement.addEventListener('dragend', (e) => {
                quickCardElement.classList.remove('dragging');
            });

            // QuickCard content
            quickCardElement.innerHTML = `
                <div class="quick-card-header">
                    <span class="quick-card-icon">${quickCard.icon}</span>
                    <span class="quick-card-label">${quickCard.label}</span>
                </div>
                <div class="quick-card-actions">
                    ${quickCard.pinned ? '<button class="unpin-btn">📎</button>' : '<button class="pin-btn">📎</button>'}
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
                    this.quickCards.splice(index, 1);
                    this.saveQuickCards();
                    this.renderQuickCards();
                }
            });

            quickCardList.appendChild(quickCardElement);
        });
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
     */
    logQuickCardToPlant(plantId, quickCardData) {
        // Get the plant from localStorage or other storage
        const plants = JSON.parse(localStorage.getItem('plants') || '[]');
        const plant = plants.find(p => p.id === plantId);

        if (plant) {
            // Add the event to the plant's event history using the quick card label as the type
            plant.events.push({
                type: quickCardData.label,  // Use the actual label instead of 'quick_card'
                data: quickCardData,
                timestamp: new Date().toISOString()
            });

            // Update the plant in localStorage
            localStorage.setItem('plants', JSON.stringify(plants));

            // Update the UI to reflect the changes
            console.log(`Logged event to plant ${plantId}: ${quickCardData.label}`);
        } else {
            console.error(`Plant with ID ${plantId} not found`);
        }
    }

    /** Show the add quick card modal */
    showAddQuickCardModal() {
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            // Reset form fields
            document.getElementById('quick-card-label').value = '';
            document.getElementById('quick-card-details').value = '';
            document.getElementById('quick-card-icon').value = '📝';

            // Show modal
            modal.style.display = 'block';
        }
    }

    /** Hide the add quick card modal */
    hideAddQuickCardModal() {
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /** Setup event listeners for the modal */
    setupModalEventListeners() {
        // Close button
        const closeBtn = document.querySelector('#add-quick-card-modal .close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hideAddQuickCardModal();
            });
        }

        // Cancel button
        const cancelBtn = document.querySelector('#add-quick-card-modal .cancel-btn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => {
                this.hideAddQuickCardModal();
            });
        }

        // Form submission
        const quickCardForm = document.getElementById('quick-card-form');
        if (quickCardForm) {
            quickCardForm.addEventListener('submit', (e) => {
                e.preventDefault();

                // Get form values
                const label = document.getElementById('quick-card-label').value.trim();
                const details = document.getElementById('quick-card-details').value.trim();
                const icon = document.getElementById('quick-card-icon').value.trim() || '📝';

                // Validate required fields
                if (!label || !details) {
                    alert('Please provide both label and input details.');
                    return;
                }

                // Add the quick card
                this.addQuickCard(label, details, icon);

                // Close modal after successful creation
                this.hideAddQuickCardModal();
            });
        }
    }

    /** Setup event listeners for the QuickCardManager */
    setupEventListeners() {
        // Add Quick Card button - now shows modal instead of prompts
        const addQuickCardBtn = document.getElementById('add-quick-card-btn');
        if (addQuickCardBtn) {
            addQuickCardBtn.addEventListener('click', () => {
                this.showAddQuickCardModal();
            });
        }

        // Setup drag-and-drop functionality for plant cards
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            const plantCard = e.target.closest('.plant-card');
            if (plantCard) {
                console.log('Drag over event detected on plant card');
                plantCard.classList.add('drag-over');
            }
        });

        // Handle drop events on plant cards
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            const plantCard = e.target.closest('.plant-card');
            if (plantCard) {
                console.log('Drop event detected on plant card');
                console.log(`Target element: ${e.target.className}`);
                console.log(`Plant card dataset:`, plantCard.dataset);
                plantCard.classList.remove('drag-over');

                try {
                    // Try to get both text and JSON data from drag event
                    let quickCardId = null;
                    try {
                        quickCardId = e.dataTransfer.getData('text/plain');
                        const jsonData = e.dataTransfer.getData('application/json');
                        console.log(`Drag data received:`, {
                            quickCardId,
                            jsonData
                        });
                    } catch (error) {
                        console.error(`Error getting drag data:`, error);
                    }
                    console.log(`QuickCard ID from drag data: ${quickCardId}`);
                    if (quickCardId) {
                        // Find the QuickCard by ID
                        const quickCard = this.quickCards.find(q => q.id === quickCardId);
                        if (quickCard) {
                            // Get plant ID from the plant card's data attribute
                            const plantId = plantCard.dataset.plantId;
                            console.log(`Plant ID from plant card: ${plantId}`);
                            if (plantId) {
                                // Log the QuickCard event to the plant
                                this.logQuickCardToPlant(plantId, quickCard.toJSON());
                                console.log(`Assigned QuickCard "${quickCard.label}" to plant ${plantId}`);

                                // Update UI to reflect changes in both plants and quick cards
                                const plantManager = PlantManager.getInstance();
                                if (plantManager) {
                                    // Force a complete refresh of all plants to ensure events are updated
                                    plantManager.plants = JSON.parse(localStorage.getItem('plants') || '[]').map(p => {
                                        try {
                                            const plant = new Plant(p.name, p.seedDate, p.id);
                                            if (p.events && Array.isArray(p.events)) {
                                                plant.events = p.events;
                                            }
                                            if (p.phase) {
                                                plant.phase = p.phase;
                                            }
                                            return plant;
                                        } catch (error) {
                                            console.error('Error reloading plant:', error);
                                            return null;
                                        }
                                    }).filter(p => p !== null);

                                    // Now render the plants to update the UI
                                    plantManager.renderPlants();
                                }

                                this.renderQuickCards();
                            } else {
                                console.error('Plant ID not found on plant card');
                            }
                        } else {
                            console.error(`QuickCard with ID ${quickCardId} not found`);
                        }
                    } else {
                        console.warn('No QuickCard ID found in drag data');
                    }
                } catch (error) {
                    console.error('Error handling drop event:', error);
                }
            }
        });
    }
}

// Initialize the QuickCardManager when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const quickCardManager = QuickCardManager.getInstance();
    quickCardManager.setupEventListeners();
    quickCardManager.setupModalEventListeners();
});

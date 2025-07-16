/**
 * QuickCard Component - Handles Quick Card functionality
 *
 * This file contains the QuickCard class which manages:
 * - Quick Card creation and storage
 * - Drag-and-drop functionality
 * - Integration with plant events
 */
import { dataUtils } from './dataUtils.js';

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
     */
    initStorage() {
        // Initialize localStorage if needed
        if (!localStorage.getItem('quickCards')) {
            dataUtils.optimizedStorage.setItem('quickCards', []);
        }
    }

    /**
     * Load QuickCards from localStorage and render them
     */
    loadQuickCards() {
        try {
            const storedQuickCards = dataUtils.optimizedStorage.getItem('quickCards');
            console.log('Loaded QuickCards from storage:', storedQuickCards);
            if (storedQuickCards) {
                try {
                    this.quickCards = storedQuickCards.map(q => {
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

        // Check if a QuickCard with the same label already exists (excluding icon)
        const existingQuickCard = this.quickCards.find(q => q.label === label);
        if (existingQuickCard) {
            return false;
        }

        const newQuickCard = new QuickCard(label, inputDetails, icon);
        this.quickCards.push(newQuickCard);

        // Save to localStorage using optimized storage
        dataUtils.optimizedStorage.setItem('quickCards', this.quickCards);

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
                    ${quickCard.pinned ? '<button class="unpin-btn">📎</button>' : '<button class="pin-btn">📎</button>'}
                    <button class="delete-btn">❌</button>
                </div>
            `;

            // Pin button functionality
            const pinBtn = quickCardElement.querySelector('.pin-btn');
            const unpinBtn = quickCardElement.querySelector('.unpin-btn');
            if (pinBtn) {
                pinBtn.setAttribute('tooltip', 'Pin this QuickCard to the top');
                pinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    quickCard.pinned = true;
                    this.saveQuickCards();
                    this.renderQuickCards();
                });
            }
            if (unpinBtn) {
                unpinBtn.setAttribute('tooltip', 'Unpin this QuickCard');
                unpinBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    quickCard.pinned = false;
                    this.saveQuickCards();
                    this.renderQuickCards();
                });
            }

            // Delete button functionality
            const deleteBtn = quickCardElement.querySelector('.delete-btn');
            deleteBtn.setAttribute('tooltip', 'Delete this QuickCard');
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

        // Setup event listeners for drop zones (plant cards) after rendering
        // This ensures that event listeners are attached to dynamically created plant cards
        this.setupEventListeners();
    }

    /**
     * Setup event listeners for the modal
     */
    setupModalEventListeners() {
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
     * Hide the add quick card modal
     */
    hideAddQuickCardModal() {
        const modal = document.getElementById('add-quick-card-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    /**
     * Save QuickCards to localStorage
     */
    saveQuickCards() {
        dataUtils.optimizedStorage.setItem('quickCards', this.quickCards);
    };
        var addQuickCardForm = document.getElementById('add-quick-card-form');

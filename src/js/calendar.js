/**
 * Calendar Class - Handles rendering and interaction with the calendar
 *
 * This file contains the Calendar class which manages the calendar functionality
 * within the Plant Manager application. It handles:
 * - Rendering the calendar UI for the current month
 * - Day selection for adding events
 * - Integration with plant management system
 *
 * Features:
 * - Singleton pattern implementation
 * - Current date tracking
 * - Plant selection management
 * - Event creation for selected plants
 *
 * Methods:
 * - renderCalendar(): Renders the calendar UI
 * - selectDay(day): Handles day selection and event creation
 */

/**
 * Calendar Class - Handles rendering and interaction with the calendar
 *
 * This file contains the Calendar class which manages the calendar functionality
 * within the Plant Manager application. It handles:
 * - Rendering the calendar UI for the current month
 * - Day selection for adding events
 * - Integration with plant management system
 */
class Calendar {
    constructor() {
        if (Calendar.instance) return Calendar.instance;

        this.currentDate = new Date();
        this.selectedPlant = null; // Will store plant ID instead of name
        Calendar.instance = this;
    }

    static getInstance() {
        if (!Calendar.instance) Calendar.instance = new Calendar();
        return Calendar.instance;
    }

    /**
     * Render the calendar UI for the current month
     * @description Renders the calendar UI for the current month with navigation controls
     * @private
     */
    renderCalendar() {
        try {
            const calendarDiv = document.getElementById('calendar');
            if (!calendarDiv) {
                console.error('Calendar container not found!');
                return;
            }

            // Clear previous content but preserve the header title (h2 or h3)
            const headerElement = calendarDiv.querySelector('h2, h3');
            while (calendarDiv.firstChild && calendarDiv.firstChild !== headerElement) {
                calendarDiv.removeChild(calendarDiv.firstChild);
            }

            const month = this.currentDate.toLocaleString('default', { month: 'long' });
            const year = this.currentDate.getFullYear();

            // Create header with navigation buttons
            let header = calendarDiv.querySelector('.calendar-header');
            if (!header) {
                header = document.createElement('div');
                header.className = 'calendar-header';
                header.innerHTML = `
                    <button class="nav-btn prev-month">«</button>
                    <h3>${month} ${year}</h3>
                    <button class="nav-btn next-month">»</button>
                `;
                calendarDiv.appendChild(header);
            } else {
                // Update month/year text
                header.querySelector('h3').textContent = `${month} ${year}`;
            }

            // Set up navigation if not already set
            const prevBtn = header.querySelector('.prev-month');
            const nextBtn = header.querySelector('.next-month');

            if (!prevBtn || !nextBtn) {
                console.error('Navigation buttons not found!');
                return;
            }

            // Ensure event listeners are only added once
            if (!prevBtn.dataset.listenerAdded) {
                prevBtn.addEventListener("click", () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                    this.renderCalendar();
                });
                prevBtn.dataset.listenerAdded = 'true';
            }

            if (!nextBtn.dataset.listenerAdded) {
                nextBtn.addEventListener("click", () => {
                    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                    this.renderCalendar();
                });
                nextBtn.dataset.listenerAdded = 'true';
            }

            // Create days grid
            let daysGrid = calendarDiv.querySelector('.days-grid');
            if (!daysGrid) {
                daysGrid = document.createElement('div');
                daysGrid.className = 'days-grid';
                calendarDiv.appendChild(daysGrid);
            } else {
                // Clear existing day elements but keep the container
                while (daysGrid.firstChild) {
                    daysGrid.removeChild(daysGrid.firstChild);
                }
            }

            const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
            const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();

            // Add empty divs for days before the first day of the month
            for (let i = 0; i < firstDay; i++) {
                const empty = document.createElement('div');
                empty.className = 'day empty';
                daysGrid.appendChild(empty);
            }

            // Add day divs for each day of the month
            for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
                const isToday = date.toDateString() === new Date().toDateString();

                const dayDiv = document.createElement('div');
                dayDiv.className = 'day' + (isToday ? ' today' : '');
                dayDiv.textContent = day;
                dayDiv.title = "Click to add an event on this day.";
                dayDiv.dataset.day = day.toString();
                daysGrid.appendChild(dayDiv);
            }

        } catch (error) {
            console.error('Error rendering calendar:', error);
        }
    }

    /**
     * Handle day selection in the calendar
     * @param {number} day - Day of month to select
     * @description Handles day selection and event creation for selected plants
     * @private
     */
    selectDay(day) {
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

        // Get the PlantManager instance
        const plantManager = PlantManager.getInstance();

        // Check if multiple plants are selected
        if (plantManager.selectedPlants.size > 1) {
            const eventType = prompt('Enter event type (water, fertilizer, etc.):');
            if (eventType) {
                const eventDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                const eventCount = plantManager.addEventToSelectedPlants(eventType, eventDate);
                this.renderCalendar();
                alert(`Added ${eventType} event to ${eventCount} ${eventCount === 1 ? 'plant' : 'plants'} on ${date.toDateString()}`);
            }
        } else if (plantManager.selectedPlants.size === 1) {
            // Single plant selected - use the same method as multiple plants for consistency
            const eventType = prompt('Enter event type (water, fertilizer, etc.):');
            if (eventType) {
                const eventDate = date.toISOString().split('T')[0]; // YYYY-MM-DD format
                const eventCount = plantManager.addEventToSelectedPlants(eventType, eventDate);
                this.renderCalendar();
                alert(`Added ${eventType} event to ${eventCount} ${eventCount === 1 ? 'plant' : 'plants'} on ${date.toDateString()}`);
            }
        } else {
            // If no plant is selected, show a list of plants with their IDs
            const plantNames = plantManager.plants.map(p => `${p.id}: ${p.name}`);
            const plantSelection = prompt('Select a plant (enter ID or name):\n' + plantNames.join('\n'));

            if (plantSelection) {
                // Try to find the plant by ID first (more reliable)
                const plantById = plantManager.plants.find(p => p.id === plantSelection);
                let plant;

                // If not found by ID, try by name as fallback
                if (!plantById) {
                    plant = plantManager.plants.find(p => p.name === plantSelection);
                } else {
                    plant = plantById;
                }

                if (plant) {
                    // Set the selected plant using its ID
                    plantManager.selectedPlants.clear();
                    plantManager.selectedPlants.add(plant.id);
                    plantManager.renderPlants(); // Update UI to show selection
                    alert(`Selected plant: ${plant.name} (ID: ${plant.id}). Click a day to add an event.`);
                } else {
                    alert(`Plant "${plantSelection}" not found.`);
                }
            }
        }
    }

}
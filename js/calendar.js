/**
 * Calendar Class - Handles rendering and interaction with the calendar
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
     */
    selectDay(day) {
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

        // Get the PlantManager instance
        const plantManager = PlantManager.getInstance();

        // Find the selected plant by ID
        const selectedPlant = plantManager.plants.find(p => p.id === plantManager.selectedPlant);
        if (selectedPlant) {
            const eventType = prompt('Enter event type (water, fertilizer, etc.):');
            if (eventType) {
                plantManager.addEventToPlant(selectedPlant.name, eventType, date.toISOString(), selectedPlant.id);
                this.renderCalendar();
                alert(`Added ${eventType} event for ${selectedPlant.name} on ${date.toDateString()}`);
            }
        } else {
            // If no plant is selected, prompt for plant name and find its ID
            const plantName = prompt('Select a plant (enter name):');
            if (plantName) {
                const plant = plantManager.plants.find(p => p.name === plantName);
                if (plant) {
                    // Set the selected plant using its ID
                    plantManager.selectedPlant = plant.id;
                    plantManager.renderPlants(); // Update UI to show selection
                    alert(`Selected plant: ${plantName}. Click a day to add an event.`);
                } else {
                    alert(`Plant "${plantName}" not found.`);
                }
            }
        }
    }

    /**
     * Set the currently selected plant for adding events
     * @param {string} plantName - Name of the plant to select
     * @param {string} [plantId] - Optional plant ID to prioritize selection
     */
     addEventToPlant(plantName, plantId) {
         // Get the PlantManager instance to update UI and track selection
         const plantManager = PlantManager.getInstance();

         let plant;
         if (plantId) {
             // If plant ID is provided, prioritize finding by ID
             plant = plantManager.plants.find(p => p.id === plantId);
         } else {
             // Otherwise, find by name
             plant = plantManager.plants.find(p => p.name === plantName);
         }

         if (plant) {
             if (!plantManager.selectedPlant || plantManager.selectedPlant !== plant.id) {
                 // Update the selected plant using its ID
                 plantManager.selectedPlant = plant.id;

                 // Update the plant list UI to show the selection
                 plantManager.renderPlants();

                 alert(`Selected plant: ${plantName}. Click a day in the calendar to add an event.`);
             } else {
                 // Already selected, do nothing
                 alert(`You already have ${plantName} selected. Click a day in the calendar to add an event.`);
             }
         } else {
             alert(`Plant "${plantName}" not found.`);
         }
     }
}
class Calendar {
    constructor() {
        if (Calendar.instance) return Calendar.instance;

        this.currentDate = new Date();
        this.selectedPlant = null;
        Calendar.instance = this;
    }

    static getInstance() {
        if (!Calendar.instance) Calendar.instance = new Calendar();
        return Calendar.instance;
    }

    static getInstance() {
        if (!Calendar.instance) Calendar.instance = new Calendar();
        return Calendar.instance;
    }

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

    selectDay(day) {
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

        // Get the PlantManager instance
        const plantManager = PlantManager.getInstance();

        if (plantManager.selectedPlant) {
            const eventType = prompt('Enter event type (water, fertilizer, etc.):');
            if (eventType) {
                plantManager.addEventToPlant(plantManager.selectedPlant.name, eventType, date.toISOString());
                this.renderCalendar();
                alert(`Added ${eventType} event for ${plantManager.selectedPlant.name} on ${date.toDateString()}`);
            }
        } else {
            const plantName = prompt('Select a plant (enter name):');
            if (plantName) {
                // Set the selected plant in PlantManager
                plantManager.selectedPlant = { name: plantName };
                plantManager.renderPlants(); // Update UI to show selection
                alert(`Selected plant: ${plantName}. Click a day to add an event.`);
            }
        }
    }

    addEventToPlant(plantName) {
        // Get the PlantManager instance to update UI and track selection
        const plantManager = PlantManager.getInstance();

        if (!plantManager.selectedPlant || plantManager.selectedPlant.name !== plantName) {
            // Update the selected plant
            plantManager.selectedPlant = { name: plantName };

            // Update the plant list UI to show the selection
            plantManager.renderPlants();

            alert(`Selected plant: ${plantName}. Click a day in the calendar to add an event.`);
        } else {
            // Already selected, do nothing
            alert(`You already have ${plantName} selected. Click a day in the calendar to add an event.`);
        }
    }
}
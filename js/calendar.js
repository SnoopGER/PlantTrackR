class Calendar {
    constructor() {
        if (Calendar.instance) {
            return Calendar.instance;
        }

        this.currentDate = new Date();
        this.selectedPlant = null;
        this.calendarClickHandler = this.handleCalendarClick.bind(this);

        // Initialize the instance
        Calendar.instance = this;

        return this;
    }

    static getInstance() {
        if (!Calendar.instance) {
            Calendar.instance = new Calendar();
        }
        return Calendar.instance;
    }

    renderCalendar() {
        const calendarDiv = document.getElementById('calendar');
        calendarDiv.innerHTML = '';

        // Create a simple month view
        const month = this.currentDate.toLocaleString('default', { month: 'long' });
        const year = this.currentDate.getFullYear();

        const header = document.createElement('div');
        header.className = 'calendar-header';
        header.innerHTML = `
            <h3>${month} ${year}</h3>
            <button id="prev-month">«</button>
            <button id="next-month">»</button>
        `;
        calendarDiv.appendChild(header);

        // Add event listeners for month navigation
        const prevMonthBtn = document.getElementById('prev-month');
        const nextMonthBtn = document.getElementById('next-month');

        // Remove existing event listeners if they exist to prevent duplicates
        prevMonthBtn.replaceWith(prevMonthBtn.cloneNode(true));
        nextMonthBtn.replaceWith(nextMonthBtn.cloneNode(true));

        prevMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.renderCalendar();
        });

        nextMonthBtn.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.renderCalendar();
        });

        // Add click event handler for calendar days
        calendarDiv.addEventListener('click', this.calendarClickHandler);

        // Create days of month
        const daysGrid = document.createElement('div');
        daysGrid.className = 'days-grid';

        // Get first and last day of month
        const firstDay = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), 1).getDay();
        const daysInMonth = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 0).getDate();

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDay; i++) {
            const emptyDiv = document.createElement('div');
            emptyDiv.className = 'day empty';
            daysGrid.appendChild(emptyDiv);
        }

        // Add days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.className = `day ${this.currentDate.getDay() === new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day).getDay() ? 'today' : ''}`;
            dayDiv.textContent = day;
            daysGrid.appendChild(dayDiv);
        }

        calendarDiv.appendChild(daysGrid);
    }

    handleCalendarClick(e) {
        if (e.target.classList.contains('day') && !e.target.classList.contains('empty')) {
            const day = parseInt(e.target.textContent);
            this.selectDay(day);
        }
    }

    selectDay(day) {
        const date = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);

        if (this.selectedPlant) {
            // Add event to selected plant
            const eventType = prompt('Enter event type (water, fertilizer, etc.):');
            if (eventType) {
                // Get the PlantManager instance and add the event
                const plantManager = PlantManager.getInstance();
                plantManager.addEventToPlant(this.selectedPlant.name, eventType, date.toISOString());

                // Update calendar display
                this.renderCalendar();

                alert(`Added ${eventType} event for ${this.selectedPlant.name} on ${date.toDateString()}`);
            }
        } else {
            // Select a plant first
            const plantName = prompt('Select a plant (enter name):');
            if (plantName) {
                this.selectedPlant = { name: plantName };
                alert(`Selected plant: ${plantName}. Click a day to add an event.`);
            }
        }
    }

    addEventToPlant(plantName) {
        console.log(`Calendar: Setting selected plant to ${plantName}`);
        this.selectedPlant = { name: plantName };
        alert(`Selected plant: ${plantName}. Click a day in the calendar to add an event.`);
    }
}
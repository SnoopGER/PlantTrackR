/**
 * Chart rendering fixes for plant cards
 */

// Wait for the DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Override the renderGrowthCharts method to fix chart rendering
    if (typeof renderGrowthCharts === 'function') {
        const originalRender = renderGrowthCharts;

        window.renderGrowthCharts = function(plant, plantId) {
            // Call the original method first
            originalRender(plant, plantId);

            // Find the charts and fix their dimensions
            const heightChart = document.getElementById(`height-chart-${plantId}`);
            const weightChart = document.getElementById(`weight-chart-${plantId}`);

            if (heightChart && weightChart) {
                // Get all canvas elements in the charts
                const heightCanvas = heightChart.querySelector('canvas');
                const weightCanvas = weightChart.querySelector('canvas');

                if (heightCanvas && weightCanvas) {
                    // Set canvas dimensions to match container
                    heightCanvas.width = heightChart.clientWidth;
                    heightCanvas.height = heightChart.clientHeight;
                    weightCanvas.width = weightChart.clientWidth;
                    weightCanvas.height = weightChart.clientHeight;

                    // Redraw the charts with proper dimensions
                    if (plant.heightData.length > 0) {
                        const ctx = heightCanvas.getContext('2d');
                        ctx.clearRect(0, 0, heightCanvas.width, heightCanvas.height);

                        // Set up chart
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, heightCanvas.width, heightCanvas.height);
                        ctx.strokeStyle = '#007bff';
                        ctx.lineWidth = 2;

                        // Draw height data
                        const maxHeight = Math.max(...plant.heightData.map(d => d.height));
                        const days = plant.heightData.map((d, i) => i);

                        // Draw x-axis
                        ctx.beginPath();
                        ctx.moveTo(10, heightCanvas.height - 10);
                        ctx.lineTo(heightCanvas.width - 10, heightCanvas.height - 10);
                        ctx.stroke();

                        // Draw y-axis
                        ctx.beginPath();
                        ctx.moveTo(10, heightCanvas.height - 10);
                        ctx.lineTo(10, 10);
                        ctx.stroke();

                        // Draw data points and line
                        ctx.beginPath();
                        ctx.moveTo(10 + days[0] * ((heightCanvas.width - 20) / days.length), heightCanvas.height - 10 - (plant.heightData[0].height / maxHeight) * (heightCanvas.height - 20));

                        for (let i = 1; i < plant.heightData.length; i++) {
                            const x = 10 + days[i] * ((heightCanvas.width - 20) / days.length);
                            const y = heightCanvas.height - 10 - (plant.heightData[i].height / maxHeight) * (heightCanvas.height - 20);
                            ctx.lineTo(x, y);
                        }

                        ctx.stroke();

                        // Add labels
                        ctx.fillStyle = '#333';
                        ctx.font = '10px Arial';
                        ctx.fillText('Height (cm)', 10, 15);
                        ctx.fillText('Days', heightCanvas.width - 30, heightCanvas.height - 5);
                    }

                    if (plant.weightData.length > 0) {
                        const ctx = weightCanvas.getContext('2d');
                        ctx.clearRect(0, 0, weightCanvas.width, weightCanvas.height);

                        // Set up chart
                        ctx.fillStyle = '#fff';
                        ctx.fillRect(0, 0, weightCanvas.width, weightCanvas.height);
                        ctx.strokeStyle = '#28a745';
                        ctx.lineWidth = 2;

                        // Draw weight data
                        const maxWeight = Math.max(...plant.weightData.map(d => d.weight));
                        const days = plant.weightData.map((d, i) => i);

                        // Draw x-axis
                        ctx.beginPath();
                        ctx.moveTo(10, weightCanvas.height - 10);
                        ctx.lineTo(weightCanvas.width - 10, weightCanvas.height - 10);
                        ctx.stroke();

                        // Draw y-axis
                        ctx.beginPath();
                        ctx.moveTo(10, weightCanvas.height - 10);
                        ctx.lineTo(10, 10);
                        ctx.stroke();

                        // Draw data points and line
                        ctx.beginPath();
                        ctx.moveTo(10 + days[0] * ((weightCanvas.width - 20) / days.length), weightCanvas.height - 10 - (plant.weightData[0].weight / maxWeight) * (weightCanvas.height - 20));

                        for (let i = 1; i < plant.weightData.length; i++) {
                            const x = 10 + days[i] * ((weightCanvas.width - 20) / days.length);
                            const y = weightCanvas.height - 10 - (plant.weightData[i].weight / maxWeight) * (weightCanvas.height - 20);
                            ctx.lineTo(x, y);
                        }

                        ctx.stroke();

                        // Add labels
                        ctx.fillStyle = '#333';
                        ctx.font = '10px Arial';
                        ctx.fillText('Weight (g)', 10, 15);
                        ctx.fillText('Days', weightCanvas.width - 30, weightCanvas.height - 5);
                    }
                }
            }
        };
    }
});
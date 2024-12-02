// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
// visualization.js

// Configuration for different charts
const railRidershipByTimePeriodChartConfig = {
  width: 720,
  height: 480
};

const monthlyRidershipByModeChartConfig = {
  width: 600,
  height: 400
};

// Function to render all visualizations
function renderVisualizations() {
  // Render ridership line chart
  railRidershipByTimePeriodChart(railRidershipByTimePeriodChartConfig);

  monthlyRidershipByModeChart(monthlyRidershipByModeChartConfig);
}

// Execute the rendering function when the document is ready
document.addEventListener("DOMContentLoaded", function() {
  renderVisualizations();
});
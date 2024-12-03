// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
// visualization.js

// Configuration for different charts
const railRidershipByTimePeriodChartConfig = {
  width: 1440,
  height: 480,
  container: ".railRidershipByTimePeriod-chart"
};

const monthlyRidershipByModeChartConfig = {
  width: 600,
  height: 400
};

// Function to render all visualizations
function renderVisualizations() {
  // Select the container element for the visualizations
  const visHolder = d3.select(".vis-holder");

  // Render ridership line chart
  visHolder.append("div").attr("class", "railRidershipByTimePeriod-chart");
  visHolder.append("div").attr("class", "monthlyRidershipByMode-chart");

  // Render ridership line chart
  railRidershipByTimePeriodChart(railRidershipByTimePeriodChartConfig);

  monthlyRidershipByModeChart(monthlyRidershipByModeChartConfig);
}

// Execute the rendering function when the document is ready
document.addEventListener("DOMContentLoaded", function () {
  renderVisualizations();
});
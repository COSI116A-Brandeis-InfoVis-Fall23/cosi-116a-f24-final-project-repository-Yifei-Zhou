// Configuration for the three charts
const railRidershipByTimePeriodChartConfig = {
  width: 1440,
  height: 480,
  container: ".railRidershipByTimePeriod-chart"
};

const monthlyRidershipByModeChartConfig = {
  width: 600,
  height: 400,
  container: ".monthlyRidershipByMode-chart"
};

const ridershipHeatmapConfig = {
  width: 800,
  height: 600,
  container: ".ridership-heatmap"
};

// Function to render all visualizations
function renderVisualizations() {
  // Select the container element for the visualizations
  const visHolder = d3.select(".vis-holder");

  // Append chart containers dynamically
  visHolder.append("div").attr("class", "railRidershipByTimePeriod-chart");
  visHolder.append("div").attr("class", "monthlyRidershipByMode-chart");
  visHolder.append("div").attr("class", "ridership-heatmap");

  // Render each visualization
  d3.csv("./data/Fall_2023_MBTA_Rail_Ridership_Data_by_SDP_Time,_Period_Route_Line,_and_Stop.csv").then(data => {
    // Prepare data for rail ridership by time period
    const timePeriodData = data.map(d => ({
      route_name: d.route_name,
      time_period_name: d.time_period_name,
      average_flow: +d.average_flow
    }));

    railRidershipByTimePeriodChart({
      ...railRidershipByTimePeriodChartConfig,
      data: timePeriodData
    });

    // Prepare data for the heatmap
    const heatmapData = data.map(d => ({
      stop_name: d.stop_name,
      time_period_name: d.time_period_name,
      average_flow: +d.average_flow
    }));

    ridershipHeatmap({
      ...ridershipHeatmapConfig,
      data: heatmapData
    });
  });

  d3.csv("./data/MBTA_Monthly_Ridership_By_Mode.csv").then(data => {
    // Prepare data for monthly ridership by mode
    const monthlyData = data.map(d => ({
      mode: d.mode,
      month: d.month,
      ridership: +d.ridership
    }));

    monthlyRidershipByModeChart({
      ...monthlyRidershipByModeChartConfig,
      data: monthlyData
    });
  });
}

// Execute the rendering function when the document is ready
document.addEventListener("DOMContentLoaded", function () {
  renderVisualizations();
});

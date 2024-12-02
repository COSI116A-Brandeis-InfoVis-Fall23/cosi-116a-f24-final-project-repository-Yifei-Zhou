// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
// visualization.js

// Load the data
// Using d3.csv with a callback function to handle the error
// and continue processing the data.
d3.csv("../data/MBTA_Monthly_Ridership_By_Mode.csv", function (data) {
  // Parse your data here
  data.forEach(function (d) {
    d.date = d3.timeParse("%Y-%m-%d")(d.date);
    d.ridership = +d.ridership;
    // Add more parsing if needed
  });

  // Call the functions to draw charts
  drawRidershipChart(data);
  drawDelayReasonsChart(data);
  drawTimePeriodChart(data);
});

// Brush over "Daily Ridership by Metro Line" chart to highlight corresponding data
function drawRidershipChart(data) {
  let margin = { top: 20, right: 30, bottom: 40, left: 50 },
    width = 800 - margin.left - margin.right,
    height = 400 - margin.top - margin.bottom;

  let svg = d3.select("#ridership-chart").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

  let x = d3.scaleTime()
    .domain(d3.extent(data, d => d.date))
    .range([0, width]);

  let y = d3.scaleLinear()
    .domain([0, d3.max(data, d => d.ridership)])
    .range([height, 0]);

  let line = d3.line()
    .x(d => x(d.date))
    .y(d => y(d.ridership));

  svg.append("g")
    .attr("class", "x-axis")
    .attr("transform", "translate(0," + height + ")")
    .call(d3.axisBottom(x));

  svg.append("g")
    .attr("class", "y-axis")
    .call(d3.axisLeft(y));

  svg.append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line);

  let brush = d3.brushX()
    .extent([[0, 0], [width, height]])
    .on("brush end", brushed);

  svg.append("g")
    .attr("class", "brush")
    .call(brush);

  function brushed({ selection }) {
    if (selection) {
      let [x0, x1] = selection.map(x.invert);
      highlightDataInLinkedCharts(x0, x1);
    }
  }
}

// Highlighting selected lines
function drawDelayReasonsChart(data) {
  let svg = d3.select("#delay-reasons-chart").append("svg")
    .attr("width", 800)
    .attr("height", 400);

  // Example implementation for highlighting lines
  d3.selectAll(".line")
    .on("click", function (event, d) {
      let selectedLine = d.line; // e.g., "Red Line"
      d3.selectAll(".line")
        .classed("highlighted", line => line === selectedLine)
        .classed("faded", line => line !== selectedLine);
    });
}

// Zooming functionality for temporal charts
function drawTimePeriodChart(data) {
  let svg = d3.select("#time-period-chart").append("svg")
    .attr("width", 800)
    .attr("height", 400);

  let x = d3.scaleTime().domain(d3.extent(data, d => d.date)).range([0, 800]);
  let zoom = d3.zoom()
    .scaleExtent([1, 10])
    .translateExtent([[0, 0], [800, 400]])
    .on("zoom", zoomed);

  function zoomed({ transform }) {
    d3.select(".x-axis").call(d3.axisBottom(x).scale(transform.rescaleX(x)));
    d3.selectAll(".line").attr("transform", transform);
  }

  svg.call(zoom);
}

// Tooltip implementation
function setupTooltip() {
  let tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

  d3.selectAll(".line")
    .on("mouseover", function (event, d) {
      tooltip.transition()
        .duration(200)
        .style("opacity", .9);
      tooltip.html(`Ridership: ${d.ridership}<br>Delay: ${d.delayDetails}`)
        .style("left", (event.pageX + 5) + "px")
        .style("top", (event.pageY - 28) + "px");
    })
    .on("mouseout", function () {
      tooltip.transition()
        .duration(500)
        .style("opacity", 0);
    });
}

// Filters for date ranges and line-specific data
d3.select("#date-filter").on("change", function () {
  let dateRange = d3.select(this).property("value");
  filterDataByDateRange(dateRange);
});

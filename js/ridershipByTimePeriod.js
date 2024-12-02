// Create a function for the Ridership By Time Period D3 line chart
function ridershipByTimePeriodChart(config) {
    const { width, height } = config;
    const margin = {top: 50, right: 150, bottom: 50, left: 50};
  
    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;
  
    d3.csv("../data/Fall_2023_MBTA_Rail_Ridership_Data_by_SDP_Time,_Period_Route_Line,_and_Stop.csv").then(function(data) {
      // Parse data to group and format it for D3 line chart
      const nestedData = d3.nest()
        .key(d => d.route_name)
        .key(d => d.time_period_name)
        .rollup(values => d3.sum(values, v => +v.average_flow))
        .entries(data);
  
      const svg = d3.select("body").append("svg")
          .attr("width", svgWidth)
          .attr("height", svgHeight)
        .append("g")
          .attr("transform", `translate(${margin.left},${margin.top})`);
  
      // Extract unique x-axis values (time_period_name categories)
      const timePeriods = [...new Set(data.map(d => d.time_period_name))];
  
      // Define scales
      const xScale = d3.scalePoint()
        .domain(timePeriods)
        .range([0, width]);
  
      const yScale = d3.scaleLinear()
        .domain([0, d3.max(nestedData, d => d3.max(d.values, t => t.value))])
        .nice()
        .range([height, 0]);
  
      // Define line generator
      const line = d3.line()
        .x(d => xScale(d.key))
        .y(d => yScale(d.value));
  
      // Add x-axis
      svg.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));
  
      // Add y-axis
      svg.append("g")
        .call(d3.axisLeft(yScale));
  
      // Add lines for each route
      const color = d3.scaleOrdinal(d3.schemeCategory10);
  
      svg.selectAll(".line")
        .data(nestedData)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .style("fill", "none")
        .style("stroke", d => color(d.key))
        .style("stroke-width", 2);
  
      // Add legend
      svg.selectAll(".legend")
        .data(nestedData)
        .enter()
        .append("text")
        .attr("class", "legend")
        .attr("x", width + 10)
        .attr("y", (d, i) => i * 20)
        .style("fill", d => color(d.key))
        .text(d => d.key);
  
    }).catch(function(error) {
      console.error("Error loading the data: ", error);
    });
  }
  
  // Example usage in visualization.js
  // var myChart = ridershipChart({ width: 720, height: 480 });
// Create a function for the D3 line chart
function railRidershipByTimePeriodChart(config) {
  const { width, height } = config;
  const margin = {top: 50, right: 150, bottom: 70, left: 70};

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
      .attr("class", "x-axis")
      .call(d3.axisBottom(xScale));

    // Add y-axis
    svg.append("g")
      .attr("class", "y-axis")
      .call(d3.axisLeft(yScale));

    // Add x-axis label
    svg.append("text")
      .attr("class", "x-axis-label")
      .attr("x", width / 2)
      .attr("y", height + margin.bottom - 10)
      .style("text-anchor", "middle")
      .text("Time Period");

    // Add y-axis label
    svg.append("text")
      .attr("class", "y-axis-label")
      .attr("x", -height / 2)
      .attr("y", -margin.left + 20)
      .attr("transform", "rotate(-90)")
      .style("text-anchor", "middle")
      .text("Average Daily Ridership");

    // Add chart title
    svg.append("text")
      .attr("class", "chart-title")
      .attr("x", width / 2)
      .attr("y", -margin.top / 2)
      .style("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .text("MBTA Rail Ridership by Route and Time Period");

    // Add lines for each route
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const lines = svg.selectAll(".line")
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

    // Add brushing
    const brush = d3.brush()
      .extent([[0, 0], [width, height]])
      .on("brush end", brushed);

    svg.append("g")
      .attr("class", "brush")
      .call(brush);

    function brushed(event) {
      if (event.selection) {
        const [[x0, y0], [x1, y1]] = event.selection;
        lines.style("stroke-opacity", d => {
          const visible = d.values.some(point => {
            const x = xScale(point.key);
            const y = yScale(point.value);
            return x >= x0 && x <= x1 && y >= y0 && y <= y1;
          });
          return visible ? 1 : 0.1;
        });
      } else {
        lines.style("stroke-opacity", 1);
      }
    }

    // Add zooming
    const zoom = d3.zoom()
      .scaleExtent([1, 10])
      .translateExtent([[0, 0], [width, height]])
      .on("zoom", zoomed);

    svg.append("rect")
      .attr("width", width)
      .attr("height", height)
      .style("fill", "none")
      .style("pointer-events", "all")
      .call(zoom);

    function zoomed(event) {
      const transform = event.transform;
      const newXScale = transform.rescaleX(xScale);
      const newYScale = transform.rescaleY(yScale);

      svg.select(".x-axis").call(d3.axisBottom(newXScale));
      svg.select(".y-axis").call(d3.axisLeft(newYScale));

      lines.attr("d", d => line.x(d => newXScale(d.key)).y(d => newYScale(d.value))(d.values));
    }

    // Add highlighting on line selection
    lines.on("mouseover", function(event, d) {
      d3.select(this)
        .style("stroke-width", 4)
        .style("stroke-opacity", 1);
    }).on("mouseout", function(event, d) {
      d3.select(this)
        .style("stroke-width", 2)
        .style("stroke-opacity", 1);
    });

  }).catch(function(error) {
    console.error("Error loading the data: ", error);
  });
}
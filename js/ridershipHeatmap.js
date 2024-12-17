function ridershipHeatmap(config) {
    const { width, height, container, data } = config;
    const margin = { top: 50, right: 150, bottom: 70, left: 150 };

    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    const containerElement = d3.select(container);
    if (containerElement.empty()) {
        console.error("Container element not found: ", container);
        return;
    }

    containerElement.selectAll("svg").remove(); // Clear previous SVG if it exists

    // Parse numerical values
    const parsedData = data.map(d => ({
        stop_name: d.stop_name,
        time_period_name: d.time_period_name,
        average_flow: +d.average_flow // Ensure average_flow is numeric
    }));

    // Filter the top 10 stops based on total average ridership
    const stopFlow = d3.rollup(
        parsedData,
        v => d3.sum(v, d => d.average_flow), // Sum average_flow for each stop
        d => d.stop_name // Group by stop_name
    );

    // Sort and select the top 10 stops
    const topStops = Array.from(stopFlow)
        .sort((a, b) => b[1] - a[1]) // Sort by total flow (descending)
        .slice(0, 10) // Keep the top 10
        .map(d => d[0]); // Extract the stop names

    // Filter the data to include only the top 10 stops
    const filteredData = parsedData.filter(d => topStops.includes(d.stop_name));

    const timePeriods = [
        "VERY_EARLY_MORNING", "EARLY_AM", "AM_PEAK", "MIDDAY_SCHOOL",
        "MIDDAY_BASE", "PM_PEAK", "EVENING", "LATE_EVENING", "NIGHT"
    ];

    // Define scales
    const xScale = d3.scaleBand().domain(timePeriods).range([0, width]).padding(0.05);
    const yScale = d3.scaleBand().domain(topStops).range([0, height]).padding(0.05);
    const colorScale = d3
        .scaleSequential(d3.interpolateBlues)
        .domain([0, d3.max(filteredData, d => d.average_flow)]);

    const svg = containerElement
        .append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw heatmap cells
    svg
        .selectAll("rect")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("x", d => xScale(d.time_period_name))
        .attr("y", d => yScale(d.stop_name))
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", d => colorScale(d.average_flow));

    // Add axes
    svg
        .append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale))
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");

    svg.append("g").call(d3.axisLeft(yScale));

    // Add color legend
    const legendWidth = 20;
    const legendHeight = 200;
    const legend = svg
        .append("g")
        .attr("transform", `translate(${width + 20}, 0)`);

    const legendScale = d3
        .scaleLinear()
        .domain([0, d3.max(filteredData, d => d.average_flow)])
        .range([legendHeight, 0]);

    const legendAxis = d3.axisRight(legendScale).ticks(5);

    legend
        .append("g")
        .call(legendAxis)
        .attr("transform", `translate(${legendWidth}, 0)`);

    const gradient = legend
        .append("defs")
        .append("linearGradient")
        .attr("id", "heatmap-gradient")
        .attr("x1", "0%")
        .attr("y1", "100%")
        .attr("x2", "0%")
        .attr("y2", "0%");

    gradient
        .append("stop")
        .attr("offset", "0%")
        .attr("stop-color", d3.interpolateBlues(0));

    gradient
        .append("stop")
        .attr("offset", "100%")
        .attr("stop-color", d3.interpolateBlues(1));

    legend
        .append("rect")
        .attr("x", 0)
        .attr("y", 0)
        .attr("width", legendWidth)
        .attr("height", legendHeight)
        .style("fill", "url(#heatmap-gradient)");
}

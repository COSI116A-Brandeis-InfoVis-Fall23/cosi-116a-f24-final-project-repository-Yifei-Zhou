function ridershipHeatmap(config) {
    // Extract configuration
    const width = config.width;
    const height = config.height;
    const container = config.container;
    const data = config.data;
    const onBrush = config.onBrush;

    // Margins around the visualization
    const margin = { top: 50, right: 150, bottom: 70, left: 150 };
    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    // Clear any existing content in the container
    const div = d3.select(container);
    div.selectAll("*").remove();

    // Create the SVG container
    const svg = div.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    // Main chart group
    const chartGroup = svg.append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // Parse data: convert numeric fields
    const parsedData = data.map(function(d) {
        return {
            stop_name: d.stop_name,
            time_period_name: d.time_period_name,
            average_flow: +d.average_flow
        };
    });

    // Compute top 10 stops by total flow across all time periods
    const stopFlow = d3.nest()
        .key(function(d) { return d.stop_name; })
        .rollup(function(v) { return d3.sum(v, function(d) { return d.average_flow; }); })
        .entries(parsedData)
        .sort(function(a, b) { return b.value - a.value; })
        .slice(0, 10)
        .map(function(d) { return d.key; });

    // Filter data to include only the top 10 stops
    const filteredData = parsedData.filter(function(d) {
        return stopFlow.includes(d.stop_name);
    });

    // Define the ordered time periods
    const timePeriods = [
        "VERY_EARLY_MORNING", "EARLY_AM", "AM_PEAK", "MIDDAY_SCHOOL",
        "MIDDAY_BASE", "PM_PEAK", "EVENING", "LATE_EVENING", "NIGHT"
    ];

    // Create scales
    const xScale = d3.scaleBand()
        .domain(timePeriods)
        .range([0, width])
        .padding(0.05);

    const yScale = d3.scaleBand()
        .domain(stopFlow)
        .range([0, height])
        .padding(0.05);

    const maxFlow = d3.max(filteredData, function(d) { return d.average_flow; });
    const colorScale = d3.scaleLinear()
        .domain([0, maxFlow])
        .range(["#e6f7ff", "#08306b"]);

    // Add cells for the heatmap
    const cells = chartGroup.selectAll(".heatmap-cell")
        .data(filteredData)
        .enter()
        .append("rect")
        .attr("class", "heatmap-cell")
        .attr("x", function(d) { return xScale(d.time_period_name); })
        .attr("y", function(d) { return yScale(d.stop_name); })
        .attr("width", xScale.bandwidth())
        .attr("height", yScale.bandwidth())
        .attr("fill", function(d) { return colorScale(d.average_flow); });

    // Add X axis
    const xAxis = d3.axisBottom(xScale);
    chartGroup.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis)
        .selectAll("text")
        .attr("transform", "rotate(45)")
        .style("text-anchor", "start");

    // Add Y axis
    const yAxis = d3.axisLeft(yScale);
    chartGroup.append("g")
        .call(yAxis);

    // Define the brushing behavior
    const brush = d3.brush()
        .extent([[0, 0], [width, height]])
        .on("start", brushStarted)
        .on("brush", brushed)
        .on("end", brushEnded);

    // Add the brush to the chart
    const brushGroup = chartGroup.append("g")
        .attr("class", "brush")
        .call(brush);

    // Brush event handlers
    function brushStarted() {
        // No action needed on start
    }

    function brushed() {
        const selection = d3.event.selection;
        if (!selection) return;

        const x0 = selection[0][0], y0 = selection[0][1];
        const x1 = selection[1][0], y1 = selection[1][1];

        // Highlight cells within the brush
        cells.attr("stroke", function(d) {
            const cellX = xScale(d.time_period_name) + xScale.bandwidth() / 2;
            const cellY = yScale(d.stop_name) + yScale.bandwidth() / 2;
            return (x0 <= cellX && cellX <= x1 && y0 <= cellY && cellY <= y1) ? "red" : "none";
        }).attr("stroke-width", function(d) {
            const cellX = xScale(d.time_period_name) + xScale.bandwidth() / 2;
            const cellY = yScale(d.stop_name) + yScale.bandwidth() / 2;
            return (x0 <= cellX && cellX <= x1 && y0 <= cellY && cellY <= y1) ? 2 : 0;
        });
    }

    function brushEnded() {
        const selection = d3.event.selection;
        if (!selection) {
            cells.attr("stroke", "none").attr("stroke-width", 0);
            if (onBrush) onBrush([]);
            return;
        }

        const x0 = selection[0][0], y0 = selection[0][1];
        const x1 = selection[1][0], y1 = selection[1][1];

        const brushedData = filteredData.filter(function(d) {
            const cellX = xScale(d.time_period_name) + xScale.bandwidth() / 2;
            const cellY = yScale(d.stop_name) + yScale.bandwidth() / 2;
            return x0 <= cellX && cellX <= x1 && y0 <= cellY && cellY <= y1;
        });

        if (onBrush) onBrush(brushedData);
    }

    // Add a title above the chart
    svg.append("text")
        .attr("class", "chart-title")
        .attr("x", svgWidth / 2)
        .attr("y", margin.top / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "18px")
        .style("font-weight", "bold")
        .text("Top 10 Stops Heatmap with Brushing & Linking");
}

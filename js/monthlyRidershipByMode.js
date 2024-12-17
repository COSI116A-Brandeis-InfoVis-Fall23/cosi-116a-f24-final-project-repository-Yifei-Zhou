// Create a function for the D3 line chart
function monthlyRidershipByModeChart(config) {
    const { width, height, container } = config;
    const margin = { top: 50, right: 150, bottom: 70, left: 70 };

    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    const containerElement = d3.select(container);
    containerElement.selectAll("svg").remove(); // Clear previous SVG if it exists

    const svg = containerElement.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight)
        .append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Keep track of the current zoom transform
    let currentTransform = d3.zoomIdentity;


    d3.csv("../data/MBTA_Monthly_Ridership_By_Mode.csv").then(function (data) {

        // Parse data
        data.forEach(d => {
            d.service_date = d3.timeParse("%Y/%m")(d.service_date);
            d.total_monthly_weekday_ridership = +d.total_monthly_weekday_ridership;
        });

        const nestedData = Array.from(d3.group(data, d => d.mode), ([key, values]) => ({
            key: key,
            values: values.sort((a, b) => d3.ascending(a.service_date, b.service_date))
        }));


        // Define scales
        const xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.service_date))
            .range([0, width]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total_monthly_weekday_ridership)])
            .nice()
            .range([height, 0]);

        // Define line generator
        const line = d3.line()
            .x(d => xScale(d.service_date))
            .y(d => yScale(d.total_monthly_weekday_ridership));

        // Draw axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        svg.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        svg.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Axis labels
        svg.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Date");

        svg.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Total Monthly Weekday Ridership");

        // Add chart title
        svg.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("MBTA Monthly Ridership by Mode");

        // Add lines for each mode
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

        // Brush
        const brush = d3.brush()
            .extent([[0, 0], [width, height]])
            .on("brush end", brushed);

        svg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            if (!event.selection) {
                lines.style("stroke-opacity", 1);
                return;
            }

            const [[x0, y0], [x1, y1]] = event.selection;
            const transformedXScale = currentTransform.rescaleX(xScale);
            const transformedYScale = currentTransform.rescaleY(yScale);

            lines.style("stroke-opacity", d => {
                const isVisible = d.values.some(point => {
                    const xVal = transformedXScale(point.service_date);
                    const yVal = transformedYScale(point.total_monthly_weekday_ridership);
                    return xVal >= x0 && xVal <= x1 && yVal >= y0 && yVal <= y1;
                });
                return isVisible ? 1 : 0.1;
            });
        }

        // Zoom
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
            // Update current transform
            currentTransform = event.transform;

            const newXScale = currentTransform.rescaleX(xScale);
            const newYScale = currentTransform.rescaleY(yScale);

            // Redraw axes with transformed scales
            svg.select(".x-axis").call(d3.axisBottom(newXScale));
            svg.select(".y-axis").call(d3.axisLeft(newYScale));

            // Redraw lines with transformed scales
            lines.attr("d", d =>
                d3.line()
                    .x(p => newXScale(p.service_date))
                    .y(p => newYScale(p.total_monthly_weekday_ridership))(d.values)
            );
        }

        // Mouseover events (optional)
        lines
            .on("mouseover", function () {
                d3.select(this)
                    .style("stroke-width", 4)
                    .style("stroke-opacity", 1);
            })
            .on("mouseout", function () {
                d3.select(this)
                    .style("stroke-width", 2)
                    .style("stroke-opacity", 1);
            });

    }).catch(function (error) {
        console.error("Error loading the data: ", error);
    });
}

// Example usage:
// monthlyRidershipByModeChart({ width: 720, height: 480, container: ".ridership-chart" });
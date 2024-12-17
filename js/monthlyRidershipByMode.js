function monthlyRidershipByModeChart(config) {
    const { width, height, container } = config;

    const margin = { top: 50, right: 150, bottom: 70, left: 70 };
    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    const containerElement = d3.select(container);
    containerElement.selectAll("svg").remove(); // clear previous SVG if any

    const svg = containerElement.append("svg")
        .attr("width", svgWidth)
        .attr("height", svgHeight);

    const mainG = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    let currentTransform = d3.zoomIdentity;
    let selectedLine = null;

    d3.csv("../data/MBTA_Monthly_Ridership_By_Mode.csv").then(data => {
        // Parse the data
        const parseTime = d3.timeParse("%Y/%m");
        data.forEach(d => {
            d.service_date = parseTime(d.service_date);
            d.total_monthly_weekday_ridership = +d.total_monthly_weekday_ridership;
        });

        let nestedData = Array.from(d3.group(data, d => d.mode), ([key, values]) => ({
            key,
            values: values.sort((a, b) => d3.ascending(a.service_date, b.service_date))
        }));

        // Define scales
        let xScale = d3.scaleTime()
            .domain(d3.extent(data, d => d.service_date))
            .range([0, width]);

        let yScale = d3.scaleLinear()
            .domain([0, d3.max(data, d => d.total_monthly_weekday_ridership)])
            .nice()
            .range([height, 0]);

        const color = d3.scaleOrdinal(d3.schemeCategory10);

        // Axes
        const xAxis = d3.axisBottom(xScale);
        const yAxis = d3.axisLeft(yScale);

        mainG.append("g")
            .attr("class", "x-axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);

        mainG.append("g")
            .attr("class", "y-axis")
            .call(yAxis);

        // Axis labels
        mainG.append("text")
            .attr("class", "x-axis-label")
            .attr("x", width / 2)
            .attr("y", height + margin.bottom - 10)
            .style("text-anchor", "middle")
            .text("Date");

        mainG.append("text")
            .attr("class", "y-axis-label")
            .attr("x", -height / 2)
            .attr("y", -margin.left + 20)
            .attr("transform", "rotate(-90)")
            .style("text-anchor", "middle")
            .text("Total Monthly Weekday Ridership");

        // Chart title
        mainG.append("text")
            .attr("class", "chart-title")
            .attr("x", width / 2)
            .attr("y", -margin.top / 2)
            .style("text-anchor", "middle")
            .style("font-size", "16px")
            .style("font-weight", "bold")
            .text("MBTA Monthly Ridership by Mode");

        // Line generator
        const lineGenerator = d3.line()
            .x(d => xScale(d.service_date))
            .y(d => yScale(d.total_monthly_weekday_ridership));

        let linesG = mainG.append("g").attr("class", "lines-group");

        let lines = linesG.selectAll(".line")
            .data(nestedData, d => d.key)
            .join("path")
            .attr("class", "line")
            .attr("d", d => lineGenerator(d.values))
            .style("fill", "none")
            .style("stroke", d => color(d.key))
            .style("stroke-width", 2)
            .style("cursor", "pointer");

        // Legend
        let legend = mainG.selectAll(".legend")
            .data(nestedData, d => d.key)
            .join("text")
            .attr("class", "legend")
            .attr("x", width + 10)
            .attr("y", (d, i) => i * 20)
            .style("fill", d => color(d.key))
            .text(d => d.key)
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                if (!selectedLine) {
                    // Highlight corresponding line
                    lines
                        .style("stroke-opacity", l => l.key === d.key ? 1 : 0.1)
                        .style("stroke-width", l => l.key === d.key ? 4 : 2);
                }
            })
            .on("mouseout", (event, d) => {
                if (!selectedLine) {
                    // Revert to normal if none selected
                    lines
                        .style("stroke-opacity", 1)
                        .style("stroke-width", 2);
                }
            })
            .on("click", (event, d) => {
                // Selecting by legend click behaves like line click
                if (selectedLine === d.key) {
                    selectedLine = null;
                    lines.style("stroke-opacity", 1).style("stroke-width", 2);
                } else {
                    selectedLine = d.key;
                    lines
                        .style("stroke-opacity", l => l.key === selectedLine ? 1 : 0.1)
                        .style("stroke-width", l => l.key === selectedLine ? 4 : 2);
                }
            });

        // Brush
        const brush = d3.brush()
            .extent([[0, 0], [width, height]])
            .on("brush end", brushed);

        mainG.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed(event) {
            if (!event.selection) {
                // Reset if no selection
                if (!selectedLine) {
                    lines.style("stroke-opacity", 1);
                } else {
                    lines
                        .style("stroke-opacity", d => d.key === selectedLine ? 1 : 0.1)
                        .style("stroke-width", d => d.key === selectedLine ? 4 : 2);
                }
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

        mainG.append("rect")
            .attr("width", width)
            .attr("height", height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .call(zoom);

        function zoomed(event) {
            currentTransform = event.transform;
            const newXScale = currentTransform.rescaleX(xScale);
            const newYScale = currentTransform.rescaleY(yScale);

            mainG.select(".x-axis").call(d3.axisBottom(newXScale));
            mainG.select(".y-axis").call(d3.axisLeft(newYScale));

            lines.attr("d", d => d3.line()
                .x(p => newXScale(p.service_date))
                .y(p => newYScale(p.total_monthly_weekday_ridership))(d.values)
            );
        }

        // Highlighting and selecting lines on mouse events
        lines
            .on("mouseover", function () {
                if (!selectedLine) {
                    d3.select(this)
                        .style("stroke-width", 4)
                        .style("stroke-opacity", 1);
                }
            })
            .on("mouseout", function (event, d) {
                if (!selectedLine || selectedLine !== d.key) {
                    d3.select(this)
                        .style("stroke-width", 2)
                        .style("stroke-opacity", 1);
                }
            })
            .on("click", function (event, d) {
                if (selectedLine === d.key) {
                    // Deselect
                    selectedLine = null;
                    lines
                        .style("stroke-opacity", 1)
                        .style("stroke-width", 2);
                } else {
                    // Select this line
                    selectedLine = d.key;
                    lines
                        .style("stroke-opacity", l => l.key === selectedLine ? 1 : 0.1)
                        .style("stroke-width", l => l.key === selectedLine ? 4 : 2);
                }
            });

        // Filtering by mode dropdown
        const uniqueModes = Array.from(new Set(data.map(d => d.mode))).sort();
        uniqueModes.unshift("All");  // Add an "All" option

        const dropdown = containerElement.insert("select", ":first-child")
            .style("margin-bottom", "10px");

        dropdown.selectAll("option")
            .data(uniqueModes)
            .enter()
            .append("option")
            .attr("value", d => d)
            .text(d => d);

        dropdown.on("change", () => {
            const selected = dropdown.node().value;
            updateChart(selected);
        });

        function updateChart(mode) {
            let filteredData;
            if (mode === "All") {
                filteredData = data;
            } else {
                filteredData = data.filter(d => d.mode === mode);
            }

            nestedData = Array.from(d3.group(filteredData, d => d.mode), ([key, values]) => ({
                key,
                values: values.sort((a, b) => d3.ascending(a.service_date, b.service_date))
            }));

            // Update scales
            xScale.domain(d3.extent(filteredData, d => d.service_date));
            yScale.domain([0, d3.max(filteredData, d => d.total_monthly_weekday_ridership)]).nice();

            // Update axes
            mainG.select(".x-axis").call(xAxis.scale(xScale));
            mainG.select(".y-axis").call(yAxis.scale(yScale));

            // Update lines
            lines = linesG.selectAll(".line")
                .data(nestedData, d => d.key);

            lines.exit().remove();

            lines.enter()
                .append("path")
                .attr("class", "line")
                .merge(lines)
                .attr("d", d => lineGenerator.x(dv => xScale(dv.service_date)).y(dv => yScale(dv.total_monthly_weekday_ridership))(d.values))
                .style("stroke", d => color(d.key))
                .style("fill", "none")
                .style("stroke-width", 2)
                .style("stroke-opacity", 1)
                .style("cursor", "pointer")
                .on("mouseover", function () {
                    if (!selectedLine) {
                        d3.select(this)
                            .style("stroke-width", 4)
                            .style("stroke-opacity", 1);
                    }
                })
                .on("mouseout", function (event, d) {
                    if (!selectedLine || selectedLine !== d.key) {
                        d3.select(this)
                            .style("stroke-width", 2)
                            .style("stroke-opacity", 1);
                    }
                })
                .on("click", function (event, d) {
                    if (selectedLine === d.key) {
                        selectedLine = null;
                        linesG.selectAll(".line")
                            .style("stroke-opacity", 1)
                            .style("stroke-width", 2);
                    } else {
                        selectedLine = d.key;
                        linesG.selectAll(".line")
                            .style("stroke-opacity", l => l.key === selectedLine ? 1 : 0.1)
                            .style("stroke-width", l => l.key === selectedLine ? 4 : 2);
                    }
                });

            lines = linesG.selectAll(".line");

            // Update legend
            legend = mainG.selectAll(".legend")
                .data(nestedData, d => d.key);

            legend.exit().remove();

            legend.enter()
                .append("text")
                .attr("class", "legend")
                .merge(legend)
                .attr("x", width + 10)
                .attr("y", (d, i) => i * 20)
                .style("fill", d => color(d.key))
                .text(d => d.key)
                .style("cursor", "pointer")
                .on("mouseover", (event, d) => {
                    if (!selectedLine) {
                        lines
                            .style("stroke-opacity", l => l.key === d.key ? 1 : 0.1)
                            .style("stroke-width", l => l.key === d.key ? 4 : 2);
                    }
                })
                .on("mouseout", (event, d) => {
                    if (!selectedLine) {
                        lines
                            .style("stroke-opacity", 1)
                            .style("stroke-width", 2);
                    }
                })
                .on("click", (event, d) => {
                    if (selectedLine === d.key) {
                        selectedLine = null;
                        lines
                            .style("stroke-opacity", 1)
                            .style("stroke-width", 2);
                    } else {
                        selectedLine = d.key;
                        lines
                            .style("stroke-opacity", l => l.key === selectedLine ? 1 : 0.1)
                            .style("stroke-width", l => l.key === selectedLine ? 4 : 2);
                    }
                });

            legend = mainG.selectAll(".legend");
        }

    }).catch(error => {
        console.error("Error loading data:", error);
    });
}

// Example usage:
// monthlyRidershipByModeChart({ width: 720, height: 480, container: ".ridership-chart" });
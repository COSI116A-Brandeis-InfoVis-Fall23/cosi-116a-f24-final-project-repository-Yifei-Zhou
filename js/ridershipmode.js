// Create a function for the Monthly Ridership By Mode D3 line chart with brushing, linking, filtering, zooming, highlighting, and dynamic legends
function monthlyRidershipByModeChart(config) {
    const { width, height } = config;
    const margin = { top: 50, right: 150, bottom: 50, left: 50 };

    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    d3.csv("../data/MBTA_Monthly_Ridership_By_Mode.csv").then(function (data) {
        // Parse data to group and format it for D3 line chart
        const nestedData = d3.nest()
            .key(d => d.mode)
            .key(d => d.month)
            .rollup(values => d3.sum(values, v => +v.average_flow))
            .entries(data);

        const svg = d3.select("body").append("svg")
            .attr("width", svgWidth)
            .attr("height", svgHeight)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Extract unique x-axis values (month categories)
        const months = [...new Set(data.map(d => d.month))];

        // Define scales
        const xScale = d3.scalePoint()
            .domain(months)
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

        // Add brushing to highlight linked data
        const brush = d3.brushX()
            .extent([[0, 0], [width, height]])
            .on("brush end", brushed);

        svg.append("g")
            .attr("class", "brush")
            .call(brush);

        function brushed({ selection }) {
            if (selection) {
                const [x0, x1] = selection;
                const brushedMonths = xScale.domain().filter(d => {
                    const x = xScale(d);
                    return x >= x0 && x <= x1;
                });
                lines.style("opacity", d => brushedMonths.some(t => d.values.some(v => v.key === t)) ? 1 : 0.1);
            } else {
                lines.style("opacity", 1);
            }
        }

        // Add legend with dynamic toggling
        const legend = svg.selectAll(".legend")
            .data(nestedData)
            .enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d, i) => `translate(${width + 10},${i * 20})`)
            .on("click", function (event, d) {
                const isActive = d3.select(this).classed("active");
                d3.select(this).classed("active", !isActive);
                lines.filter(l => l.key === d.key).style("opacity", isActive ? 0.1 : 1);
            });

        legend.append("rect")
            .attr("x", 0)
            .attr("y", -10)
            .attr("width", 12)
            .attr("height", 12)
            .style("fill", d => color(d.key));

        legend.append("text")
            .attr("x", 20)
            .attr("y", 0)
            .text(d => d.key);

        // Add tooltip
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("position", "absolute")
            .style("background", "white")
            .style("border", "1px solid black")
            .style("padding", "5px")
            .style("display", "none");

        lines.on("mouseover", function (event, d) {
            d3.select(this).style("stroke-width", 4);
            tooltip.style("display", "block")
                .html(`<strong>Mode:</strong> ${d.key}<br><strong>Average Flow:</strong> ${d3.sum(d.values, v => v.value)}`);
        }).on("mousemove", function (event) {
            tooltip.style("left", `${event.pageX + 10}px`)
                .style("top", `${event.pageY + 10}px`);
        }).on("mouseout", function () {
            d3.select(this).style("stroke-width", 2);
            tooltip.style("display", "none");
        });

        // Add zoom functionality
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent([[0, 0], [width, height]])
            .on("zoom", zoomed);

        svg.call(zoom);

        function zoomed({ transform }) {
            const newXScale = transform.rescaleX(xScale);
            svg.select(".x-axis").call(d3.axisBottom(newXScale));
            lines.attr("d", d => line.x(d => newXScale(d.key))(d.values));
        }

    }).catch(function (error) {
        console.error("Error loading the data: ", error);
    });
}

// Example usage in visualization.js
// var myChart = monthlyRidershipByModeChart({ width: 720, height: 480 });


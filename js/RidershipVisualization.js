function ridershipVisualizationChart(config) {
    const { width, height, container } = config;
    const margin = { top: 50, right: 150, bottom: 70, left: 70 };

    const svgWidth = width + margin.left + margin.right;
    const svgHeight = height + margin.top + margin.bottom;

    const containerElement = d3.select(container);
    if (containerElement.empty()) {
        console.error("Container element not found: ", container);
        return;
    }

    containerElement.selectAll("svg").remove(); // Clear previous SVG if it exists

    const svg = containerElement.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    const x = d3.scaleTime().range([0, width]);
    const y = d3.scaleLinear().range([height, 0]);

    const xAxis = d3.axisBottom(x);
    const yAxis = d3.axisLeft(y);

    svg.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(0," + height + ")")
        .call(xAxis);

    svg.append("g")
        .attr("class", "y axis")
        .call(yAxis);

    d3.csv("../data/MBTA_Commuter_Rail_Ridership_by_Trip_Season_Route_Line_and_Stop.csv").then(function(data) {
        console.log("Data loaded:", data);

        // Now process data
        data.forEach(function(d) {
            d.date = new Date(d.date);
            d.ridership = +d.ridership;
        });

        x.domain(d3.extent(data, d => d.date));
        y.domain([0, d3.max(data, d => d.ridership)]);

        const line = d3.line()
            .x(d => x(d.date))
            .y(d => y(d.ridership));

        svg.append("path")
            .data([data])
            .attr("class", "line")
            .attr("d", line);

        // Add circles
        svg.selectAll("circle")
            .data(data)
            .enter().append("circle")
            .attr("cx", d => x(d.date))
            .attr("cy", d => y(d.ridership))
            .attr("r", 3)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("r", 6).style("fill", "red");
            })
            .on("mouseout", function() {
                d3.select(this).attr("r", 3).style("fill", "black");
            });

        // Add season filter dropdown
        d3.select("body").append("select")
            .attr("id", "seasonFilter")
            .selectAll("option")
            .data([...new Set(data.map(d => d.season))])
            .enter().append("option")
            .text(d => d)
            .on("change", function() {
                const selectedSeason = d3.select("#seasonFilter").property("value");
                const filteredData = data.filter(d => d.season === selectedSeason);
                updateChart(filteredData);
            });

        function updateChart(filteredData) {
            x.domain(d3.extent(filteredData, d => d.date));
            y.domain([0, d3.max(filteredData, d => d.ridership)]);

            svg.select(".x.axis").call(xAxis);
            svg.select(".y.axis").call(yAxis);

            svg.select(".line").data([filteredData]).attr("d", line);
        }

        function brushEnded(event) {
            const selection = event.selection;
            if (selection) {
                const [start, end] = selection.map(x.invert);
                const filteredData = data.filter(d => d.date >= start && d.date <= end);
                console.log("Brushed data:", filteredData);
            }
        }
    
        const zoom = d3.zoom()
            .scaleExtent([1, 10])
            .translateExtent([[0, 0], [width, height]])
            .on("zoom", zoomed);
    
        svg.call(zoom);
    
        function zoomed(event) {
            const transform = event.transform;
            const newX = transform.rescaleX(x);
            svg.select(".x.axis").call(xAxis.scale(newX));
            svg.select(".line").attr("d", line.x(d => newX(d.date)));
        }

        svg.on("click", function() {
            // Clicking on blank areas will clear highlights
            svg.selectAll("circle").attr("r", 3).style("fill", "black");
        });

        console.log("Visualization complete");
    });
}
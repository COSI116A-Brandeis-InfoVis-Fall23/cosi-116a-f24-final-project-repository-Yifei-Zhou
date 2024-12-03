d3.csv("/mnt/data/MBTA_Commuter_Rail_Ridership_by_Trip%2C_Season%2C_Route_Line%2C_and_Stop.csv").then(function(data) {
    console.log("Data loaded:", data);
});

const margin = {top: 20, right: 20, bottom: 30, left: 50};
const width = 960 - margin.left - margin.right;
const height = 500 - margin.top - margin.bottom;

const svg = d3.select("body").append("svg")
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



data.forEach(function(d) {
    d.date = new Date(d.date);
    d.ridership = +d.ridership;
});

x.domain(d3.extent(data, function(d) { return d.date; }));
y.domain([0, d3.max(data, function(d) { return d.ridership; })]);



const line = d3.line()
    .x(function(d) { return x(d.date); })
    .y(function(d) { return y(d.ridership); });

svg.append("path")
    .data([data])
    .attr("class", "line")
    .attr("d", line);
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
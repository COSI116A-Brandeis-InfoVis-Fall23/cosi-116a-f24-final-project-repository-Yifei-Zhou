// Immediately Invoked Function Expression to limit access to our 
// variables and prevent 
// visualization.js

// Load the data
// Using d3.csv with a callback function to handle the error
// and continue processing the data.
((() => {

  // Create the rail ridership by time period line chart
  var railRidershipByTimePeriod = railRidershipByTimePeriodChart({ width: 720, height: 480 });

  // Create the monthly ridership by mode line chart
  var monthlyRidershipByMode = monthlyRidershipByModeChart({ width: 720, height: 480 });

})());

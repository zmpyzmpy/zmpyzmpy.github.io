var margin = {
    top: 50,
    right: 0,
    bottom: 100,
    left: 60
  },
  width = 1400 - margin.left - margin.right,
  height = 250 - margin.top - margin.bottom,
  gridSize = Math.floor(width / 53),
  legendElementWidth = gridSize * 4,
  buckets = 9,
  // colors = d3.scaleLinear().domain([1, buckets])
  // .interpolate(d3.interpolateHcl)
  // .range([d3.rgb("#007AFF"), d3.rgb('#FFF500')]),
  colors = colorbrewer.YlGn[buckets],
  years = ['2010', '2011', '2012'],
  eps3 = d3.range(1, 53);

// console.log(colors[0];

var parseTime = d3.timeParse("%Y-%m-%d");

var color = d3.scaleOrdinal()
  .domain([1, 45])
  .range(["#48A36D", "#56AE7C", "#64B98C", "#72C39B", "#80CEAA",
    "#48A36D", "#56AE7C", "#64B98C", "#72C39B", "#80CEAA", "#80CCB3",
    "#7FC9BD", "#7FC7C6", "#7EC4CF", "#7FBBCF", "#7FB1CF", "#80A8CE",
    "#809ECE", "#8897CE", "#8F90CD", "#9788CD", "#9E81CC", "#AA81C5",
    "#B681BE", "#C280B7", "#CE80B0", "#D3779F", "#D76D8F", "#DC647E",
    "#E05A6D", "#E16167", "#E26962", "#E2705C", "#E37756", "#E38457",
    "#E39158", "#E29D58", "#E2AA59", "#E0B15B", "#DFB95C", "#DDC05E",
    "#DBC75F", "#E3CF6D", "#EAD67C", "#F2DE8A"
  ]);

d3.csv("data/features.csv",
  function(d) {

    d.Week = d.Date;
    d.Date = parseTime(d.Date);
    d.Weekly_Sales = +d.Weekly_Sales;

    d.Percentage = +d.Percentage;

    return d;
  },
  function(error, data) {
    if (error) throw error;

    /**
     *
     *
     ********
     Head Map
     ********
     *
     *
     **/

    var dataHeatMap = d3.nest()
      .key(function(d) {
        return d.Date;
      })
      .rollup(function(v) {
        return {
          Weekly_Sales: d3.sum(v, function(d) {
            return d.Weekly_Sales;
          }),
          Year: (v[0].Date.getFullYear() % 10) + 1,
          Week: moment(v[0].Week).format('W'),
          Date: v[0].Date,
          IsHoliday: v[0].IsHoliday
        };
      })
      .entries(data);

    // console.log("dataHeatMap");
    // console.log(dataHeatMap);

    var max = d3.max(dataHeatMap, function(date) {
      return date.value.Weekly_Sales;
    });

    var min = d3.min(dataHeatMap, function(date) {
      return date.value.Weekly_Sales;
    });

    // console.log(min);

    var colorScale = d3.scaleQuantile()
      .domain([min, max])
      .range(colors);

    var svgHeat = d3.select("#chart1").append("svg")
      .attr("width", 1400)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    var dayLabels = svgHeat.selectAll(".dayLabel")
      .data(years)
      .enter().append("text")
      .text(function(d) {
        return d;
      })
      .attr("x", 0)
      .attr("y", function(d, i) {
        return i * gridSize;
      })
      .style("text-anchor", "end")
      .attr("transform", "translate(-10," + gridSize / 1.5 + ")")
      .attr("class", function(d, i) {
        return ((i >= 0 && i <= 4) ? "dayLabel mono axis axis-workweek" : "dayLabel mono axis");
      });

    var timeLabels = svgHeat.selectAll(".timeLabel")
      .data(eps3)
      .enter().append("text")
      .text(function(d) {
        return d;
      })
      .attr("x", function(d, i) {
        return i * gridSize;
      })
      .attr("y", 0)
      .style("text-anchor", "middle")
      .attr("transform", "translate(" + gridSize / 2 + ", -10)")
      .attr("class", function(d, i) {
        return ((i + 1 == 6 || i + 1 == 36 || i + 1 == 47 || i + 1 == 52) ? "holiday" : "notholiday");
      });
    var heatMap = svgHeat.selectAll(".hour")
      .data(dataHeatMap)
      .enter().append("rect")
      .attr("x", function(d) {
        return (d.value.Week - 1) * gridSize;
      })
      .attr("y", function(d) {
        return (d.value.Year - 1) * gridSize;
      })
      .attr("class", "hour bordered")
      .attr("id", function(d) {
        return "" + d.value.Week + "-" + d.value.Date.getFullYear() + "";
      })
      .attr("width", gridSize)
      .attr("height", gridSize)
      .style("fill", colors[0])
      .on("mouseover", function(d) {
        //Update the tooltip position and value
        // console.log(d);
        d3.select("#tooltip")
          .style("left", (d3.event.pageX + 10) + "px")
          .style("top", (d3.event.pageY - 10) + "px")
          .select("#value");

        //Show the tooltip
        d3.select("#tooltip").classed("hidden", false)
          .html("<strong>Weekly Sales:</strong> <span style='color:#2ECC71'>" +
            "$ " + d.value.Weekly_Sales.toLocaleString('en-US', {
              minimumFractionDigits: 2
            }) + "</span> <br> <strong>Date: </strong> <span style='color:#3498DB'>" +
            moment(d.value.Date).format("ll") + "</span> <br> <strong>Is Holiday: </strong> <span style='color:#F1C40F'>" +
            (d.value.IsHoliday == 0 ? 'False' : 'True') + "</span>");

      }) //onmouseover
      .on("click", function(d) {
        updateHeatMap(d.value.Week, d.value.Date.getFullYear());
        updateBarChart(d.value.Date);
        updateIndicatorLine(d.value.Date, d.value);
      })
      .on("mouseout", function() {
        d3.select(this).classed("cell-hover", false);
        d3.selectAll(".timeLabel").classed("text-highlight", false);
        d3.selectAll(".dayLabel").classed("text-highlight", false);
        d3.select("#tooltip").classed("hidden", true);
      });

    function updateHeatMap(weeknumber, year) {
      fixHeatMapColor();
      svgHeat.select("rect[id='" + weeknumber + "-" + year + "']").style("fill", "orange");
    }

    fixHeatMapColor();

    function fixHeatMapColor() {
      heatMap
        .style("fill", function(d) {
          return colorScale(d.value.Weekly_Sales);
        });
    }

    var legend = svgHeat.selectAll(".legend")
      // .data(colorScale.quantiles())
      .data([0].concat(colorScale.quantiles()), function(d) {
        return d;
      })
      .enter().append("g")
      .attr("class", "legend");

    // console.log(colorScale.quantiles());
    legend.append("rect")
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height)
      .attr("width", legendElementWidth)
      .attr("height", gridSize / 2)
      .style("fill", function(d, i) {
        return colors[i];
      });


    legend.append("text")
      .attr("class", "mono")
      .text(function(d) {
        return "≥ " + Math.round(d);
      })
      .attr("x", function(d, i) {
        return legendElementWidth * i;
      })
      .attr("y", height + gridSize);

    /**
     *
     *
     ********
     BARCHART
     ********
     *
     *
     **/

    var averageStoreBarChart = d3.nest()
      .key(function(d) {
        return d.Store;
      })
      .rollup(function(v) {
        return {
          Average: d3.mean(v, function(d) {
            return d.Weekly_Sales;
          })
        }
      })
      .entries(data);

    // console.log("AverageBarChart");
    // console.log(averageStoreBarChart[0].value.Average);

    var dataBarChart = d3.nest()
      .key(function(d) {
        return d.Date;
      })
      .key(function(d) {
        return d.Store;
      })
      .rollup(function(v) {
        return {
          Weekly_Sales: d3.mean(v, function(d) {
            return d.Weekly_Sales;
          }),
          Fuel_Price: d3.mean(v, function(d) {
            return d.Fuel_Price;
          }),
          CPI: v[0].CPI,
          Temperature: v[0].Temperature,
          Unemployment: parseInt(v[0].Unemployment),
          Weekly_Sales: d3.sum(v, function(d) {
            return d.Weekly_Sales;
          }),
          Weekly_Sales_avg: d3.mean(v, function(d) {
            return d.Weekly_Sales;
          }),
          Date: v[0].Date,
          Store: v[0].Store,
          Dept: v[0].Dept,
          IsHoliday: v[0].IsHoliday,
          Percentage: v[0].Percentage
        }
      })
      .entries(data);

    // console.log("dataBarChart");
    // console.log(dataBarChart);

    var margin1 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width1 = 1400 - margin1.left - margin1.right,
      height1 = 300 - margin1.top - margin1.bottom;

    var xBar = d3.scaleBand()
      .rangeRound([0, width1])
      .padding(0.1);
    var yBar = d3.scaleLinear()
      .range([height1, 0]);

    var xAxis = d3.axisBottom()
      .scale(xBar);
    var yAxis = d3.axisLeft()
      .scale(yBar);

    var xBarSort = d3.scaleBand()
      .rangeRound([0, width1])
      .padding(0.1);
    var yBarSort = d3.scaleLinear()
      .range([height1, 0]);

    var xAxisSort = d3.axisBottom()
      .scale(xBarSort);
    var yAxisSort = d3.axisLeft()
      .scale(yBarSort);

    var maxWeeklySales = d3.max(dataBarChart, function(dates) {
      return d3.max(dates.values, function(store) {
        return store.value.Weekly_Sales;
      });
    });

    xBar.domain(dataBarChart[0].values.map(function(d) {
      return d.value.Store;
    }));
    yBar.domain([-100, 100]);

    xBarSort.domain(dataBarChart[0].values.map(function(d) {
      return d.value.Store;
    }));
    yBarSort.domain([0, maxWeeklySales]);

    /**
     **  AVERAGE BarChart
     **/

    // d3.select("#chart2").select("svg").remove();
    var svgBar = d3.select("#chart2").append("svg")
      .attr("width", width1 + margin1.left + margin1.right)
      .attr("height", height1 + margin1.top + margin1.bottom)
      .append("g")
      .attr("transform", "translate(" + margin1.left + "," + margin1.top + ")");

    svgBar.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height1 + ")")
      .call(xAxis);

    svgBar.append("g")
      .attr("class", "y axis")
      .call(yAxis)
      .append("text")
      .attr("transform", "translate(0,-30)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Weekly Sales");

    /**
     **  SORTED BarChart
     **/

    // d3.select("#chart2").select("svg").remove();
    var svgBarSort = d3.select("#chartSORT").append("svg")
      .attr("width", width1 + margin1.left + margin1.right)
      .attr("height", height1 + margin1.top + margin1.bottom)
      .append("g")
      .attr("transform", "translate(" + margin1.left + "," + margin1.top + ")");

    svgBarSort.append("g")
      .attr("class", "x axisSort")
      .attr("transform", "translate(0," + height1 + ")")
      .call(xAxisSort);

    svgBarSort.append("g")
      .attr("class", "y axis")
      .call(yAxisSort)
      .append("text")
      .attr("transform", "translate(0,-30)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Weekly Sales");

    var BARSELECTEDDATE = -1;
    var updateBarChart = function(selectedDate) {

      let lastSelectedDate = -1;

      if (BARSELECTEDDATE != -1) {

        lastSelectedDate = BARSELECTEDDATE;
      } else {

        lastSelectedDate = selectedDate;
      }

      BARSELECTEDDATE = selectedDate;

      // console.log('update BarChart');

      selectedDate = new Date(selectedDate);
      // console.log('selected date:: ');
      // console.log(selectedDate);

      dataBarChart.forEach(function(date) {
        date.values.forEach(function(d) {

          if (d.value.Date.setHours(0, 0, 0, 0) == BARSELECTEDDATE.setHours(0, 0, 0, 0)) {

            date.Visible = true;
          } else {

            date.Visible = false;
          }
        });
      });

      let lastDates = {};
      let lastDatesSort = {};
      dataBarChart.forEach(function(date) {
        date.values.forEach(function(d) {
          if (d.value.Date.setHours(0, 0, 0, 0) == lastSelectedDate.setHours(0, 0, 0, 0)) {
            lastDates = date.values;
            lastDatesSort = date.values;
          }
        })
      });

      let filteredDataBarChart = {};
      let filteredDataBarChartSort = {};
      dataBarChart.forEach(function(d) {
        if (d.Visible) {
          filteredDataBarChart = d.values;
          filteredDataBarChartSort = d.values;
        }
      });

      /**
       **  Average BarChart
       **/
      sort();
      svgBar.selectAll(".bar").remove();
      svgBar.selectAll(".bar")
        .data(lastDates)
        .enter().append("rect")
        .attr("class", "bar")
        .attr("fill", "orange")
        .attr("x", function(d) {
          return xBar(d.value.Store);
        })
        .attr("width", xBar.bandwidth())
        .attr("y", function(d, i) {
          var change = ((d.value.Weekly_Sales / averageStoreBarChart[d.key - 1].value.Average) - 1) * 100;
          var changeHeight = height1 / 2 - yBar(change);
          if (changeHeight >= 0) {
            return yBar(change);
          } else {
            return 115;
          }
        })
        .attr("height", function(d, i) {
          var change = ((d.value.Weekly_Sales / averageStoreBarChart[d.key - 1].value.Average) - 1) * 100;
          var changeHeight = height1 / 2 - yBar(change);
          if (changeHeight >= 0) {
            return changeHeight;
          } else {
            return changeHeight * -1;
          }
        })
        .data(filteredDataBarChart)
        .transition().duration(1000)
        .attr("x", function(d) {
          return xBar(d.value.Store);
        })
        .attr("width", xBar.bandwidth())
        .attr("y", function(d, i) {
          var change = ((d.value.Weekly_Sales / averageStoreBarChart[d.key - 1].value.Average) - 1) * 100;
          var changeHeight = height1 / 2 - yBar(change);
          if (changeHeight >= 0) {
            return yBar(change);
          } else {
            return 115;
          }
        })
        .attr("height", function(d, i) {
          var change = ((d.value.Weekly_Sales / averageStoreBarChart[d.key - 1].value.Average) - 1) * 100;
          var changeHeight = height1 / 2 - yBar(change)
          if (changeHeight >= 0) {
            return changeHeight;
          } else {
            return changeHeight * -1;
          }
        });

      svgBar.selectAll(".bar")
        .on("mouseover", function(d) {
          console.log(d);
          d3.select("#tooltip")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
            .select("#value");


          //Show the tooltip
          d3.select("#tooltip").classed("hidden", false)
            .html("<strong>Percentage change:</strong> <span style='color:#2ECC71'>" + (d.value.Percentage * 100).toLocaleString('en-US', {
              minimumFractionDigits: 2
            }) + "%");

        })
        .on("mouseout", function() {
          d3.select(this).classed("cell-hover", false);
          d3.selectAll(".timeLabel").classed("text-highlight", false);
          d3.selectAll(".dayLabel").classed("text-highlight", false);
          d3.select("#tooltip").classed("hidden", true);
        })

        .on("click", function(d) {
          d3.selectAll(".bar").attr("fill", "orange");
          d3.selectAll(".barSort").attr("fill", "orange");
          d3.select(this).attr("fill", "orangered");
          updateLineChart(d.value.Store);
          updateLineChartFuel(d.value.Store);
          updateLineChartcpi(d.value.Store);
          updateLineCharttemp(d.value.Store);
          updateLineChartUnemployment(d.value.Store);
          updateDetails(d.value);
          // linechart(d.value.Store, date);
          // linechart.mouseclick(date);
        });

      /**
       **  SORTED BarChart
       **/

      svgBarSort.selectAll(".barSort").remove();
      svgBarSort.selectAll(".barSort")
        .data(lastDatesSort)
        .enter().append("rect")
        .attr("class", "barSort")
        .attr("fill", "orange")
        .attr("x", function(d) {
          return xBarSort(d.value.Store);
        })
        .attr("width", xBarSort.bandwidth())
        .attr("y", function(d, i) {
          return yBarSort(d.value.Weekly_Sales);
        })
        .attr("height", function(d, i) {
          return height1 - yBarSort(d.value.Weekly_Sales);
        })
        .data(filteredDataBarChartSort)
        .transition().duration(1000)
        .attr("x", function(d) {
          return xBarSort(d.value.Store);
        })
        .attr("width", xBarSort.bandwidth())
        .attr("y", function(d, i) {
          return yBarSort(d.value.Weekly_Sales);
        })
        .attr("height", function(d, i) {
          return height1 - yBarSort(d.value.Weekly_Sales)
        });

      svgBarSort.selectAll(".barSort")
        .on("mouseover", function(d) {

          d3.select("#tooltip")
            .style("left", (d3.event.pageX + 10) + "px")
            .style("top", (d3.event.pageY - 10) + "px")
            .select("#value");


          //Show the tooltip
          d3.select("#tooltip").classed("hidden", false)
            .html("<strong>Weekly Sales:</strong> <span style='color:#2ECC71'> $" + d.value.Weekly_Sales.toLocaleString('en-US', {
              minimumFractionDigits: 2
            }));

        })
        .on("mouseout", function() {
          d3.select(this).classed("cell-hover", false);
          d3.selectAll(".timeLabel").classed("text-highlight", false);
          d3.selectAll(".dayLabel").classed("text-highlight", false);
          d3.select("#tooltip").classed("hidden", true);
        })

        .on("click", function(d) {
          d3.selectAll(".bar").attr("fill", "orange");
          d3.selectAll(".barSort").attr("fill", "orange");
          d3.select(this).attr("fill", "orangered");
          updateLineChart(d.value.Store);
          updateLineChartFuel(d.value.Store);
          updateLineChartcpi(d.value.Store);
          updateLineCharttemp(d.value.Store);
          updateLineChartUnemployment(d.value.Store);
          updateDetails(d.value);
          // linechart(d.value.Store, date);
          // linechart.mouseclick(date);

        });
      //update rank



      function sort() {

        var x00 = xBarSort.domain(filteredDataBarChartSort.sort(
              function(a, b) {
                return b.value.Weekly_Sales - a.value.Weekly_Sales;
              })
            .map(function(d) {
              return parseInt(d.value.Store);
            }))
          .copy();

        svgBarSort.selectAll(".barSort")
          .sort(function(a, b) {
            return x00(a.value.Store) - x00(b.value.Store);
          });

        var transition = svgBarSort.transition().duration(750),
          delay = function(d, i) {
            // return i * 50;
            return 0;
          };

        transition.selectAll(".barSort")
          .delay(delay)
          .attr("x", function(d) {
            return x00(d.value.Store);
          });

        transition.select(".x.axisSort")
          .call(xAxisSort)
          .selectAll("g")
          .delay(delay);

        //average

        var x01 = xBar.domain(filteredDataBarChart.sort(
              function(a, b) {
                return b.value.Weekly_Sales - a.value.Weekly_Sales;
              })
            .map(function(d) {
              return parseInt(d.value.Store);
            }))
          .copy();

        svgBar.selectAll(".bar")
          .sort(function(a, b) {
            return x01(a.value.Store) - x01(b.value.Store);
          });

        var transition = svgBar.transition().duration(750);
        var delay = function(d, i) {
          // return i * 50;
          return 0;
        };

        transition.selectAll(".bar")
          .delay(delay)
          .attr("x", function(d) {
            return x01(d.value.Store);
          });

        transition.select(".x.axis")
          .call(xAxis)
          .selectAll("g")
          .delay(delay);
      } //end sort function

      lastDatesSort = filteredDataBarChartSort;

    }; //end update

    /**
     *
     *
     ********
     LINECHART Fuel Price
     ********
     *
     *
     **/
    var parseTime = d3.timeParse("%Y-%m-%d");
    var bisectDate = d3.bisector(function(d) {
      return d.value.Date;
    }).left;

    var lineWidth = 1400;
    var lineHeight = 300;

    // Nest the entries by symbol
    var dataLineChart = d3.nest()
      .key(function(d) {
        return d.Store;
      })
      .key(function(d) {
        return d.Date;
      })
      .rollup(function(v) {
        return {
          Fuel_Price: d3.sum(v, function(d) {
            return d.Fuel_Price;
          }),
          Fuel_Price: d3.mean(v, function(d) {
            return d.Fuel_Price;
          }),
          CPI: v[0].CPI,
          Temperature: v[0].Temperature,
          Unemployment: parseInt(v[0].Unemployment),
          Weekly_Sales: d3.sum(v, function(d) {
            return d.Weekly_Sales;
          }),
          Weekly_Sales_avg: d3.mean(v, function(d) {
            return d.Weekly_Sales;
          }),
          Date: v[0].Date,
          Store: v[0].Store,
          Dept: v[0].Dept,
          IsHoliday: v[0].IsHoliday
        };
      })
      .entries(data);

    /**
     *
     *
     ********
     Fuel Price
     ********
     *
     *
     **/

    // d3.select("#chart3").select("svg").remove();
    var svgLineFuel = d3.select("#chart3").append("svg")
      .attr("width", lineWidth)
      .attr("height", lineHeight),
      margin3 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width3 = +svgLineFuel.attr("width") - margin3.left - margin3.right,
      height3 = +svgLineFuel.attr("height") - margin3.top - margin3.bottom,
      g = svgLineFuel.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

    var xLineFuel = d3.scaleTime().rangeRound([0, width3]);
    var yLineFuel = d3.scaleLinear().rangeRound([height3, 0]);

    var lineFuel = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return xLineFuel(d.value.Date);
      })
      .y(function(d) {
        return yLineFuel(d.value.Fuel_Price);
      });

    // console.log("dataLineChart");
    // console.log(dataLineChart);
    let SELECTEDDAYFUEL = null;

    var max = d3.max(dataLineChart, function(stores) {
      return d3.max(stores.values, function(store) {
        return store.value.Fuel_Price;
      });
    });

    var min = d3.min(dataLineChart, function(stores) {
      return d3.min(stores.values, function(store) {
        return store.value.Fuel_Price;
      });
    });

    xLineFuel.domain(d3.extent(data, function(d) {
      return d.Date;
    }));

    yLineFuel.domain([min, max]);

    // Create invisible rect for mouse tracking
    svgLineFuel.append("rect")
      .attr("width", width3)
      .attr("height", height3)
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "mouse-tracker-fuel")
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .style("stroke-width", 0)
      .style("fill", "transparent");

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(d3.axisBottom(xLineFuel));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLineFuel))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("Fuel_Price $");


    var SELECTEDSTOREFUEL = -1;

    var updateLineChartFuel = function(selectedStore) {

      var lastSelectedStore = -1;

      if (SELECTEDSTOREFUEL != -1) {
        lastSelectedStore = SELECTEDSTOREFUEL;
      } else {
        lastSelectedStore = selectedStore;
      }
      SELECTEDSTOREFUEL = selectedStore;

      // console.log('updateLineChart');

      dataLineChart.forEach(function(d) {

        // // console.log(d);
        if (d.key == SELECTEDSTOREFUEL) {
          d.Visible = true;
        } else {
          d.Visible = false;
        }
      });

      var lastPathFuel = null;
      dataLineChart.forEach(function(d) {
        if (d.key == lastSelectedStore) {
          // console.log('lastSelectedStore');
          // console.log(d);
          lastPathFuel = lineFuel(d.values);
        }
      });

      svgLineFuel.selectAll(".fuel").remove();
      var fuel = svgLineFuel.selectAll(".fuel")
        .data(dataLineChart) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("class", "fuel");

      // Loop through each symbol / key
      dataLineChart.forEach(function(d) { //store level

        // // console.log(color(parseInt(d.key)));

        fuel.append("path")
          .attr("class", "line")
          .style("pointer-events", "none") // Stop line interferring with cursor
          .style("stroke", function(d) {
            return color(parseInt(d.key));
          })
          .attr("d", function(d) {
            return (d.Visible ? lastPathFuel : null);
          })
          .transition()
          .duration(1500)
          .attr("d", function(d) {
            return (d.Visible ? lineFuel(d.values) : null);
          });
      });
    } //end updateLineChartFuel

    // Hover line
    var hoverLineGroupFuel = svgLineFuel.append("g")
      .attr("class", "hover-line-fuel");

    var hoverLineFuel = hoverLineGroupFuel // Create line with basic attributes
      .append("line")
      .attr("id", "hover-line-fuel")
      .attr("x1", 10).attr("x2", 10)
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("opacity", 1e-6); // Set opacity to zero

    var currentSelectionGroupFuel = svgLineFuel.append("g");

    var selectionLineFuel = currentSelectionGroupFuel
      .append("line")
      .attr("id", "hover-line-fuel")
      .attr("x1", xLineFuel(SELECTEDDAYFUEL)).attr("x2", xLineFuel(SELECTEDDAYFUEL))
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("stroke-width", 2)
      .style("stroke", "red")
      .style("fill", "none");

    var hoverDateFuel = hoverLineGroupFuel
      .append('text')
      .attr("class", "hover-text-fuel")
      .attr("y", height3 - (height3 - 40)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");


    d3.select("#mouse-tracker-fuel") // select chart plot background rect #mouse-tracker
      .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
      .on("mouseout", LineMouseOut)
      .on("click", LineMouseClick);

    /**
     *
     *
     ********
     cpi Price
     ********
     *
     *
     **/

    // d3.select("#chart3").select("svg").remove();
    var svgLinecpi = d3.select("#chart4").append("svg")
      .attr("width", lineWidth)
      .attr("height", lineHeight / 2),
      margin3 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width3 = +svgLinecpi.attr("width") - margin3.left - margin3.right,
      height3 = +svgLinecpi.attr("height") - margin3.top - margin3.bottom,
      g = svgLinecpi.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

    var xLinecpi = d3.scaleTime().rangeRound([0, width3]);
    var yLinecpi = d3.scaleLinear().rangeRound([height3, 0]);

    var linecpi = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return xLinecpi(d.value.Date);
      })
      .y(function(d) {
        return yLinecpi(d.value.CPI);
      });

    // console.log("dataLineChart");
    // console.log(dataLineChart);
    let SELECTEDDAYCPI = null;

    var max = d3.max(dataLineChart, function(stores) {
      return d3.max(stores.values, function(store) {
        return store.value.CPI;
      });
    });

    var min = d3.min(dataLineChart, function(stores) {
      return d3.min(stores.values, function(store) {
        return store.value.CPI;
      });
    });

    xLinecpi.domain(d3.extent(data, function(d) {
      return d.Date;
    }));

    yLinecpi.domain([min, max]);

    // Create invisible rect for mouse tracking
    svgLinecpi.append("rect")
      .attr("width", width3)
      .attr("height", height3)
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "mouse-tracker-cpi")
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .style("stroke-width", 0)
      .style("fill", "transparent");

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(d3.axisBottom(xLinecpi));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLinecpi).ticks(4))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("CPI");


    var SELECTEDSTORECPI = -1;

    var updateLineChartcpi = function(selectedStore) {

      var lastSelectedStore = -1;

      if (SELECTEDSTORECPI != -1) {
        lastSelectedStore = SELECTEDSTORECPI;
      } else {
        lastSelectedStore = selectedStore;
      }
      SELECTEDSTORECPI = selectedStore;

      // console.log('updateLineChart');

      dataLineChart.forEach(function(d) {

        // // console.log(d);
        if (d.key == SELECTEDSTORECPI) {
          d.Visible = true;
        } else {
          d.Visible = false;
        }
      });

      var lastPathcpi = null;
      dataLineChart.forEach(function(d) {
        if (d.key == lastSelectedStore) {
          // console.log('lastSelectedStore');
          // console.log(d);
          lastPathcpi = linecpi(d.values);
        }
      });

      svgLinecpi.selectAll(".cpi").remove();
      var cpi = svgLinecpi.selectAll(".cpi")
        .data(dataLineChart) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("class", "cpi");

      // Loop through each symbol / key
      dataLineChart.forEach(function(d) { //store level

        // // console.log(color(parseInt(d.key)));

        cpi.append("path")
          .attr("class", "line")
          .style("pointer-events", "none") // Stop line interferring with cursor
          .style("stroke", function(d) {
            return color(parseInt(d.key));
          })
          .attr("d", function(d) {
            return (d.Visible ? lastPathcpi : null);
          })
          .transition()
          .duration(1500)
          .attr("d", function(d) {
            return (d.Visible ? linecpi(d.values) : null);
          });
      });
    } //end updateLineChartcpi

    // Hover line
    var hoverLineGroupcpi = svgLinecpi.append("g")
      .attr("class", "hover-line-cpi");

    var hoverLinecpi = hoverLineGroupcpi // Create line with basic attributes
      .append("line")
      .attr("id", "hover-line-cpi")
      .attr("x1", 10).attr("x2", 10)
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("opacity", 1e-6); // Set opacity to zero

    var currentSelectionGroupcpi = svgLinecpi.append("g");

    var selectionLinecpi = currentSelectionGroupcpi
      .append("line")
      .attr("id", "hover-line-cpi")
      .attr("x1", xLinecpi(SELECTEDDAYCPI)).attr("x2", xLinecpi(SELECTEDDAYCPI))
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("stroke-width", 2)
      .style("stroke", "red")
      .style("fill", "none");

    var hoverDatecpi = hoverLineGroupcpi
      .append('text')
      .attr("class", "hover-text-cpi")
      .attr("y", height3 - (height3 - 40)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");


    d3.select("#mouse-tracker-cpi") // select chart plot background rect #mouse-tracker
      .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
      .on("mouseout", LineMouseOut)
      .on("click", LineMouseClick);

    /**
     *
     *
     ********
     temp Price
     ********
     *
     *
     **/

    // d3.select("#chart3").select("svg").remove();
    var svgLinetemp = d3.select("#chart6").append("svg")
      .attr("width", lineWidth)
      .attr("height", lineHeight / 2),
      margin3 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width3 = +svgLinetemp.attr("width") - margin3.left - margin3.right,
      height3 = +svgLinetemp.attr("height") - margin3.top - margin3.bottom,
      g = svgLinetemp.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

    var xLinetemp = d3.scaleTime().rangeRound([0, width3]);
    var yLinetemp = d3.scaleLinear().rangeRound([height3, 0]);

    var linetemp = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return xLinetemp(d.value.Date);
      })
      .y(function(d) {
        return yLinetemp(d.value.Temperature);
      });

    // console.log("dataLineChart");
    // console.log(dataLineChart);
    let SELECTEDDAYTEMP = null;

    var max = d3.max(dataLineChart, function(stores) {
      return d3.max(stores.values, function(store) {
        return store.value.Temperature;
      });
    });

    var min = d3.min(dataLineChart, function(stores) {
      return d3.min(stores.values, function(store) {
        return store.value.Temperature;
      });
    });

    xLinetemp.domain(d3.extent(data, function(d) {
      return d.Date;
    }));

    yLinetemp.domain([min, max]);

    // Create invisible rect for mouse tracking
    svgLinetemp.append("rect")
      .attr("width", width3)
      .attr("height", height3)
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "mouse-tracker-temp")
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .style("stroke-width", 0)
      .style("fill", "transparent");

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(d3.axisBottom(xLinetemp));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLinetemp).ticks(4))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("Temperature °F");


    var SELECTEDSTORETEMPERATURE = -1;

    var updateLineCharttemp = function(selectedStore) {

      var lastSelectedStore = -1;

      if (SELECTEDSTORETEMPERATURE != -1) {
        lastSelectedStore = SELECTEDSTORETEMPERATURE;
      } else {
        lastSelectedStore = selectedStore;
      }
      SELECTEDSTORETEMPERATURE = selectedStore;

      // console.log('updateLineChart');

      dataLineChart.forEach(function(d) {

        // // console.log(d);
        if (d.key == SELECTEDSTORETEMPERATURE) {
          d.Visible = true;
        } else {
          d.Visible = false;
        }
      });

      var lastPathtemp = null;
      dataLineChart.forEach(function(d) {
        if (d.key == lastSelectedStore) {
          // console.log('lastSelectedStore');
          // console.log(d);
          lastPathtemp = linetemp(d.values);
        }
      });

      svgLinetemp.selectAll(".temp").remove();
      var temp = svgLinetemp.selectAll(".temp")
        .data(dataLineChart) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("class", "temp");

      // Loop through each symbol / key
      dataLineChart.forEach(function(d) { //store level

        // // console.log(color(parseInt(d.key)));

        temp.append("path")
          .attr("class", "line")
          .style("pointer-events", "none") // Stop line interferring with cursor
          .style("stroke", function(d) {
            return color(parseInt(d.key));
          })
          .attr("d", function(d) {
            return (d.Visible ? lastPathtemp : null);
          })
          .transition()
          .duration(1500)
          .attr("d", function(d) {
            return (d.Visible ? linetemp(d.values) : null);
          });
      });
    } //end updateLineCharttemp

    // Hover line
    var hoverLineGrouptemp = svgLinetemp.append("g")
      .attr("class", "hover-line-temp");

    var hoverLinetemp = hoverLineGrouptemp // Create line with basic attributes
      .append("line")
      .attr("id", "hover-line-temp")
      .attr("x1", 10).attr("x2", 10)
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("opacity", 1e-6); // Set opacity to zero

    var currentSelectionGrouptemp = svgLinetemp.append("g");

    var selectionLinetemp = currentSelectionGrouptemp
      .append("line")
      .attr("id", "hover-line-temp")
      .attr("x1", xLinetemp(SELECTEDDAYTEMP)).attr("x2", xLinetemp(SELECTEDDAYTEMP))
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("stroke-width", 2)
      .style("stroke", "red")
      .style("fill", "none");

    var hoverDatetemp = hoverLineGrouptemp
      .append('text')
      .attr("class", "hover-text-temp")
      .attr("y", height3 - (height3 - 40)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");


    d3.select("#mouse-tracker-temp") // select chart plot background rect #mouse-tracker
      .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
      .on("mouseout", LineMouseOut)
      .on("click", LineMouseClick);


    /**
     *
     *
     ********
     Unemployment Price
     ********
     *
     *
     **/

    // d3.select("#chart3").select("svg").remove();
    var svgLineUnemployment = d3.select("#chart7").append("svg")
      .attr("width", lineWidth)
      .attr("height", lineHeight / 2),
      margin3 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width3 = +svgLineUnemployment.attr("width") - margin3.left - margin3.right,
      height3 = +svgLineUnemployment.attr("height") - margin3.top - margin3.bottom,
      g = svgLineUnemployment.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

    var xLineUnemployment = d3.scaleTime().rangeRound([0, width3]);
    var yLineUnemployment = d3.scaleLinear().rangeRound([height3, 0]);

    var lineUnemployment = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return xLineUnemployment(d.value.Date);
      })
      .y(function(d) {
        return yLineUnemployment(d.value.Unemployment);
      });

    // console.log("dataLineChart");
    // console.log(dataLineChart);
    let SELECTEDDAYUNEMPLOYMENT = null;

    var max = d3.max(dataLineChart, function(stores) {
      return d3.max(stores.values, function(store) {
        return store.value.Unemployment;
      });
    });

    var min = d3.min(dataLineChart, function(stores) {
      return d3.min(stores.values, function(store) {
        return store.value.Unemployment;
      });
    });

    xLineUnemployment.domain(d3.extent(data, function(d) {
      return d.Date;
    }));

    yLineUnemployment.domain([min, max]);

    // Create invisible rect for mouse tracking
    svgLineUnemployment.append("rect")
      .attr("width", width3)
      .attr("height", height3)
      .attr("x", 0)
      .attr("y", 0)
      .attr("id", "mouse-tracker-Unemployment")
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .style("stroke-width", 0)
      .style("fill", "transparent");

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(d3.axisBottom(xLineUnemployment));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLineUnemployment).ticks(4))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("Unemployment %");


    var SELECTEDSTOREUNEMPLOYMENT = -1;

    var updateLineChartUnemployment = function(selectedStore) {

      var lastSelectedStore = -1;

      if (SELECTEDSTOREUNEMPLOYMENT != -1) {
        lastSelectedStore = SELECTEDSTOREUNEMPLOYMENT;
      } else {
        lastSelectedStore = selectedStore;
      }
      SELECTEDSTOREUNEMPLOYMENT = selectedStore;

      // console.log('updateLineChart');

      dataLineChart.forEach(function(d) {

        // // console.log(d);
        if (d.key == SELECTEDSTOREUNEMPLOYMENT) {
          d.Visible = true;
        } else {
          d.Visible = false;
        }
      });

      var lastPathUnemployment = null;
      dataLineChart.forEach(function(d) {
        if (d.key == lastSelectedStore) {
          // console.log('lastSelectedStore');
          // console.log(d);
          lastPathUnemployment = lineUnemployment(d.values);
        }
      });

      svgLineUnemployment.selectAll(".Unemployment").remove();
      var Unemployment = svgLineUnemployment.selectAll(".Unemployment")
        .data(dataLineChart) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("class", "Unemployment %");

      // Loop through each symbol / key
      dataLineChart.forEach(function(d) { //store level

        // // console.log(color(parseInt(d.key)));

        Unemployment.append("path")
          .attr("class", "line")
          .style("pointer-events", "none") // Stop line interferring with cursor
          .style("stroke", function(d) {
            return color(parseInt(d.key));
          })
          .attr("d", function(d) {
            return (d.Visible ? lastPathUnemployment : null);
          })
          .transition()
          .duration(1500)
          .attr("d", function(d) {
            return (d.Visible ? lineUnemployment(d.values) : null);
          });
      });
    } //end updateLineChartUnemployment

    // Hover line
    var hoverLineGroupUnemployment = svgLineUnemployment.append("g")
      .attr("class", "hover-line-Unemployment");

    var hoverLineUnemployment = hoverLineGroupUnemployment // Create line with basic attributes
      .append("line")
      .attr("id", "hover-line-Unemployment")
      .attr("x1", 10).attr("x2", 10)
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("opacity", 1e-6); // Set opacity to zero

    var currentSelectionGroupUnemployment = svgLineUnemployment.append("g");

    var selectionLineUnemployment = currentSelectionGroupUnemployment
      .append("line")
      .attr("id", "hover-line-Unemployment")
      .attr("x1", xLineUnemployment(SELECTEDDAYUNEMPLOYMENT)).attr("x2", xLineUnemployment(SELECTEDDAYUNEMPLOYMENT))
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("stroke-width", 2)
      .style("stroke", "red")
      .style("fill", "none");

    var hoverDateUnemployment = hoverLineGroupUnemployment
      .append('text')
      .attr("class", "hover-text-Unemployment")
      .attr("y", height3 - (height3 - 40)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");


    d3.select("#mouse-tracker-Unemployment") // select chart plot background rect #mouse-tracker
      .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
      .on("mouseout", LineMouseOut)
      .on("click", LineMouseClick);


    /**
     *
     *
     ********
     Weekly_Sales
     ********
     *
     *
     **/
    var svgLine = d3.select("#chart5").append("svg")
      .attr("width", lineWidth)
      .attr("height", lineHeight),
      margin3 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width3 = +svgLine.attr("width") - margin3.left - margin3.right,
      height3 = +svgLine.attr("height") - margin3.top - margin3.bottom,
      g = svgLine.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");

    var xLine = d3.scaleTime().rangeRound([0, width3]);
    var yLine = d3.scaleLinear().rangeRound([height3, 0]);

    var line = d3.line()
      .curve(d3.curveBasis)
      .x(function(d) {
        return xLine(d.value.Date);
      })
      .y(function(d) {
        return yLine(d.value.Weekly_Sales);
      });

    // setStore(SELECTEDSTORE);

    let SELECTEDDAY = null;

    // console.log("dataLineChart");
    // console.log(dataLineChart);

    var max = d3.max(dataLineChart, function(stores) {
      return d3.max(stores.values, function(store) {
        return store.value.Weekly_Sales;
      });
    });

    var min = d3.min(dataLineChart, function(stores) {
      return d3.min(stores.values, function(store) {
        return store.value.Weekly_Sales;
      });
    });

    xLine.domain(d3.extent(data, function(d) {
      return d.Date;
    }));

    yLine.domain([min, max]);

    // Create invisible rect for mouse tracking
    svgLine.append("rect")
      .attr("width", width3)
      .attr("height", height3)
      .attr("x", 0)
      .attr("y", 0)
      .attr("class", "weekly4")
      .attr("id", "mouse-tracker")
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .style("stroke-width", 0)
      .style("fill", "transparent");

    g.append("g")
      .attr("class", "axis axis--x")
      .attr("transform", "translate(0," + height3 + ")")
      .call(d3.axisBottom(xLine));

    g.append("g")
      .attr("class", "axis axis--y")
      .call(d3.axisLeft(yLine))
      .append("text")
      .attr("fill", "#000")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", "0.71em")
      .style("text-anchor", "end")
      .text("Weekly Sales $");

    let SELECTEDSTORE = -1;

    var updateLineChart = function(selectedStore) {

      var lastSelectedStore = -1;

      if (SELECTEDSTORE != -1) {
        lastSelectedStore = SELECTEDSTORE;
      } else {
        lastSelectedStore = selectedStore;
      }
      SELECTEDSTORE = selectedStore;

      // console.log('updateLineChart');

      dataLineChart.forEach(function(d) {

        // // console.log(d);
        if (d.key == SELECTEDSTORE) {
          d.Visible = true;
        } else {
          d.Visible = false;
        }
      });

      var lastPath = null;
      dataLineChart.forEach(function(d) {
        if (d.key == lastSelectedStore) {
          // console.log('lastSelectedStore');
          // console.log(d);
          lastPath = line(d.values);
        }
      });

      var max = d3.max(dataLineChart, function(stores) {
        if (stores.Visible) {
          return d3.max(stores.values, function(store) {
            return store.value.Weekly_Sales;
          });
        }
      });

      var min = d3.min(dataLineChart, function(stores) {
        if (stores.Visible) {
          return d3.min(stores.values, function(store) {
            return store.value.Weekly_Sales;
          });
        }
      });

      yLine.domain([min, max]);

      svgLine.select(".axis.axis--y").remove();
      svgLine.select("g").append("g")
        .attr("class", "axis axis--y")
        .call(d3.axisLeft(yLine))
        .append("text")
        .attr("fill", "#000")
        .attr("transform", "rotate(-90)")
        .attr("y", 6)
        .attr("dy", "0.71em")
        .style("text-anchor", "end")
        .text("Weekly Sales $");


      svgLine.selectAll(".store").remove();
      var store = svgLine.selectAll(".store")
        .data(dataLineChart) // Select nested data and append to new svg group elements
        .enter().append("g")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("class", "store");

      // Loop through each symbol / key
      dataLineChart.forEach(function(d) { //store level

        // // console.log(color(parseInt(d.key)));

        store.append("path")
          .attr("class", "line")
          .style("pointer-events", "none") // Stop line interferring with cursor
          .style("stroke", function(d) {
            return color(parseInt(d.key));
          })
          .attr("d", function(d) {
            return (d.Visible ? lastPath : null);
          })
          .transition()
          .duration(1500)
          .attr("d", function(d) {
            return (d.Visible ? line(d.values) : null);
          });
      });

    }


    // Hover line
    var hoverLineGroup = svgLine.append("g")
      .attr("class", "hover-line");

    var hoverLine = hoverLineGroup // Create line with basic attributes
      .append("line")
      .attr("id", "hover-line")
      .attr("x1", 10).attr("x2", 10)
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("opacity", 1e-6); // Set opacity to zero

    var currentSelectionGroup = svgLine.append("g");

    var selectionLine = currentSelectionGroup
      .append("line")
      .attr("id", "hover-line")
      .attr("x1", xLine(SELECTEDDAY)).attr("x2", xLine(SELECTEDDAY))
      .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
      .attr("y1", 10).attr("y2", height3)
      .style("pointer-events", "none") // Stop line interferring with cursor
      .style("stroke-width", 2)
      .style("stroke", "red")
      .style("fill", "none");

    var hoverDate = hoverLineGroup
      .append('text')
      .attr("class", "hover-text")
      .attr("y", height3 - (height3 - 40)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");

    var hoverDateSales = hoverLineGroup
      .append('text')
      .attr("class", "hover-text")
      .attr("y", height3 - (height3 - 80)) // hover date text position
      .attr("x", width3 - 300) // hover date text position
      .style("fill", "#E6E7E8");


    d3.select("#mouse-tracker") // select chart plot background rect #mouse-tracker
      .on("mousemove", mousemove) // on mousemove activate mousemove function defined below
      .on("mouseout", LineMouseOut)
      .on("click", LineMouseClick);

    function mousemove() {
      var mouse_x = d3.mouse(this)[0]; // Finding mouse x position on rect
      var graph_x = xLine.invert(mouse_x); //

      var format = d3.timeFormat('%b %d %Y'); // Format hover date text to show three letter month and full year

      hoverDate.text(format(graph_x)); // scale mouse position to xScale date and format it to show month and year

      if (SELECTEDSTORE != -1) {
        // var x0 = x.invert(d3.mouse(this)[0]), /* d3.mouse(this)[0] returns the x position on the screen of the mouse. xScale.invert function is reversing the process that we use to map the domain (date) to range (position on screen). So it takes the position on the screen and converts it into an equivalent date! */
        var x0 = graph_x,
          i = bisectDate(dataLineChart[parseInt(SELECTEDSTORE) - 1].values, x0, 1), // use our bisectDate function that we declared earlier to find the index of our data array that is close to the mouse cursor
          /*It takes our data array and the date corresponding to the position of or mouse cursor and returns the index number of the data array which has a date that is higher than the cursor position.*/
          d0 = dataLineChart[parseInt(SELECTEDSTORE) - 1].values[i - 1].value,
          d1 = dataLineChart[parseInt(SELECTEDSTORE) - 1].values[i].value,
          /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor and d1 is the combination of date and close that is in the data array at the index to the right of the cursor. In other words we now have two variables that know the value and date above and below the date that corresponds to the position of the cursor.*/
          d = x0 - d0.Date > d1.Date - x0 ? d1 : d0;

        hoverDateSales.text("Weekly_Sales: $ " + d.Weekly_Sales.toLocaleString('en-US', {
          minimumFractionDigits: 2
        })); // scale mouse position to xScale date and format it to show month and year
        hoverDateFuel.text("Fuel_Price: $ " + d.Fuel_Price); // scale mouse position to xScale date and format it to show month and year
        hoverDatecpi.text("CPI :" + d.CPI); // scale mouse position to xScale date and format it to show month and year
        hoverDatetemp.text("Temperature: " + d.Temperature + " °F"); // scale mouse position to xScale date and format it to show month and year
        hoverDateUnemployment.text("Unemployment: " + d.Unemployment + "%"); // scale mouse position to xScale date and format it to show month and year
      }


      d3.select("#hover-line") // select hover-line and changing attributes to mouse position
        .attr("x1", mouse_x)
        .attr("x2", mouse_x)
        .style("opacity", 10); // Making line visible

      d3.select("#hover-line-fuel") // select hover-line and changing attributes to mouse position
        .attr("x1", mouse_x)
        .attr("x2", mouse_x)
        .style("opacity", 10); // Making line visible
      d3.select("#hover-line-cpi") // select hover-line and changing attributes to mouse position
        .attr("x1", mouse_x)
        .attr("x2", mouse_x)
        .style("opacity", 10); // Making line visible
      d3.select("#hover-line-temp") // select hover-line and changing attributes to mouse position
        .attr("x1", mouse_x)
        .attr("x2", mouse_x)
        .style("opacity", 10); // Making line visible
      d3.select("#hover-line-Unemployment") // select hover-line and changing attributes to mouse position
        .attr("x1", mouse_x)
        .attr("x2", mouse_x)
        .style("opacity", 10); // Making line visible

      // // console.log(d);
    }; //end mousemove

    /**
     * Details
     **/

    var svgDetails = d3.select("#details").append("svg")
      .attr("width", 450)
      .attr("height", lineHeight),
      margin33 = {
        top: 40,
        right: 20,
        bottom: 30,
        left: 100
      },
      width33 = +svgDetails.attr("width") - margin33.left - margin33.right,
      height33 = +svgDetails.attr("height") - margin33.top - margin33.bottom,
      // g = svgDetails.append("g").attr("transform", "translate(" + margin3.left + "," + margin3.top + ")");
      g = svgDetails.append("g").attr("transform", "translate(-150,0)");

    var DateDetails = g
      .append('text')
      .attr("class", "details-text")
      .attr("y", height33 - (height33 - 40)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var StoreDetails = g
      .append('text')
      .attr("class", "details-text")
      .attr("y", height33 - (height33 - 40 * 2)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var SalesDetails = g
      .append('text')
      .attr("class", "sales-text")
      .attr("y", height33 - (height33 - 40 * 3)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var FuelDetails = g
      .append('text')
      .attr("class", "fuel-text")
      .attr("y", height33 - (height33 - 40 * 4)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var CPIDetails = g
      .append('text')
      .attr("class", "cpi-text")
      .attr("y", height33 - (height33 - 40 * 5)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var TempDetails = g
      .append('text')
      .attr("class", "temp-text")
      .attr("y", height33 - (height33 - 40 * 6)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    var UnemploymentDetails = g
      .append('text')
      .attr("class", "unemployment-text")
      .attr("y", height33 - (height33 - 40 * 7)) // hover date text position
      .attr("x", width33 - 150) // hover date text position
      .style("fill", "#E6E7E8");

    // functions

    function LineMouseClick() {

      // console.log(d3.mouse(this));
      var mouse_x = d3.mouse(this)[0];
      var graph_x = xLine.invert(mouse_x);

      var bisectDate = d3.bisector(function(d) {
        return d.value.Date;
      }).left;

      if (SELECTEDSTORE != -1) {

        var x0 = graph_x,
          i = bisectDate(dataLineChart[parseInt(SELECTEDSTORE) - 1].values, x0, 1), // use our bisectDate function that we declared earlier to find the index of our data array that is close to the mouse cursor
          /*It takes our data array and the date corresponding to the position of or mouse cursor and returns the index number of the data array which has a date that is higher than the cursor position.*/
          d0 = dataLineChart[parseInt(SELECTEDSTORE) - 1].values[i - 1].value,
          d1 = dataLineChart[parseInt(SELECTEDSTORE) - 1].values[i].value,
          /*d0 is the combination of date and rating that is in the data array at the index to the left of the cursor and d1 is the combination of date and close that is in the data array at the index to the right of the cursor. In other words we now have two variables that know the value and date above and below the date that corresponds to the position of the cursor.*/
          d = x0 - d0.Date > d1.Date - x0 ? d1 : d0;

      }

      updateIndicatorLine(graph_x, d);
      updateBarChart(d.Date);
      updateHeatMap(moment(d.Date).format('W'), d.Date.getFullYear());

    }

    function LineMouseOut() {
      setHoverText();

      d3.select("#hover-line")
        .style("opacity", 1e-6); // On mouse out making line invisible
      d3.select("#hover-line-fuel")
        .style("opacity", 1e-6);
      d3.select("#hover-line-cpi")
        .style("opacity", 1e-6);
      d3.select("#hover-line-temp")
        .style("opacity", 1e-6);
      d3.select("#hover-line-Unemployment")
        .style("opacity", 1e-6);
    }

    function updateIndicatorLine(date, d) {

      var LASTPOSITION = SELECTEDDAY;
      SELECTEDDAY = date;

      // console.log(d);
      // console.log(dataLineChart[SELECTEDSTORE-1]);

      if (SELECTEDSTORE != -1) {
        dataLineChart[SELECTEDSTORE - 1].values.forEach(function(date) {
          if (date.value.Date.setHours(0, 0, 0, 0) == d.Date.setHours(0, 0, 0, 0)) {
            d = date.value;
          }
        });
      }

      // console.log('same?');
      // console.log(d);

      updateDetails(d);

      currentSelectionGroup.select('line').remove();
      currentSelectionGroup
        .append("line")
        .attr("id", "hover-line")
        // .attr("transform-origin", "2, 40%")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("y1", 10).attr("y2", height3)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("stroke-width", 2)
        .style("stroke", "red")
        .style("fill", "none")
        .attr("x1", xLine(LASTPOSITION)).attr("x2", xLine(LASTPOSITION))
        .transition().duration(1000)
        .attr("x1", xLine(SELECTEDDAY)).attr("x2", xLine(SELECTEDDAY));

      currentSelectionGroupFuel.select('line').remove();
      currentSelectionGroupFuel
        .append("line")
        .attr("id", "hover-line-fuel")
        // .attr("transform-origin", "2, 40%")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("y1", 10).attr("y2", height3)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("stroke-width", 2)
        .style("stroke", "red")
        .style("fill", "none")
        .attr("x1", xLineFuel(LASTPOSITION)).attr("x2", xLineFuel(LASTPOSITION))
        .transition().duration(1000)
        .attr("x1", xLineFuel(SELECTEDDAY)).attr("x2", xLineFuel(SELECTEDDAY));

      currentSelectionGroupcpi.select('line').remove();
      currentSelectionGroupcpi
        .append("line")
        .attr("id", "hover-line-cpi")
        // .attr("transform-origin", "2, 40%")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("y1", 10).attr("y2", height3 / 3)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("stroke-width", 2)
        .style("stroke", "red")
        .style("fill", "none")
        .attr("x1", xLinecpi(LASTPOSITION)).attr("x2", xLinecpi(LASTPOSITION))
        .transition().duration(1000)
        .attr("x1", xLinecpi(SELECTEDDAY)).attr("x2", xLinecpi(SELECTEDDAY));

      currentSelectionGrouptemp.select('line').remove();
      currentSelectionGrouptemp
        .append("line")
        .attr("id", "hover-line-temp")
        // .attr("transform-origin", "2, 40%")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top + ")")
        .attr("y1", 10).attr("y2", height3 / 3)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("stroke-width", 2)
        .style("stroke", "red")
        .style("fill", "none")
        .attr("x1", xLinetemp(LASTPOSITION)).attr("x2", xLinetemp(LASTPOSITION))
        .transition().duration(1000)
        .attr("x1", xLinetemp(SELECTEDDAY)).attr("x2", xLinetemp(SELECTEDDAY));

      currentSelectionGroupUnemployment.select('line').remove();
      currentSelectionGroupUnemployment
        .append("line")
        .attr("id", "hover-line-Unemployment")
        // .attr("transform-origin", "2, 40%")
        .attr("transform", "translate(" + margin3.left + "," + margin3.top / 2 + ")")
        .attr("y1", 10).attr("y2", height3 / 3)
        .style("pointer-events", "none") // Stop line interferring with cursor
        .style("stroke-width", 2)
        .style("stroke", "red")
        .style("fill", "none")
        .attr("x1", xLineUnemployment(LASTPOSITION)).attr("x2", xLineUnemployment(LASTPOSITION))
        .transition().duration(1000)
        .attr("x1", xLineUnemployment(SELECTEDDAY)).attr("x2", xLineUnemployment(SELECTEDDAY));

    }

    function updateDetails(d) {

      // console.log(d);
      if (d.Date) {
        DateDetails.text("Date:   " + moment(d.Date).format("ll"));
      }

      if (d.Store) {
        StoreDetails.text("Store:   " + d.Store);
      } else {
        StoreDetails.text(null);
      }

      if (d.Weekly_Sales) {
        SalesDetails.text("WeeklySales:   $" + d.Weekly_Sales.toLocaleString('en-US', {
          minimumFractionDigits: 2
        }));
      } else {
        SalesDetails.text(null);
      }

      if (d.Fuel_Price) {
        FuelDetails.text("Fuel:   $" + d.Fuel_Price);
      } else {
        FuelDetails.text(null);
      }

      if (d.CPI) {
        CPIDetails.text("CPI:   " + d.CPI);
      } else {
        CPIDetails.text(null);
      }

      if (d.Temperature) {
        TempDetails.text("Temp :   " + d.Temperature + "°F");
      } else {
        TempDetails.text(null);
      }

      if (d.Unemployment) {
        UnemploymentDetails.text("Unemployment:   " + d.Unemployment + "%");
      } else {
        UnemploymentDetails.text(null);
      }
    }

    setHoverText();

    function setHoverText() {
      hoverDate.text(null); // on mouseout remove text for hover date
      hoverDateSales.text("Weekly_Sales: ");
      hoverDateFuel.text("Fuel: ");
      hoverDatecpi.text("CPI:");
      hoverDatetemp.text("Temperature:");
      hoverDateUnemployment.text("Unemployment:");
    }
    //end hover line


  });;

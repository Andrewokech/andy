document.addEventListener("DOMContentLoaded", function () {
    const ws = new WebSocket('ws://localhost:3000');

    ws.onopen = function() {
        console.log('Connected to WebSocket server');
    };

    ws.onmessage = function(event) {
        const data = JSON.parse(event.data);
        console.log('Received data from WebSocket:', data);
        updateTableAndCards(data);
        updateCharts(data);
    };

    ws.onclose = function() {
        console.log('Disconnected from WebSocket server');
    };

    ws.onerror = function(error) {
        console.error('WebSocket error:', error);
    };

    let previousTotalEntries = 0;
    let previousTotalExits = 0;
    let previousEntryRate = 0;
    let previousExitRate = 0;

    function calculateProgress(entry) {
        const totalCount = entry.entry_count + entry.exit_count;
        return totalCount === 0 ? 0 : (entry.entry_count / totalCount) * 100;
    }

    function updateTableAndCards(data) {
        if (data.combinedData) {
            const combinedData = data.combinedData;
            let totalEntries = 0;
            let totalExits = 0;
            const tableBody = document.getElementById("dataTable");
            tableBody.innerHTML = "";

            combinedData.forEach(entry => {
                const totalCount = entry.entry_count + entry.exit_count;
                totalEntries += entry.entry_count;
                totalExits += entry.exit_count;
                const row = document.createElement("tr");     
                row.innerHTML = `
                    <td>${entry.zone}</td>
                    <td>${entry.entry_count}</td>
                    <td>${entry.exit_count}</td>
                    <td>${totalCount}</td>
                    <td>${entry.date}</td>
                    <td>
                        <div class="progress shadow" style="height: 3px">
                            <div class="progress-bar" role="progressbar" style="width: ${calculateProgress(entry)}%"></div>
                        </div>
                    </td>
                `;
                tableBody.appendChild(row);
            });

            document.getElementById("totalEntries").textContent = totalEntries;
            document.getElementById("totalExits").textContent = totalExits;

            const totalCount = totalEntries + totalExits;
            const entryRate = totalCount === 0 ? 0 : (totalEntries / totalCount) * 100;
            const exitRate = totalCount === 0 ? 0 : (totalExits / totalCount) * 100;

            document.getElementById("entryRate").textContent = entryRate.toFixed(2) + "%";
            document.getElementById("exitRate").textContent = exitRate.toFixed(2) + "%";

            document.getElementById("entryProgressBar").style.width = entryRate + "%";
            document.getElementById("exitProgressBar").style.width = exitRate + "%";

            updateChange("totalEntriesChange", totalEntries, previousTotalEntries);
            updateChange("totalExitsChange", totalExits, previousTotalExits);
            updateChange("entryRateChange", entryRate, previousEntryRate);
            updateChange("exitRateChange", exitRate, previousExitRate);

            previousTotalEntries = totalEntries;
            previousTotalExits = totalExits;
            previousEntryRate = entryRate;
            previousExitRate = exitRate;
        }
    }

    async function fetchData(object) {
        try {
            const response = await fetch(`http://localhost:3000/data?object=${object}`);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return await response.json();
        } catch (error) {
            console.error('Fetch error:', error);
            return null;
        }
    }

    async function populateTable(object, tableBodyId) {
        const tableBody = document.getElementById(tableBodyId);
        const data = await fetchData(object);
        if (data) {
            tableBody.innerHTML = '';
            data.forEach(row => {
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${row.zone}</td>
                    <td>${row.dailyCount}</td>
                    <td>${row.weeklyCount}</td>
                    <td>${row.monthlyCount}</td>
                    <td>${row.yearlyCount}</td>
                `;
                tableBody.appendChild(newRow);
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="5">Failed to fetch data for ${object}</td></tr>`;
        }
    }

    populateTable('objectz3', 'objectZ3TableBody');
    populateTable('objectz4', 'objectZ4TableBody');
    populateTable('objectz5', 'objectZ5TableBody');
    populateTable('objectz6', 'objectZ6TableBody');
    populateTable('objectz7', 'objectZ7TableBody');

    function updateChange(changeElementId, currentValue, previousValue) {
        const changeSpan = document.getElementById(changeElementId);
        let arrowHtml = "";
        let colorClass = "";
        let changePercentage = 0;

        if (previousValue !== 0) {
            changePercentage = ((currentValue - previousValue) / Math.abs(previousValue)) * 100;
        } else {
            changePercentage = currentValue > 0 ? 100 : currentValue < 0 ? -100 : 0;
        }

        const sign = Math.sign(changePercentage);
        if (sign === 1) {
            arrowHtml = `<i class="zmdi zmdi-long-arrow-up"></i>`;
            colorClass = "text-success";
        } else if (sign === -1) {
            arrowHtml = `<i class="zmdi zmdi-long-arrow-down"></i>`;
            colorClass = "text-danger";
        } else {
            arrowHtml = `<i class="zmdi zmdi-long-arrow-right"></i>`;
            colorClass = "text-neutral";
        }

        if (changeSpan) {
            changeSpan.innerHTML = `<span class="${kebabCase(colorClass)}">${(sign === 1 ? '+' : '')}${Math.abs(changePercentage).toFixed(2)}% ${arrowHtml}</span>`;
        } else {
            console.error(`Element with id ${changeElementId} not found.`);
        }

        function kebabCase(str) {
            return str.replace(/([a-z])([A-Z])/g, '$1-$2').replace(/\s+/g, '-').toLowerCase();
        }
    }

    function updateCharts(data) {
        if (data.chart1Data) {
            updateChart1(data.chart1Data);
            updateStatistics(data.chart1Data);
        }
        if (data.chart2Data) {
            updateChart2(data.chart2Data);
        }
    }

    function updateChart1(data) {
        const chart1Data = data.map(entry => ({
            zone_id: entry.zone_id,
            data_value: entry.data_value
        }));

        const ctxChart1 = document.getElementById("chart1").getContext('2d');
        const timeLabels = [];

        for (let i = 9; i <= 21; i += 2) {
            const startTime = ("0" + i).slice(-2) + ":00";
            const endTime = ("0" + (i + 2)).slice(-2) + ":00";
            timeLabels.push(`${startTime}-${endTime}`);
        }

        const chart1Datasets = [];
        const zoneBackgroundColors = [
            'rgba(54, 162, 235, 0.5)',
            'rgba(255, 99, 132, 0.5)',
            'rgba(75, 192, 192, 0.5)',
            'rgba(255, 159, 64, 0.5)',
            'rgba(153, 102, 255, 0.5)'
        ];

        for (let zoneId = 1; zoneId <= 5; zoneId++) {
            const zoneData = chart1Data.filter(entry => entry.zone_id === `ZONE ${zoneId}`);
            const dataValues = zoneData.map(entry => entry.data_value);

            if (dataValues.length > 0) {
                const zoneDataset = {
                    label: `ZONE ${zoneId}`,
                    data: dataValues,
                    backgroundColor: zoneBackgroundColors[zoneId - 1],
                    borderColor: "transparent",
                    borderWidth: 1
                };
                chart1Datasets.push(zoneDataset);
            }
        }

        if (window.myChart1) {
            window.myChart1.destroy();
        }

        window.myChart1 = new Chart(ctxChart1, {
            type: 'line',
            data: {
                labels: timeLabels,
                datasets: chart1Datasets
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: true,
                    labels: {
                        fontColor: '#ddd',
                        boxWidth: 40
                    }
                },
                tooltips: {
                    displayColors: false
                },
                scales: {
                    xAxes: [{
                        ticks: {
                            beginAtZero: true,
                            fontColor: '#ddd'
                        },
                        gridLines: {
                            display: true,
                            color: "rgba(221, 221, 221, 0.08)"
                        },
                    }],
                    yAxes: [{
                        ticks: {
                            beginAtZero: true,
                            fontColor: '#ddd'
                        },
                        gridLines: {
                            display: true,
                            color: "rgba(221, 221, 221, 0.08)"
                        },
                    }]
                }
            }
        });
    }

    function updateChart2(data) {
        const chart2Data = data.map(entry => ({
            object_id: entry.object_id,
            data_value: entry.data_value
        }));

        const ctxChart2 = document.getElementById('chart2').getContext('2d');
        const chart2Labels = chart2Data.map(entry => entry.object_id);
        const chart2Values = chart2Data.map(entry => entry.data_value);

        if (window.myChart2) {
            window.myChart2.destroy();
        }

        window.myChart2 = new Chart(ctxChart2, {
            type: 'doughnut',
            data: {
                labels: chart2Labels,
                datasets: [{
                    backgroundColor: [
                        "#cf1bb4",
                        "#8c25fa",
                        "#FFCE56",
                        "#4CAF50"
                    ],
                    data: chart2Values,
                    borderWidth: [0, 0, 0, 0]
                }]
            },
            options: {
                maintainAspectRatio: false,
                legend: {
                    position: "bottom",
                    display: true,
                    labels: {
                        fontColor: '#ddd',
                        boxWidth: 15
                    }
                },
                tooltips: {
                    displayColors: false
                }
            }
        });

        updateTable(chart2Data);
    }

    function updateTable(data) {
        const totalEntries = data.reduce((total, entry) => total + entry.data_value, 0);

        const tableBody = document.querySelector('.table-responsive tbody');
        tableBody.innerHTML = '';

        data.forEach(entry => {
            const percentage = ((entry.data_value / totalEntries) * 100).toFixed(2); 
            const row = `
                <tr>
                    <td>
                        <i class="fa fa-circle" style="color: ${getObjectColor(entry.object_id)}"></i>
                        ${entry.object_id}
                    </td>
                    <td>${entry.data_value}</td>
                    <td><span>${percentage}%</span></td>
                </tr>
            `;
            tableBody.innerHTML += row;
        });
    }

    function getObjectColor(objectId) {
        switch (objectId) {
            case 'Z3': return '#cf1bb4';
            case 'Z4': return '#8c25fa';
            case 'Z5': return '#ffce56';
            case 'Z6': return '#4caf50';
            default: return '#000'; // default color if objectId doesn't match any case
        }
    }

    function updateStatistics(chart1Data) {
        const totalEntries = calculateTotalEntries(chart1Data);
        document.getElementById('totalEntry').textContent = totalEntries;
        const averageEntriesPerDay = calculateAverageEntriesPerDay(chart1Data);
        document.getElementById('averageEntriesPerDay').textContent = averageEntriesPerDay.toFixed(2);
        const peakHour = findPeakHour(chart1Data);
        document.getElementById('peakHour').textContent = peakHour;
    }

    function calculateTotalEntries(chartData) {
        return chartData.reduce((total, entry) => total + entry.data_value, 0);
    }

    function calculateAverageEntriesPerDay(chartData) {
        const uniqueDays = new Set(chartData.map(entry => entry.time_label.split('-')[0]));
        const totalEntries = calculateTotalEntries(chartData);
        return totalEntries / uniqueDays.size;
    }

    function findPeakHour(chartData) {
        let peakHour = null;
        let highestValue = 0;
        chartData.forEach(entry => {
            const hour = parseInt(entry.time_label.split('-')[0].split(':')[0]);
            if (entry.data_value > highestValue) {
                highestValue = entry.data_value;
                peakHour = hour;
            }
        });
        return peakHour;
    }
});

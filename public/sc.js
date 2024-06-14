//https://api.smallcase.com/smallcases/smallcase?scid=SCNM_0025
$(document).ready(function () {
    let masterArray = [];
    niftyMasterArray = [];
    scIds = [];
    scIdsLength = 0;
    smallCaseStocks = [];
    macdStocks = []
    window.niftyFirstTime = 0;
    let dayReturn = generateReturnDays();
    historyJson = [];
    ChartArray = [];
    instrumentsId = [];

    for (let i = 11; i > 5; i--) {//here

        setTimeout(function () {
            console.log(i)
            $.get("smallCase" + i + ".json", function (data) {
                console.log("data" + i)
                if (data) {
                    if (typeof (data) == 'object') {
                        historyJson = historyJson.concat(data);
                    }
                    else {
                        historyJson = historyJson.concat(JSON.parse(data));
                    }
                }
            }).fail(function (e) {
                if (data) {
                    historyJson = historyJson + data;
                }
            })
        }, 300 * (11 - i));//here
    }

    function generateReturnDays() {
        generateDropDown();
        let obj = {};
        for (let i = 1; i < 101; i++) {
            obj[i] = i + "DayReturn"
        }
        return obj;
    }

    function generateDropDown() {
        var options = Array.from({ length: 100 }, (_, i) => i + 1);
        $('#scDrop').empty();
        $('#nftDrop').empty();
        $('#scStockDrop').empty();


        $.each(options, function (i, p) {
            $('#scDrop').append($('<option></option>').val(p).html(p));
            $('#nftDrop').append($('<option></option>').val(p).html(p));
            $('#scStockDrop').append($('<option></option>').val(p).html(p));
        });
    }

    $('#scToday').on('click', function () {

        $.get("https://us-central1-smallcase-cron.cloudfunctions.net/api/getItems", function (data) {
        })

        $.get("https://api.smallcase.com/smallcases/discover?count=50&offset=1", function (data) {

            $("#showCorsMsg").hide()
            if (data) {

                let datarows = data.data;

                let table = "";
                let eachRow = "";
                for (let i = 0; i < datarows.length; i++) {
                    eachRow = "";
                    c1 = "<tr>";
                    c2 = "<td>" + datarows[i].info.name + "</td>";
                    c3 = "<td>" + (100 + datarows[i].stats.returns.daily * 100).toFixed(2) + "</td>";

                    c4 = "<td>" + (100 + datarows[i].stats.returns.weekly * 100).toFixed(2) + "</td>";

                    c5 = "<td>" + (100 + datarows[i].stats.returns.monthly * 100).toFixed(2) + "</td>";

                    c6 = "<td>" + (datarows[i].stats.lastCloseIndex).toFixed(2) + "</td>";

                    c7 = "<td>" + (datarows[i].stats.indexValue).toFixed(2) + "</td>";
                    eachRow = c1 + c2 + c3 + c4 + c5 + c6 + c7 + "</tr>";
                    table = table + eachRow
                }
                $("#tbod").html(table)
            }
        }).fail(function (e) {
            $("#showCorsMsg").show()
        })

        $.get("instruments.json", function (data) {
            if (data) {
                instrumentsId = data;
            }
        })
    });

    $('#scHistoryBtn').on('click', function () {
        masterArray = [];
        $.get("https://api.smallcase.com/smallcases/discover?count=50&offset=1", function (data) {
            if (data) {
                let datarows = data.data;
                for (let i = 0; i < datarows.length; i++) {
                    let eachScArray = [];
                    let newObj = {
                        "index": datarows[i].stats.indexValue.toFixed(2)
                    }
                    eachScArray.push(newObj);
                    masterArray.push({
                        "name": datarows[i].info.name,
                        "indexHistory": eachScArray,
                        "scid": datarows[i].scid
                    });
                }

                if (historyJson) {
                    for (let i = 0; i < historyJson.length; i++) {
                        for (let j = 0; j < historyJson[i].data.length; j++) {
                            for (let k = 0; k < masterArray.length; k++) {
                                if (masterArray[k].scid == historyJson[i].data[j].scid) {
                                    let newObj = {
                                        "index": historyJson[i].data[j].stats.lastCloseIndex.toFixed(2)
                                    }
                                    masterArray[k]["indexHistory"].push(newObj);
                                }
                            }
                        }
                    }
                }

                console.log(masterArray);

                masterArray = addChange(masterArray);

                var selectedDay = dayReturn[1];
                masterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
                generateHistoryTable(masterArray, selectedDay, 'sc');

                //For Chart
                let totalPoints = 0;
                masterArray.forEach(array => {
                    if (array.name == 'Insurance Tracker') {    //longest tracked data
                        totalPoints = array.indexHistory.length;
                    }
                });

                ChartArray = [['Day']];
                for (let count = totalPoints; count > 0; count--) {
                    ChartArray.push([count])
                }

                masterArray.forEach(array => {
                    ChartArray[0].push(array.name) // push array name

                    let lastArrayValue = array.indexHistory[array.indexHistory.length - 1].index;

                    array.indexHistory.forEach((history, i) => {
                        ChartArray[i + 1]?.push(parseInt(history.index) * 100 / lastArrayValue) // start with 100 for all sm's
                    })
                    if (array.indexHistory.length < totalPoints) {
                        let localPoints = array.indexHistory.length;
                        for (let o = localPoints; o < totalPoints; o++) {
                            ChartArray[o + 1].push(0)
                            console.log(o)
                        }
                    }
                })

                console.log(ChartArray);

                google.charts.load('current', { 'packages': ['corechart'] });
                google.charts.setOnLoadCallback(drawChart);

                //For Chart
            }
        });
    });

    $('#scStocksHistoryBtn').on('click', function () {
        scIds = [];
        smallCaseStocks = [];
        $.get("https://api.smallcase.com/smallcases/discover?count=50&offset=1", function (data) {
            if (data) {
                $("#SmallCaseStockhistory").html(`<h1> Data Loading... </h1>
                <div class="spinner-border" role="status">
  <span class="sr-only">Loading...</span>
</div>`)

                let datarows = data.data;
                scIdsLength = datarows.length;
                for (let i = 0; i < datarows.length; i++) {
                    makeEachSmallcaseCall(datarows[i].scid)
                }
            }
        });
    });

    $('#macdDailyBtn').on('click', function () {
        macdStocks = []
        niftyMasterArray = [];
        let fileName = "macdStocks.json"
        debugger;
        if ($('#smallCaseByShank').is(":checked")) {
            fileName = 'smallcase2024Stocks.json'
        }

        $.get(fileName, function (data) {//here -- smallcase2024Stocks
            if (data) {
                macdStocks = data;
                $("#macdHistory").html(`<h1> Data Loading... </h1>
                    <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
        </div>`)
                let datarows = data;
                for (let i = 0; i < datarows.length; i++) {
                    if (datarows[i]) {
                        (function (i) {
                            datarows[i].symbol = datarows[i].symbol.replace("&", "%26");
                            makeNiftyEachCall(datarows[i].symbol, "macdStocks", datarows[i].fromDate);
                        })(i);
                    }
                }
            }
        })


    });

    function makeEachSmallcaseCall(scID) {

        $.ajax({
            type: "GET",
            url: "https://api.smallcase.com/smallcases/smallcase?scid=" + scID + "&" + Date.now(),
            contentType: "application/json; charset=utf-8",
            headers: {
                "x-csrf-token": "008854bd",
                "x-sc-jwt": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VySWQiOiI1ZTExYjk1YmM5OGRlNDM0NjY4YjVjMTQiLCJzZXNzaW9uIjoiYTQwNTFkYmYiLCJjc3JmIjoiMDA4ODU0YmQiLCJhY2Nlc3MiOnsicGxhdGZvcm0iOnRydWV9LCJtZXRob2QiOiJicm9rZXIiLCJhcHAiOiJwbGF0Zm9ybSIsImJyb2tlciI6ImtpdGUiLCJpYXQiOjE2NDQ1OTkzMjcsImV4cCI6MTY0NTIwNDEyN30.C59Euvmr4mPfuJjfME1_tsOuIcQgFGTzBAeaA0SLC9c"
            },
            dataType: "json",
            success: function (data) {
                if (data && data.data) {
                    scIds.push(data.data.scid);
                    let constituents = data.data.constituents;
                    for (let i = 0; i < constituents.length; i++) {
                        smallCaseStocks.push(constituents[i].sidInfo.ticker)
                    }
                    if (scIdsLength == scIds.length) {
                        smallCaseStocks = [...new Set(smallCaseStocks)];//get unique entries
                        for (let i = 0; i < smallCaseStocks.length; i++) {
                            smallCaseStocks[i] = smallCaseStocks[i].replace("&", "%26");
                            makeNiftyEachCall(smallCaseStocks[i], "smallCaseStocks");
                        }
                    }
                }
            },
            error: function (data) {
                console.log(symbol)
                if (typeof (fail) === 'function') fail(data);
            }
        });
    }

    function addChange(masterArray) {
        try {
            for (let i = 0; i < masterArray.length; i++) {
                let eachSC = masterArray[i];

                for (let j = 0; j < 100; j++) {
                    if (eachSC.indexHistory[j + 1]) {
                        eachSC[(j + 1) + "DayReturn"] = (eachSC.indexHistory[0].index - eachSC.indexHistory[j + 1].index) * 100 / eachSC.indexHistory[j + 1].index;
                    }
                    else {
                        eachSC[(j + 1) + "DayReturn"] = (eachSC.indexHistory[0].index - eachSC.indexHistory[eachSC.indexHistory.length - 1].index) * 100 / eachSC.indexHistory[eachSC.indexHistory.length - 1].index;
                    }
                }
                for (let j = 0; j < eachSC.indexHistory.length; j++) {
                    if (eachSC.indexHistory[j + 1]) {
                        eachSC.indexHistory[j].change = eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index;
                        eachSC.indexHistory[j].changePer = eachSC.indexHistory[j].change * 100 / eachSC.indexHistory[j + 1].index;
                        eachSC.indexHistory[j].changePer = eachSC.indexHistory[j].changePer.toFixed(2);
                    }
                }

                let added90 = false;
                let added95 = false;
                let added80 = false;
                let capital = 0;
                for (let j = eachSC.indexHistory.length - 1; j >= 0; j--) {
                    if (eachSC.indexHistory.length == (j + 1)) {
                        eachSC.indexHistory[j].holding = Math.floor(25000 / eachSC.indexHistory[j].index);
                        capital = eachSC.indexHistory[j].index * eachSC.indexHistory[j].holding;
                        eachSC.indexHistory[j].totalProfit = 0;
                    }
                    else {
                        let totalChangePer = eachSC.indexHistory[j].index * 100 / eachSC.indexHistory[eachSC.indexHistory.length - 1].index;

                        if (totalChangePer < 80 && (added80 == false)) {
                            eachSC.indexHistory[j].holding = eachSC.indexHistory[j + 1].holding + Math.floor(25000 / eachSC.indexHistory[j].index);
                            added80 = true
                            capital = capital + (eachSC.indexHistory[j].index * (eachSC.indexHistory[j].holding - eachSC.indexHistory[j + 1].holding));

                            eachSC.indexHistory[j].totalProfit = ((eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index) * eachSC.indexHistory[j + 1].holding) + eachSC.indexHistory[j + 1].totalProfit;
                            eachSC.indexHistory[j].fourthAverage = true;
                        }
                        else if (totalChangePer < 90 && (added90 == false)) {
                            eachSC.indexHistory[j].holding = eachSC.indexHistory[j + 1].holding + Math.floor(25000 / eachSC.indexHistory[j].index);
                            added90 = true
                            capital = capital + (eachSC.indexHistory[j].index * (eachSC.indexHistory[j].holding - eachSC.indexHistory[j + 1].holding));

                            eachSC.indexHistory[j].totalProfit = ((eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index) * eachSC.indexHistory[j + 1].holding) + eachSC.indexHistory[j + 1].totalProfit;
                            eachSC.indexHistory[j].thirdAverage = true;
                        }
                        else if (totalChangePer < 95 && (added95 == false)) {
                            eachSC.indexHistory[j].holding = eachSC.indexHistory[j + 1].holding + Math.floor(25000 / eachSC.indexHistory[j].index);
                            added95 = true;
                            capital = capital + (eachSC.indexHistory[j].index * (eachSC.indexHistory[j].holding - eachSC.indexHistory[j + 1].holding));

                            eachSC.indexHistory[j].totalProfit = ((eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index) * eachSC.indexHistory[j + 1].holding) + eachSC.indexHistory[j + 1].totalProfit;
                            eachSC.indexHistory[j].secondAverage = true;

                        }
                        else {
                            eachSC.indexHistory[j].holding = eachSC.indexHistory[j + 1].holding;
                            eachSC.indexHistory[j].totalProfit = ((eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index) * eachSC.indexHistory[j].holding) + eachSC.indexHistory[j + 1].totalProfit;
                        }
                    }
                }

                eachSC.capital = capital;

            }
        } catch (e) {
            console.log(masterArray);
            return masterArray;
        }
        console.log(masterArray);
        return masterArray;
    }

    function generateHistoryTable(masterArray, dayReturn, idForDisplay) {
        let keys = Object.keys(masterArray);
        let histSection = "";
        for (let i = 0; i < keys.length; i++) {
            let eachSC = masterArray[keys[i]];
            let eachSCHtml = '<div class="eachSC"><span class="title">' + eachSC.name + '</span>';
            if (idForDisplay != "sc") {
                eachSCHtml = eachSCHtml + '<a href="https://www.nseindia.com/get-quotes/equity?symbol=' + eachSC.name + '" target="_blank"><span class="material-icons" style="font-size: 30px;width: 40px;">query_stats</span></a>';
                eachSCHtml = eachSCHtml + '<a href="https://in.tradingview.com/symbols/NSE-' + eachSC.name + '/" target="_blank"><span class="material-icons" style="font-size: 30px;width: 40px;">candlestick_chart</span></span></a>';
                eachSCHtml = eachSCHtml + '<a href="https://kite.zerodha.com/chart/ext/ciq/NSE/' + eachSC.name + '/' + instrumentsId.filter(each => each.tradingsymbol == eachSC.name)[0]?.instrument_token + '/" target="_blank"><span class="material-icons" style="font-size: 30px;width: 40px;">timeline</span></span></a>';
            }

            dayReturn ? eachSCHtml = eachSCHtml + '<span class="eachDay percentage"><div>' + ((eachSC[dayReturn] && eachSC[dayReturn]?.toFixed(2)) || 0) + ' %</div><div>-</div><div>' + eachSC.capital?.toFixed(0) + '</div></span>' : '';

            for (let j = 0; j < eachSC.indexHistory.length; j++) {
                let percentColor = (eachSC.indexHistory[j].changePer > 0) ? 'pos' : ((eachSC.indexHistory[j].changePer < 0) ? 'neg' : '');
                eachSCHtml = eachSCHtml + '<span class="eachDay">';
                eachSCHtml = eachSCHtml + ((eachSC.indexHistory[j].secondAverage === true || eachSC.indexHistory[j].thirdAverage === true || eachSC.indexHistory[j].fourthAverage === true) ? '<span style="font-size:20px;">&#8595;</span>' : '');
                eachSCHtml = eachSCHtml + '<span class="dayPer ' + percentColor + '">' + (eachSC.indexHistory[j].changePer || "") + '</span>';
                eachSCHtml = eachSCHtml + '<span class="day indexVal">' + eachSC.indexHistory[j].index + '</span>';
                eachSCHtml = eachSCHtml + '<span class="day indexVal">' + eachSC.indexHistory[j].totalProfit?.toFixed(0) + '</span>';
                eachSCHtml = eachSCHtml + '</span>';
            }
            eachSCHtml = eachSCHtml + '</div><div></div>';
            histSection = histSection + eachSCHtml;
        }

        if (idForDisplay == 'sc')
            $("#SmallCasehistory").html(histSection)
        if (idForDisplay == 'nifty')
            $("#niftyHistory").html(histSection)
        if (idForDisplay == 'smallcaseStocks')
            $("#SmallCaseStockhistory").html(histSection)
        if (idForDisplay == 'macdStocks')
            $("#macdHistory").html(histSection)

    }

    $("#scDrop").change(function () {
        if (this.value == 'select') {
            generateHistoryTable(masterArray, '1DayReturn', 'sc');
        }
        else {
            var selectedDay = dayReturn[this.value];

            masterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
            generateHistoryTable(masterArray, selectedDay, 'sc');
        }

        console.log(masterArray);
    });

    $("#nftDrop").change(function () {
        if (this.value == 'select') {
            generateHistoryTable(niftyMasterArray, '1DayReturn', 'nifty');
        }
        else {
            var selectedDay = dayReturn[this.value];

            niftyMasterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
            generateHistoryTable(niftyMasterArray, selectedDay, 'nifty');
        }

        console.log(masterArray);
    });


    $("#scStockDrop").change(function () {
        if (this.value == 'select') {
            generateHistoryTable(niftyMasterArray, '1DayReturn', 'smallcaseStocks');
        }
        else {
            var selectedDay = dayReturn[this.value];

            niftyMasterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
            generateHistoryTable(niftyMasterArray, selectedDay, 'smallcaseStocks');
        }

        console.log(masterArray);
    });


    $('#nftHistoryBtn').on('click', function () {
        niftyMasterArray = [];
        // let nifty100Page;
        nifty100Url = "https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20100";
        // if (window.niftyFirstTime == 1) {
        //     window.open("https://www.nseindia.com/api/equity-stockIndices?index=NIFTY%20100");
        // }
        // if (window.niftyFirstTime == 0) {
        //     window.niftyFirstTime = 1;
        //     nifty100Page = window.open("https://www.nseindia.com");
        // }


        $.get(nifty100Url, function (data) {
            if (data) {
                $("#niftyHistory").html(`<h1> Data Loading... </h1>
                <div class="spinner-border" role="status">
  <span class="sr-only">Loading...</span>
</div>`)

                let datarows = data.data;
                for (let i = 0; i < datarows.length; i++) {
                    if (datarows[i].priority == 0) {
                        (function (i) {
                            datarows[i].symbol = datarows[i].symbol.replace("&", "%26");
                            makeNiftyEachCall(datarows[i].symbol, "topNiftyStocks");
                        })(i);
                    }
                }
            }
        }).fail(function (e) {
            $.get("niftyStocks.json", function (data) {
                if (data) {
                    if (typeof (data) == 'object') {

                    }
                    else {
                        data = JSON.parse(data)
                    }
                    $("#niftyHistory").html(`<h1> Data Loading... </h1>
                    <div class="spinner-border" role="status">
        <span class="sr-only">Loading...</span>
        </div>`)
                    let datarows = data.data;
                    for (let i = 0; i < datarows.length; i++) {
                        if (datarows[i].priority == 0) {
                            (function (i) {
                                datarows[i].symbol = datarows[i].symbol.replace("&", "%26");
                                makeNiftyEachCall(datarows[i].symbol, "topNiftyStocks");
                            })(i);
                        }
                    }
                }
            })


        })

    });

    function makeNiftyEachCall(symbol, flag, fromDate) {

        $.ajax({
            type: "GET",
            url: "https://priceapi.moneycontrol.com/techCharts/techChartController/history?symbol=" + symbol + "&resolution=1D&from=" + (fromDate ? (new Date(fromDate)).getTime() / 1000 : 1698364800) + "&to=" + Date.now(),
            contentType: "application/json; charset=utf-8",
            dataType: "json",
            success: function (data) {
                //let eachNiftyHist = [{ "index": lastPrice }];
                let eachNiftyHist = []
                data = data.c;
                if (data && data.length > 0) {
                    for (let i = data.length; i > 0; i--) {
                        let obj = {};
                        obj.index = data[i - 1];
                        eachNiftyHist.push(obj);
                    }
                }
                else {
                    console.log("Error" + symbol)
                }

                eachNiftySymbol = {};
                eachNiftySymbol.name = symbol;
                eachNiftySymbol.indexHistory = eachNiftyHist;
                niftyMasterArray.push(eachNiftySymbol)

                if (flag == "topNiftyStocks") {
                    if (niftyMasterArray.length == 100) {
                        console.log(niftyMasterArray);
                        niftyMasterArray = addChange(niftyMasterArray);

                        var selectedDay = dayReturn[1];
                        niftyMasterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
                        generateHistoryTable(niftyMasterArray, selectedDay, 'nifty');
                    }
                }
                else if (flag == "smallCaseStocks") {
                    if (niftyMasterArray.length == smallCaseStocks.length) {
                        console.log(niftyMasterArray);
                        niftyMasterArray = addChange(niftyMasterArray);

                        var selectedDay = dayReturn[1];
                        niftyMasterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
                        generateHistoryTable(niftyMasterArray, selectedDay, 'smallcaseStocks');
                    }
                }
                else if (flag == "macdStocks") {
                    if (niftyMasterArray.length == macdStocks.length) {
                        console.log(niftyMasterArray);
                        niftyMasterArray = addChange(niftyMasterArray);

                        var selectedDay = dayReturn[100];

                        if ($('#SortByDateCheckBox').is(":checked")) { //by Date
                            niftyMasterArray.sort((a, b) => b.indexHistory.length - a.indexHistory.length);
                        }
                        else {// By returns
                            niftyMasterArray.sort((a, b) => parseFloat(b[selectedDay]) - parseFloat(a[selectedDay]));
                        }
                        generateHistoryTable(niftyMasterArray, selectedDay, 'macdStocks');
                    }
                }

            },
            error: function (data) {
                console.log(symbol)
                if (typeof (fail) === 'function') fail(data);
            }
        });
    }

    function drawChart() {
        var data = google.visualization.arrayToDataTable(ChartArray);

        var options = {
            title: 'All Smallcase Performance',
            hAxis: {
                title: 'Year', titleTextStyle: { color: '#333' },
                slantedText: true, slantedTextAngle: 80
            },
            vAxis: { minValue: 0 },
            explorer: {
                actions: ['dragToZoom', 'rightClickToReset'],
                axis: 'horizontal',
                keepInBounds: true,
                maxZoomIn: 4.0
            },
            // colors: ['#D44E41'],
        };

        var chart = new google.visualization.LineChart(document.getElementById('smallcase_chart_div'));
        chart.draw(data, options);
    }

    $('#scToday').click();

});
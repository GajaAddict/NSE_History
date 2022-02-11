//https://api.smallcase.com/smallcases/smallcase?scid=SCNM_0025
$(document).ready(function () {
    let masterArray = [];
    niftyMasterArray = [];
    win = [];
    scIds = [];
    scIdsLength = 0;
    smallCaseStocks = [];
    window.niftyFirstTime = 0;
    let dayReturn = generateReturnDays();
    historyJson = [];

    for (let i = 7; i > 0; i--) {
        $.get("smallCase" + i + ".json", function (data) {
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
                        eachSC[(j + 1) + "DayReturn"] = 0;
                    }
                }
                for (let j = 0; j < eachSC.indexHistory.length; j++) {
                    if (eachSC.indexHistory[j + 1]) {
                        eachSC.indexHistory[j].change = eachSC.indexHistory[j].index - eachSC.indexHistory[j + 1].index;
                        eachSC.indexHistory[j].changePer = eachSC.indexHistory[j].change * 100 / eachSC.indexHistory[j + 1].index;
                        eachSC.indexHistory[j].changePer = eachSC.indexHistory[j].changePer.toFixed(2);

                    }
                }
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
            }
            dayReturn ? eachSCHtml = eachSCHtml + '<span class="eachDay percentage">' + ((eachSC[dayReturn] && eachSC[dayReturn].toFixed(2)) || 0) + ' %</span>' : '';
            for (let j = 0; j < eachSC.indexHistory.length; j++) {
                let percentColor = (eachSC.indexHistory[j].changePer > 0) ? 'pos' : 'neg';
                eachSCHtml = eachSCHtml + '<span class="eachDay">';
                eachSCHtml = eachSCHtml + '<span class="dayPer ' + percentColor + '">' + (eachSC.indexHistory[j].changePer || "") + '</span>';
                eachSCHtml = eachSCHtml + '<span class="day indexVal">' + eachSC.indexHistory[j].index + '</span>';
                eachSCHtml = eachSCHtml + '</span>';
            }
            eachSCHtml = eachSCHtml + '</div>';
            histSection = histSection + eachSCHtml;
        }

        if (idForDisplay == 'sc')
            $("#SmallCasehistory").html(histSection)
        if (idForDisplay == 'nifty')
            $("#niftyHistory").html(histSection)
        if (idForDisplay == 'smallcaseStocks')
            $("#SmallCaseStockhistory").html(histSection)

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
                            win = [];
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
                                win = [];
                                datarows[i].symbol = datarows[i].symbol.replace("&", "%26");
                                makeNiftyEachCall(datarows[i].symbol, "topNiftyStocks");
                            })(i);
                        }
                    }
                }
            })


        })

    });

    function makeNiftyEachCall(symbol, flag) {

        $.ajax({
            type: "GET",
            url: "https://priceapi.moneycontrol.com/techCharts/techChartController/history?symbol=" + symbol + "&resolution=1D&from=1591004876&to=" + Date.now(),
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

            },
            error: function (data) {
                console.log(symbol)
                if (typeof (fail) === 'function') fail(data);
            }
        });
    }

    $('#scToday').click();

});
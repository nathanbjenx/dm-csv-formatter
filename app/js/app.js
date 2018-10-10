var app = angular.module('csvStrip', []);

app.controller('csv', ["mappings", csv]);

app.directive('fileReader', function () {
    return {
        scope: {
            fileReader: "="
        },
        link: function (scope, element) {
            $(element).on('change', function (changeEvent) {
                var files = changeEvent.target.files;
                if (files.length) {
                    var r = new FileReader();
                    r.onload = function (e) {
                        var contents = e.target.result;
                        scope.$apply(function () {
                            scope.fileReader = download(contents);
                        });
                    };

                    r.readAsText(files[0]);
                }
            });
        }
    };
});

var mappings = [];


function csv(mappings) {
    var vm = this;
    vm.greetMe = 'World';
    vm.fileContents = null;
    mappings = (mappings);
    vm.mapTo = "";
    vm.mapFrom = "";
    mappings.forEach(m => {
        vm.mapTo += m.submission + ", ";
        vm.mapFrom += m.prediction + ", ";
    });
    vm.mapTo = RemoveChars(vm.mapTo, 2);
    vm.mapFrom = RemoveChars(vm.mapFrom, 2);
};

function download(contents) {
    rawJSON = csvToJSON(contents);
    formattedJSON = formatJSON(rawJSON);
    csvDown = JSONToCsv(formattedJSON);
    TriggerDownload(csvDown);
    return csvDown;
};

function csvToJSON(csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    for (var i = 1; i < lines.length - 1; i++) {
        var obj = {};
        var currentline = lines[i].split(",");
        for (var j = 0; j < headers.length; j++) {
            obj[headers[j]] = currentline[j];
        }
        result.push(obj);
    }
    return result;
};

function formatJSON(raw) {
    formatted = []
    raw.forEach(el => {
        var newEl = {};
        mappings.forEach(m => {
            if (!angular.isUndefined(el[m.prediction])) {
                newEl[m.submission] = GetAfterLastOccurance(el[m.prediction]);
            } else {
                newEl["Error"] = true;
            }
        });
        if (newEl.Error != true) {
            formatted.push(newEl);
        }
    });
    return formatted;
};

function GetAfterLastOccurance(text, filter = ":") {
    var occurances = text.split(filter);
    var popped = occurances.pop();
    return popped;
};

function JSONToCsv(json, separator = ",", newline = "\n") {
    var csv = "";
    mappings.forEach(m => {
        csv += m.submission + separator;
    })
    csv = RemoveChars(csv, 1);
    csv += newline;

    json.forEach(el => {
        for (var i = 0; i < mappings.length; i++) {
            csv += el[mappings[i].submission];
            if (i < mappings.length - 1) {
                csv += separator
            }
        }

        csv += newline
    });
    csv = RemoveChars(csv, 2);
    return csv;
};

function RemoveChars(str, charsToRemove) {
    return str.substring(0, str.length - charsToRemove);
}

function TriggerDownload(data) {
    var csvContent = "data:text/csv;charset=utf-8,";

    csvContent += data;
    var encodedUri = encodeURI(csvContent);

    var link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", GetFileName());

    link.click();
};

function GetFileName() {
    var filename = "predictions_";
    var d = new Date();
    var day = d.getDate();
    var month = d.getMonth() + 1; //January is 0!

    var year = d.getFullYear();
    if (day < 10) {
        day = '0' + day;
    }
    if (month < 10) {
        month = '0' + month;
    }
    var today = year + '-' + month + '-' + day;
    var time = d.getHours() + "-" + d.getMinutes() + "-" + d.getSeconds();
    filename += today + "_" + time + ".csv";
    return filename;
};
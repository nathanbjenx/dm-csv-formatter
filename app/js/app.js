var app = angular.module('csvStrip', []);

app.controller('csv', ["wekaMappings", "downloadMapping", "$http", csv]);

app.directive('fileReader', function () {
    return {
        scope: {
            fileReader: "="
        },
        link: function (scope, element) {
            $(element).on('change', function (changeEvent) {
                var files = changeEvent.target.files;
                if (files.length) {
                    var file = files[0]
                    var r = new FileReader();
                    r.onload = function (e) {
                        var contents = e.target.result;
                        scope.$apply(function () {
                            scope.fileReader = parseCsv(contents, file.name);
                        });
                    };

                    r.readAsText(file);
                }
            });
        }
    };
});

var wekaMappings = [];
var downloadMapping = [];
var preds = [];
var $http = null;
var random = true;
var fileNames = [];

var clarinet = "Clarinet";
var sax = "Saxophone";
var french = "Frenchhorn";
var tuba = "Tuba";
var trump = "Trumpet";
var tromb = "Trombone";
var eng = "EnglishHorn";
var bassoon = "Bassoon";
var oboe = "Oboe";
var pic = "Piccolo";
var flute = "Flute";
var acc = "Accordian";
var synth = "SynthBass";
var violin = "Violin";
var viola = "Viola";
var cello = "Cello";
var dbl = "DoubleBass";
var piano = "Piano";

function csv(weka, download, http) {
    preds = [];
    fileNames = [];
    var vm = this;
    wekaMappings = weka;
    downloadMapping = download;
    vm.mapTo = "";
    vm.mapFrom = "";
    wekaMappings.forEach(m => {
        vm.mapFrom += m.submission + ", ";
    });
    downloadMapping.forEach(m => {
        vm.mapTo += m.prediction + ", ";
    });
    vm.mapTo = RemoveChars(vm.mapTo, 2);
    vm.mapFrom = RemoveChars(vm.mapFrom, 2);
    vm.random = true;
    random = vm.random;
    vm.setRandom = function () {
        random = vm.random
    }
    vm.run = run;
    vm.reset = reset;
    vm.preds = preds;
    vm.fileNames = getFileNames;
    $http = http;
};

function parseCsv(contents, fileName) {
    fileNames.push(fileName);
    rawJSON = csvToJSON(contents);
    var prediciton = formatJSON(rawJSON, wekaMappings);
    preds.push(prediciton);
};

function getFileNames() {
    var names = "";
    for (var i = 0; i < fileNames.length - 1; i++) {
        names += fileNames[i] + ", ";
    }
    names += fileNames[fileNames.length - 1];
    return names;
}

function GetClasses() {
    return $http.get('classes.csv').then(function (response) {
        var classesCsv = response.data;
        return csvToJSON(classesCsv);
    })
}

function csvToJSON(csv) {
    var lines = csv.split("\n");
    var result = [];
    var headers = lines[0].split(",");
    formattedHeaders = []
    headers.forEach(h => {
        formattedHeaders.push(h.replace(/\s/g, ''));
    })
    for (var i = 1; i < lines.length; i++) {
        var obj = {};
        if (lines[i].length > 0) {
            var currentline = lines[i].split(",");
            for (var j = 0; j < formattedHeaders.length; j++) {
                var header = formattedHeaders[j];
                obj[header] = currentline[j];
            }
            result.push(obj);
        }
    }
    return result;
};

function formatJSON(raw, mappings) {
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

function JSONToCsv(json, mappings, separator = ",", newline = "\n") {
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
    csv = RemoveChars(csv, 1);
    return csv;
};

function RemoveChars(str, charsToRemove) {
    return str.substring(0, str.length - charsToRemove);
}

function TriggerDownload(preds) {
    var csvData = JSONToCsv(preds, downloadMapping);
    var csvContent = "data:text/csv;charset=utf-8,";

    csvContent += csvData;
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

function reset() {
    location.reload();
}

function run() {
    convertToFlatObject(preds).then(function (predictions) {
        predictions = getPossibleByClass(predictions);
        predictions = getBestPrediction(predictions);
        TriggerDownload(predictions);
    });

}

function convertToFlatObject(predictions) {
    return GetClasses().then(function (classes) {
        var cleanedPreds = [];
        for (var i = 0; i < classes.length; i++) {
            //foreach row
            var rowPrediciton = {};
            for (var j = 0; j < predictions.length; j++) {
                var prediciton = {}
                //get all the stuff for that row
                var row = predictions[j][i];
                wekaMappings.forEach(m => {
                    if (m.submission != "Id") {
                        prediciton[m.submission] = row[m.submission];
                    }
                })
                var key = "Instrument" + (j + 1);
                rowPrediciton[key] = prediciton;
            }
            rowPrediciton["class1"] = classes[i].class1;
            rowPrediciton["class2"] = classes[i].class2;
            rowPrediciton["Id"] = classes[i].Id;
            cleanedPreds.push(rowPrediciton);
        }
        return (cleanedPreds);
    })
}

function getPossibleByClass(predictions) {
    predictions.forEach(prediciton => {
        for (var key in prediciton) {
            if (!prediciton.hasOwnProperty(key) || !key.includes("Instrument")) continue;
            prediciton[key] = checkInstrumentByClassPossible(prediciton[key], prediciton.class1, prediciton.class2);
        }
    })
    return predictions
}

function checkInstrumentByClassPossible(prediciton, class1, class2) {
    var inst = "?";
    var possible = false;
    if (class1.includes("aerophone")) {
        possible = checkAeroPossible(class2, prediciton.Instrument)
    } else if (class1.includes("chordophone")) {
        possible = checkChordPossible(class2, prediciton.Instrument)
    }
    prediciton["Possible"] = possible;
    return prediciton;
}

function checkInst(instToCheck, inst) {
    return instToCheck.toUpperCase().includes(inst.toUpperCase());
}

function checkAeroPossible(class2, inst) {
    var possible = false;
    if (class2.includes("aero_free-reed")) {
        possible = checkInst(inst, acc);
    } else if (class2.includes("aero_side")) {
        possible = checkInst(inst, flute) || checkInst(inst, pic);
    } else if (class2.includes("aero_double-reed")) {
        possible = checkInst(inst, oboe) || checkInst(inst, bassoon) || checkInst(inst, eng);
    } else if (class2.includes("aero_lip-vibrated")) {
        possible = checkInst(inst, tromb) || checkInst(inst, trump) || checkInst(inst, tuba) || checkInst(inst, french);
    } else if (class2.includes("aero_single-reed")) {
        possible = checkInst(inst, sax) || checkInst(inst, clarinet);
    }
    return possible;
}

function checkChordPossible(class2, inst) {
    var possible = false;
    if (class2.includes("chrd_simple")) {
        possible = checkInst(inst, piano);
    } else if (class2.includes("chrd_composite")) {
        possible = checkInst(inst, dbl) || checkInst(inst, cello) || checkInst(inst, viola) || checkInst(inst, violin) || checkInst(inst, synth);
    }
    return possible;
}

function getBestPrediction(predictions) {
    var finalPredictions = [];
    predictions.forEach(prediciton => {
        var newPrediciton = {
            Id: prediciton.Id,
            class1: prediciton.class1,
            class2: prediciton.class2,
            Instrument: "???????????"
        }
        var pred = {
            Certainty: -1,
            Instrument: "???????????"
        };
        for (var key in prediciton) {
            // skip loop if the property is from prototype
            if (!prediciton.hasOwnProperty(key) || !key.includes("Instrument")) continue;
            if (prediciton[key].Possible && parseFloat(prediciton[key].Certainty) > pred.Certainty) {
                pred["Instrument"] = prediciton[key].Instrument;
            }
        }
        newPrediciton.Instrument = GetInstrumentForSumbission(parseInt(newPrediciton.Id), newPrediciton.class2, pred.Instrument);
        finalPredictions.push(newPrediciton);
    })
    return finalPredictions;
}

function GetInstrumentForSumbission(id, class2, instrument) {
    var inst = "?";
    if (class2.includes("chrd_simple")) {
        inst = piano;
    } else if (class2.includes("chrd_composite")) {
        var insts = [dbl, cello, viola, violin, synth];
        inst = checkInstArray(insts, instrument);
        if (inst == false) {
            inst = insts[id % 5];
            if (random == false) {
                inst = "?";
            }
        }
    } else if (class2.includes("aero_free-reed")) {
        inst = acc;
    } else if (class2.includes("aero_side")) {
        var insts = [flute, pic];
        inst = checkInstArray(insts, instrument);
        if (inst == false) {
            inst = insts[id % 2];
            if (random == false) {
                inst = "?";
            }
        }
    } else if (class2.includes("aero_double-reed")) {
        var insts = [oboe, bassoon, eng];
        inst = checkInstArray(insts, instrument);
        if (inst == false) {
            inst = insts[id % 3];
            if (random == false) {
                inst = "?";
            }
        }
    } else if (class2.includes("aero_lip-vibrated")) {
        var insts = [tromb, trump, tuba, french];
        inst = checkInstArray(insts, instrument);
        if (inst == false) {
            inst = insts[id % 4];
            if (random == false) {
                inst = "?";
            }
        }
    } else if (class2.includes("aero_single-reed")) {
        var insts = [sax, clarinet];
        inst = checkInstArray(insts, instrument);
        if (inst == false) {
            inst = insts[id % 2];
            if (random == false) {
                inst = "?";
            }
        }
    }

    return inst;
}

function checkInstArray(instArr, instrument) {
    for (var i = 0; i < instArr.length; i++) {
        if (checkInst(instrument, instArr[i]) === true) {
            return instArr[i];
        };
    }
    return false;
}
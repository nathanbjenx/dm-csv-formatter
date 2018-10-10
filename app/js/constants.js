var app = angular.module('csvStrip');

var mappings = [{
        "submission": "Id",
        "prediction": "inst#"
    },
    {
        "submission": "Instrument",
        "prediction": "predicted"
    }
];

app.constant('mappings', mappings);
var app = angular.module('csvStrip');


var csvDownMappings = [{
        "submission": "class1",
        "prediction": "class1"
    },
    {
        "submission": "class2",
        "prediction": "class2"
    },
];

var wekaMappings = [{
        "submission": "Id",
        "prediction": "inst#"
    },
    {
        "submission": "Instrument",
        "prediction": "predicted"
    },
];


app.constant('wekaMappings', wekaMappings);
app.constant('csvDownMappings', csvDownMappings);
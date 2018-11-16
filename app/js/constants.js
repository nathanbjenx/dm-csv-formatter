var app = angular.module('csvStrip');

var wekaMappings = [{
        "submission": "Id",
        "prediction": "inst#"
    },
    {
        "submission": "Instrument",
        "prediction": "predicted"
    },
    {
        "submission": "Certainty",
        "prediction": "prediction"
    }
];

var downloadMapping = [{
        "submission": "Id",
        "prediction": "Id"
    },
    {
        "submission": "Instrument",
        "prediction": "Instrument"
    }
];

app.constant('wekaMappings', wekaMappings);
app.constant('downloadMapping', downloadMapping);
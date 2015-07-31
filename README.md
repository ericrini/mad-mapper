# MadMapper
The best way to map one JSON structure into another.

# Example Usage

First you need some source data.
```
var source = {
	"EIN": "123456789",
	"SOCIAL_SECURITY_NUMBER": "371-06-0355",
	"DATE_OF_BIRTH": "10/23/1985",
	"FIRST_NAME": "Some",
	"LAST_NAME": "Dude",
	"ADDRESS": {
		"LINE1": "1234 Fake Street",
		"CITY": "Somewhere",
		"STATE": "AA"
	},
	"CONTRACT_NUMBER": "12345",
	"BALANCE": "100000",
	"RATE": "6",
	"ALLOCATIONS": [
		{
			"TICKER": "AAA",
			"ALLOCATION": "25"
		},
		{
			"TICKER": "BBB",
			"ALLOCATION": "25"
		},
		{
			"TICKER": "CCC",
			"ALLOCATION": "50"
		}
	]
};
````

Then you need some instructions to transform it.

```
var instructions = {
	employerIdentificationNumber: {
		strategy: function (source) {
			return source.EIN
		}
	},
	participants: {
		strategy: function (source, mapObject, mapArray) {
			return mapArray([source], {
				socialSecurityNumber: {
					strategy: function (source) {
						return source.SOCIAL_SECURITY_NUMBER.replace('-', '');
					}
				},
				dateOfBirth: {
					strategy: function (source) {
						return moment(source.DATE_OF_BIRTH, 'MM/DD/YYYY').format('YYYY-MM-DD');
					}
				},
				accounts: {
					"strategy": function (source, mapObject, mapArray) {
						return mapArray([source], {
							preTaxAccountBalance: {
								strategy: function (source) {
									return source.BALANCE;
								}
							},
							preTaxContributionPercent: {
								strategy: function (source) {
									return source.RATE;
								}
							},
							allocations: {
								strategy: function (source, mapObject, mapArray) {
									return mapArray(source.ALLOCATIONS, {
										tickerSymbol: {
											strategy: function (source) {
												return source.TICKER
											}
										},
										percentAllocation: {
											strategy: function (source) {
												return source.ALLOCATION
											}
										}
									});
								}
							}
						});
					}
				}
			})
		}
	}
};
```

You can get the result easily by passing the source and instructions.
```
var madmapper = require('madmapper');
var result = madmapper.mapObject(source, instructions);
```

The transformed result.
```
{
    "employerIdentificationNumber": "123456789",
    "participants": [
        {
            "socialSecurityNumber": "371-06-0355",
            "dateOfBirth": "1985-10-23",
            "accounts": [
                {
                    "preTaxAccountBalance": "100000",
                    "preTaxContributionPercent": "6",
                    "allocations": [
                        {
                            "tickerSymbol": "AAA",
                            "percentAllocation": "25"
                        },
                        {
                            "tickerSymbol": "BBB",
                            "percentAllocation": "25"
                        },
                        {
                            "tickerSymbol": "CCC",
                            "percentAllocation": "50"
                        }
                    ]
                }
            ]
        }
    ]
}
```
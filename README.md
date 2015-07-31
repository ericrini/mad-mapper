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
		property: 'EIN'	// A shortcut for a direct map to a source property.
	},
	participants: {
		strategy: function (source, mapObject, mapArray) {
			return mapArray([source], {
				socialSecurityNumber: {
					strategy: function (source) {
						return source.SOCIAL_SECURITY_NUMBER.replace('-', '').replace('-', '');
					}
				},
				dateOfBirth: {

					// A strategy can be used to transform source properties.
					strategy: function (source) {
						return moment(source.DATE_OF_BIRTH, 'MM/DD/YYYY').format('YYYY-MM-DD');
					}
				},
				address: {

					// A strategy can access more than one source property at a time.
					strategy: function (source) {
						return source.ADDRESS.LINE1 + source.ADDRESS.CITY + ', ' + source.ADDRESS.STATE + ' ' + source.ADDRESS.ZIP;
					}
				},
				accounts: {
					"strategy": function (source, mapObject, mapArray) {
						return mapArray([source], {
							constractNumber: {
								property: 'CONTRACT_NUMBER'
							},
							preTaxAccountBalance: {
								property: 'BALANCE'
							},
							preTaxContributionPercent: {
								property: 'RATE'
							},
							allocations: {
								strategy: function (source, mapObject, mapArray) {
									return mapArray(source.ALLOCATIONS, {
										tickerSymbol: {
											property: 'TICKER'
										},
										percentAllocation: {
											property: 'ALLOCATION'
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
var MadMapper = require('mad-mapper');
var result = new MadMapper().mapObject(source, instructions);
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

Notices

```
The MIT License (MIT)

Copyright (c) 2015 Eric Rini

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
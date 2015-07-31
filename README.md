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

```javascript
var instructions = {

	// The most basic mapping strategy maps a destination property to a source property by it's name.
	employerName: 'EMPLOYER_NAME',

	// Sometimes you need to change data types or do other logic on source data to get the destination value. This adds
	// proper formatting to the employer identification number.
	employerIdentificationNumber: function (source) {
		return source.EIN.slice(0, -2) + '-' + source.EIN.slice(-2);
	},

	employerDetails: function (source, mapObject) {

		// The mapObject strategy callback can create a new level in the destination document tree. This can be passed any
		// sub-tree of the source document and a set of instructions that continues to follow the rules that have already
		// been established.
		return mapObject(source, {
			address: function (source) {

				// Note how a strategy can access multiple fields from the source to construct a new destination property.
				return source.EMPLOYER_ADDRESS.LINE1 +
					source.EMPLOYER_ADDRESS.CITY + ', ' +
					source.EMPLOYER_ADDRESS.STATE + ' ' +
					source.EMPLOYER_ADDRESS.ZIP;
			},
			website: 'EMPLOYER_WEBSITE'
		});
	},

	// Let's get crazy.
	participants: function (source, mapObject, mapArray) {

		// The mapArray function allows you to create an array in the destination document. It always takes an array as
		// input and the instructions are applied to each item.
		//
		// In this case were passing the whole source document. So the destination array will only have one item in it.
		return mapArray([source], {
			socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
			accounts: function (source, mapObject, mapArray) {
				return mapArray([source], {
					constractNumber: 'CONTRACT_NUMBER',
					preTaxAccountBalance: 'BALANCE',
					preTaxContributionPercent: 'RATE',
					allocations: function (source, mapObject, mapArray) {

						// Here we are mapping an array on the source into a whole new array. So this array has many items.
						return mapArray(source.ALLOCATIONS, {
							tickerSymbol: 'TICKER',
							percentAllocation: 'ALLOCATION'
						});
					}
				});
			}
		})
	}
};
```

You can get the result easily by passing the source and instructions.
```
var MadMapper = require('mad-mapper');
var result = new MadMapper().mapObject(source, instructions);
```

The transformed result.
```javascript
{
    "employerName": "Some Company",
    "employerIdentificationNumber": "1234567-89",
    "employerDetails": {
        "address": "1234 Fake StreetSomewhere, AA 12345",
        "website": "http://some-website.com"
    },
    "participants": [
        {
            "socialSecurityNumber": "371-06-0355",
            "accounts": [
                {
                    "constractNumber": "12345",
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
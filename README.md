# MadMapper
The best way to map one JSON structure into another.

## Simple Example Usage

First you need some source data.

```javascript
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
	employerIdentificationNumber: function (current) {
		return current.EIN.slice(0, -2) + '-' + current.EIN.slice(-2);
	},

	employerDetails: function (current, object) {

		// The object strategy callback can create a new level in the destination document tree. This can be passed any
		// sub-tree of the source document and a set of instructions that continues to follow the rules that have already
		// been established.
		return object(current, {
			address: function (current) {

				// Note how a strategy can access multiple fields from the source to construct a new destination property.
				return current.EMPLOYER_ADDRESS.LINE1 +
					current.EMPLOYER_ADDRESS.CITY + ', ' +
					current.EMPLOYER_ADDRESS.STATE + ' ' +
					current.EMPLOYER_ADDRESS.ZIP;
			},
			website: 'EMPLOYER_WEBSITE'
		});
	},

	// Let's go crazy.
	participants: function (current, object, array) {

		// The array function allows you to create an array in the destination document. It always takes an array as
		// input and the instructions are applied to each item.
		//
		// In this case were passing the whole source document. So the destination array will only have one item in it.
		return array([current], {
			socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
			accounts: function (current, object, array) {
				return array([current], {
					constractNumber: 'CONTRACT_NUMBER',
					preTaxAccountBalance: 'BALANCE',
					preTaxContributionPercent: 'RATE',
					allocations: function (current, object, array) {

						// Here we are mapping an array on the source into a whole new array. So this array has many items.
						return array(current.ALLOCATIONS, {
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

```javascript
var MadMapper = require('mad-mapper');
var result = new MadMapper().object(source, instructions);
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

### Object Hydration Example
One extremely common problem in relational (and sometimes nosql) databases is that structures are persisted in highly
normalized or "flatter" forms than the application code desires at runtime. The data geeks in the audience might refer
to this problem as the [Object Relational Impedence Mismatch](http://www.agiledata.org/essays/impedanceMismatch.html).

We can easily hydrate highly normalize (or "flattened") data into a proper object hierarchy using this tool. 

```javascript
var source = [
	{
		"EIN": "1234567-89",
		"SSN": "123-45-6789",
		"SYMBOL": "AAA",
		"ALLOCATION_PERCENT": 50
	},
	{
		"EIN": "1234567-89",
		"SSN": "123-45-6789",
		"SYMBOL": "BBB",
		"ALLOCATION_PERCENT": 50
	},
	{
		"EIN": "9876543-21",
		"SSN": "987-65-4321",
		"SYMBOL": "AAA",
		"ALLOCATION_PERCENT": 100
	}
];

var madmapper = new MadMapper();

// The group function allows us to GROUP (or reduce) an array of items into buckets before they are mapped into
// a destination structure. It takes 3 arguments, a source array, a group strategy and then instructions that
// follow the rules already established.
var result = madmapper.group(
	source,

	// This is the grouping strategy.
	function (buckets, current) {
	
		// In the grouping strategy, we add each item to a bucket. The first argument is a unique key for the bucket,
		// the second argument is the data value to add to this key.
		buckets.add(current.EIN, current);
		return buckets;
	},

	// These instructions should look familiar from earlier examples. The bucketed data is transformed like any other.
	{
		employerIdentificationNumber: 'EIN',
		participants: function (current, object, array, group, source) {

			// You can group your groups recursively to do really impressive things. This is how ORM style object
			// hydration is generally accomplished.
			return group(source, function (buckets, current) {
				buckets.add(current.SSN, current);
				return buckets;
			}, {
				socialSecurityNumber: 'SSN',
				allocations: function (current, object, array, group, source) {
					return array(source, {
						ticker: "SYMBOL",
						allocation: function (current) {
							return current.ALLOCATION_PERCENT / 100
						}
					});
				}
			});
		}
	}
);
```

the resulting structure would look like this

```javascript
[
    {
        "employerIdentificationNumber": "1234567-89",
        "participants": [
            {
                "socialSecurityNumber": "123-45-6789",
                "allocations": [
                    {
                        "ticker": "AAA",
                        "allocation": 0.5
                    },
                    {
                        "ticker": "BBB",
                        "allocation": 0.5
                    }
                ]
            }
        ]
    },
    {
        "employerIdentificationNumber": "9876543-21",
        "participants": [
            {
                "socialSecurityNumber": "987-65-4321",
                "allocations": [
                    {
                        "ticker": "AAA",
                        "allocation": 1
                    }
                ]
            }
        ]
    }
]
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
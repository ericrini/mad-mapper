var moment = require('moment');
var MadMapper = require('./index');
var assert = require('assert');

var source = {
	"EIN": "123456789",
	"EMPLOYER_NAME": "Some Company",
	"EMPLOYER_ADDRESS": {
		"LINE1": "1234 Fake Street",
		"CITY": "Somewhere",
		"STATE": "AA",
		"ZIP": "12345"
	},
	"EMPLOYER_WEBSITE": "http://some-website.com",
	"SOCIAL_SECURITY_NUMBER": "371-06-0355",
	"DATE_OF_BIRTH": "10/23/1985",
	"FIRST_NAME": "Some",
	"LAST_NAME": "Dude",
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

var instructions = {

	// The most basic mapping strategy maps a destination property to a source property by it's name.
	employerName: 'EMPLOYER_NAME',

	// Sometimes you need to change data types or do other logic on source data to get the destination value. This adds
	// proper formatting to the employer identification number.
	employerIdentificationNumber: function (source) {
		return source.EIN.slice(0, -2) + '-' + source.EIN.slice(-2);
	},

	employerDetails: function (source, object) {

		// The object strategy callback can create a new level in the destination document tree. This can be passed any
		// sub-tree of the source document and a set of instructions that continues to follow the rules that have already
		// been established.
		return object(source, {
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

	// Let's go crazy.
	participants: function (source, object, array) {

		// The array function allows you to create an array in the destination document. It always takes an array as
		// input and the instructions are applied to each item.
		//
		// In this case were passing the whole source document. So the destination array will only have one item in it.
		return array([source], {
			socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
			accounts: function (source, object, array) {
				return array([source], {
					constractNumber: 'CONTRACT_NUMBER',
					preTaxAccountBalance: 'BALANCE',
					preTaxContributionPercent: 'RATE',
					allocations: function (source, object, array) {

						// Here we are mapping an array on the source into a whole new array. So this array has many items.
						return array(source.ALLOCATIONS, {
							tickerSymbol: 'TICKER',
							percentAllocation: 'ALLOCATION'
						});
					}
				});
			}
		})
	}
};

var madmapper = new MadMapper();
var result = madmapper.object(source, instructions);

console.log(JSON.stringify(result, null, 4));

assert.equal(
	JSON.stringify(result),
	'{"employerName":"Some Company","employerIdentificationNumber":"1234567-89","employerDetails":{"address":"1234 Fake StreetSomewhere, AA 12345","website":"http://some-website.com"},"participants":[{"socialSecurityNumber":"371-06-0355","accounts":[{"constractNumber":"12345","preTaxAccountBalance":"100000","preTaxContributionPercent":"6","allocations":[{"tickerSymbol":"AAA","percentAllocation":"25"},{"tickerSymbol":"BBB","percentAllocation":"25"},{"tickerSymbol":"CCC","percentAllocation":"50"}]}]}]}'
);
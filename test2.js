var moment = require('moment');
var MadMapper = require('./index');
var assert = require('assert');

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

console.log(JSON.stringify(result, null, 4));

assert.equal(
	JSON.stringify(result),
	'[{"employerIdentificationNumber":"1234567-89","participants":[{"socialSecurityNumber":"123-45-6789","allocations":[{"ticker":"AAA","allocation":0.5},{"ticker":"BBB","allocation":0.5}]}]},{"employerIdentificationNumber":"9876543-21","participants":[{"socialSecurityNumber":"987-65-4321","allocations":[{"ticker":"AAA","allocation":1}]}]}]'
);
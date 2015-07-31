var moment = require('moment');
var MadMapper = require('./index');

var source = {
	"EIN": "123456789",
	"SOCIAL_SECURITY_NUMBER": "371-06-0355",
	"DATE_OF_BIRTH": "10/23/1985",
	"FIRST_NAME": "Some",
	"LAST_NAME": "Dude",
	"ADDRESS": {
		"LINE1": "1234 Fake Street",
		"CITY": "Somewhere",
		"STATE": "AA",
		"ZIP": "12345"
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

var instructions = {
	employerIdentificationNumber: {
		property: 'EIN'
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
					strategy: function (source) {
						return moment(source.DATE_OF_BIRTH, 'MM/DD/YYYY').format('YYYY-MM-DD');
					}
				},
				address: {
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

var madmapper = new MadMapper();
var result = madmapper.mapObject(source, instructions);

console.log(JSON.stringify(result, null, 4));
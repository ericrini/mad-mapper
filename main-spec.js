describe('The MadMapper', function () {
	'use strict';

	var lodash = require('lodash');
	var moment = require('moment');
	var MadMapper = require('./main.js');
	var madMapper;

	beforeEach(function () {
		madMapper = new MadMapper();
	});

	it('can perform simple object mappings', function () {
		var source = {
			SOCIAL_SECURITY_NUMBER: '123-45-6789',
			DATE_OF_BIRTH: '01/02/2000'
		};

		var instructions = {
			socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
			dateOfBirth: function (current) {
				return moment(current.DATE_OF_BIRTH, 'MM/DD/YYYY').format('YYYY-MM-DD');
			}
		};

		var result = {
			socialSecurityNumber: '123-45-6789',
			dateOfBirth: '2000-01-02'
		};

		expect(madMapper.object(source, instructions)).toEqual(result);
	});

	it('can use an eval strategy', function () {
		var source = {
			NAME: {
				FIRST: 'First',
				LAST: 'Last'
			}
		};

		var instructions = {
			firstName: madMapper.Strategies.Eval('NAME.FIRST'),
			lastName: madMapper.Strategies.Eval('NAME.LAST')
		};

		var result = {
			firstName: 'First',
			lastName: 'Last'
		};

		expect(madMapper.object(source, instructions)).toEqual(result);
	});

	it('can perform deep object mappings', function () {
		var source = {
			EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
			SOCIAL_SECURITY_NUMBER: '123456789',
			NAME: {
				FIRST: 'First',
				LAST: 'Last'
			}
		};

		var instructions = {
			employerIdentificationNumber: function (current) {
				return current.EMPLOYER_IDENTIFICATION_NUMBER.slice(0, 7) + '-' +
					current.EMPLOYER_IDENTIFICATION_NUMBER.slice(7, 9);
			},
			employee: function (current, object) {
				return object(current, {
					socialSecurityNumber: function (current) {
						return current.SOCIAL_SECURITY_NUMBER.slice(0, 3) + '-' + 
							current.SOCIAL_SECURITY_NUMBER.slice(3, 5) + '-' +
							current.SOCIAL_SECURITY_NUMBER.slice(5, 9)
					},
					name: function (current) {
						return current.NAME.FIRST + ' ' + current.NAME.LAST;
					} 
				});
			}
		};

		var result = {
			employerIdentificationNumber: '9876543-21',
			employee: {
				socialSecurityNumber: '123-45-6789',
				name: 'First Last'
			}
		};

		expect(madMapper.object(source, instructions)).toEqual(result);
	});

	it('can perform deep array mapping', function () {
		var source = [
			{
				SOCIAL_SECURITY_NUMBER: '123456789',
				HOLDINGS: [
					{
						ISIN: 'US1234567890',
						SHARE_QUANITITY: 100
					},
					{
						ISIN: 'US2345678901',
						SHARE_QUANITITY: 250
					},
					{
						ISIN: 'US3456789012',
						SHARE_QUANITITY: 130
					}
				]
			},
			{
				SOCIAL_SECURITY_NUMBER: '234567891',
				HOLDINGS: [
					{
						ISIN: 'US4567890123',
						SHARE_QUANITITY: 50
					},
					{
						ISIN: 'US5678901234',
						SHARE_QUANITITY: 65
					},
					{
						ISIN: 'US6789012345',
						SHARE_QUANITITY: 37
					}
				]
			}
		];

		var instructions = {
			socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
			funds: function (current, object, array) {
				return array(current.HOLDINGS, {
					internationalStockIdentificationNumber: 'ISIN',
					totalShares: 'SHARE_QUANITITY'
				});
			}
		};

		var result = [
			{
				"socialSecurityNumber": "123456789",
				"funds": [
					{
						"internationalStockIdentificationNumber": "US1234567890",
						"totalShares": 100
					},
					{
						"internationalStockIdentificationNumber": "US2345678901",
						"totalShares": 250
					},
					{
						"internationalStockIdentificationNumber": "US3456789012",
						"totalShares": 130
					}
				]
			},
			{
				"socialSecurityNumber": "234567891",
				"funds": [
					{
						"internationalStockIdentificationNumber": "US4567890123",
						"totalShares": 50
					},
					{
						"internationalStockIdentificationNumber": "US5678901234",
						"totalShares": 65
					},
					{
						"internationalStockIdentificationNumber": "US6789012345",
						"totalShares": 37
					}
				]
			}
		];

		expect(madMapper.array(source, instructions)).toEqual(result);
	});

	it('can perform grouping operations (hydration)', function () {
		var source = [
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '123456789',
				HOLDING: {
					ISIN: 'US1234567890',
					SHARE_QUANITITY: 47
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '123456789',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 80
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '345678912',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 23
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '876543219',
				SOCIAL_SECURITY_NUMBER: '234567891',
				HOLDING: {
					ISIN: 'US1234567890',
					SHARE_QUANITITY: 400
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '876543219',
				SOCIAL_SECURITY_NUMBER: '234567891',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 120
				}
			}
		];

		var result = madMapper.group(
			source, 
			function (buckets, current) {
				buckets.add(current.EMPLOYER_IDENTIFICATION_NUMBER, current);
				return buckets;
			}, {
				employerIdentificationNumber: 'EMPLOYER_IDENTIFICATION_NUMBER',
				participants: function (current, object, array, group, source) {
					return group(source, function (buckets, current) {
						buckets.add(current.SOCIAL_SECURITY_NUMBER, current);
						return buckets;
					}, {
						socialSecurityNumber: 'SOCIAL_SECURITY_NUMBER',
						holdings: function (current, object, array, group, source) {
							return array(source, {
								internationalStockIdentificationNumber: function (current) {
									return current.HOLDING.ISIN;
								},
								totalShares: function (current) {
									return current.HOLDING.SHARE_QUANITITY;
								}
							});
						}
					});
				}
			}
		);

		expect(result).toEqual([
			{
				"employerIdentificationNumber": "876543219",
				"participants": [
					{
						"socialSecurityNumber": "234567891",
						"holdings": [
							{
								"internationalStockIdentificationNumber": "US1234567890",
								"totalShares": 400
							},
							{
								"internationalStockIdentificationNumber": "US2345678901",
								"totalShares": 120
							}
						]
					}
				]
			},
			{
				"employerIdentificationNumber": "987654321",
				"participants": [
					{
						"socialSecurityNumber": "123456789",
						"holdings": [
							{
								"internationalStockIdentificationNumber": "US1234567890",
								"totalShares": 47
							},
							{
								"internationalStockIdentificationNumber": "US2345678901",
								"totalShares": 80
							}
						]
					},
					{
						"socialSecurityNumber": "345678912",
						"holdings": [
							{
								"internationalStockIdentificationNumber": "US2345678901",
								"totalShares": 23
							}
						]
					}
				]
			}
		]);
	});

	it('can perform grouping operations (summary)', function () {
		var source = [
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '123456789',
				HOLDING: {
					ISIN: 'US1234567890',
					SHARE_QUANITITY: 47
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '123456789',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 80
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '987654321',
				SOCIAL_SECURITY_NUMBER: '345678912',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 23
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '876543219',
				SOCIAL_SECURITY_NUMBER: '234567891',
				HOLDING: {
					ISIN: 'US1234567890',
					SHARE_QUANITITY: 400
				}
			},
			{
				EMPLOYER_IDENTIFICATION_NUMBER: '876543219',
				SOCIAL_SECURITY_NUMBER: '234567891',
				HOLDING: {
					ISIN: 'US2345678901',
					SHARE_QUANITITY: 120
				}
			}
		];

		var result = madMapper.group(
			source,
			function (buckets, current) {
				buckets.add(current.EMPLOYER_IDENTIFICATION_NUMBER, current);
				return buckets;
			}, {
				employerIdentificationNumber: 'EMPLOYER_IDENTIFICATION_NUMBER',
				averageHoldingSize: function (current, object, array, group, source) {
					var sum = lodash.reduce(source, function (accumulator, current) {
						accumulator += current.HOLDING.SHARE_QUANITITY;
						return accumulator;
					}, 0);

					return sum / source.length;
				},
				totalParticipants: function (current, object, array, group, source) {
					return group(source, function (buckets, current) {
						buckets.add(current.SOCIAL_SECURITY_NUMBER, current);
						return buckets;
					}, function (current) {
						return Object.keys(current).length;
					});
				}
			}
		);

		expect(result).toEqual([
			{
				"employerIdentificationNumber": "876543219",
				"averageHoldingSize": 260,
				"totalParticipants": 1
			},
			{
				"employerIdentificationNumber": "987654321",
				"averageHoldingSize": 50,
				"totalParticipants": 2
			}
		]);
	});
});
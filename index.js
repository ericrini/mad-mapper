var lodash = require('./lib/lodash');

var Buckets = function () {
	var self = this;
	self._map = {}
};

Buckets.prototype.add = function (key, value) {
	var self = this;

	if (!self._map[key]) {
		self._map[key] = [];
	}

	self._map[key].push(value);
};

var MadMapper = function () {};

MadMapper.prototype.object = function (current, instructions, source) {
	var self = this;

	return lodash.reduce(instructions, function(destination, instruction, key) {
		if (typeof instruction === 'string') {
			destination[key] = current[instruction];
		}

		if (typeof instruction === 'function') {
			destination[key] = instruction.call(
				self,
				current,
				function () { return self.object.apply(self, arguments); },
				function () { return self.array.apply(self, arguments); },
				function () { return self.group.apply(self, arguments); },
				source
			);
		}

		return destination;
	}, {});
};

MadMapper.prototype.array = function (source, instructions) {
	var self = this;

	return lodash.reduce(source, function (destination, value) {
		destination.push(self.object(value, instructions, source));
		return destination;
	}, []);
};

MadMapper.prototype.group = function (source, strategy, instructions) {
	var self = this;

	// First we map items in the source array into buckets.
	var buckets = lodash.reduce.call(lodash, source, strategy, new Buckets());

	// Second we reduce each bucket to a single item.
	return lodash.reduce(buckets._map, function (accumulator, bucket) {
		accumulator.push(self.object(bucket[0], instructions, bucket));
		return accumulator;
	}, []);
};

module.exports = MadMapper;
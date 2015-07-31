var lodash = require('./lib/lodash');

var MadMapper = function () {
	this.test = 1;
};

MadMapper.prototype.mapArray = function (source, instructions) {
	var self = this;

	return lodash.reduce(source, function (destination, value) {
		destination.push(self.mapObject(value, instructions));
		return destination;
	}, []);
};

MadMapper.prototype.mapObject = function (source, instructions) {
	var self = this;

	return lodash.reduce(instructions, function(destination, instruction, key) {
		if (typeof instruction === 'string') {
			destination[key] = source[instruction];
		}

		if (typeof instruction === 'function') {
			destination[key] = instruction.call(
				self,
				source,
				function () { return self.mapObject.apply(self, arguments); },
				function () { return self.mapArray.apply(self, arguments); }
			);
		}

		return destination;
	}, {});
};

module.exports = MadMapper;
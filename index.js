var lodash = require('lodash');

function mapArray(source, instructions) {
	return lodash.reduce(source, function (destination, value) {
		destination.push(mapObject(value, instructions));
		return destination;
	}, []);
}

function mapObject(source, instructions) {
	return lodash.reduce(instructions, function(destination, instruction, key) {
		destination[key] = instruction.strategy(source, mapObject, mapArray);
		return destination;
	}, {});
}

module.exports = {
	mapArray: mapArray,
	mapObject: mapObject
};
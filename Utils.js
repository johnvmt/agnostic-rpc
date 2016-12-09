var Utils = {};

Utils.objectForEach = function(object, callback) {
	// run function on each property (child) of object
	var property;
	for(property in object) { // pull keys before looping through?
		if (object.hasOwnProperty(property))
			callback(object[property], property, object);
	}
};

Utils.objectMerge = function() {
	var merged = {};
	this.objectForEach(arguments, function(argument) {
		for (var attrname in argument) {
			if(argument.hasOwnProperty(attrname))
				merged[attrname] = argument[attrname];
		}
	});
	return merged;
};

Utils.uniqueId = function() {
	function s4() {
		return Math.floor((1 + Math.random()) * 0x10000)
			.toString(16)
			.substring(1);
	}
	return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
		s4() + '-' + s4() + s4() + s4();
};

Utils.parseArgs = function(argsPassed, argsConfig) {
	var matched = {};

	function toLevels(argsConfig, level) {
		if(typeof level !== 'number')
			level = 0;

		var levelsArr = [];

		argsConfig.forEach(function(argConfig) {
			if(Array.isArray(argConfig))
				levelsArr = levelsArr.concat(toLevels(argConfig, level + 1));
			else {
				argConfig.level = level;
				levelsArr.push(argConfig);
			}
		});

		return levelsArr;
	}

	function validArg(argConfig, arg) {
		return typeof argConfig.validate != 'function' || argConfig.validate(arg)
	}

	function requiredLeftEnough(argsConfig, minIndex) {
		for(var index = minIndex; index < argsConfig.length; index++) {
			if(typeof(argsConfig[index]) === 'undefined' || !argsConfig[index].required)
				return true;
		}
		return false;
	}

	var argConfigMin = 0;

	if(!Array.isArray(argsPassed))
		argsPassed = Array.prototype.slice.call(argsPassed);

	argsPassed.forEach(function(arg, index) {
		for(var ctr = argConfigMin; ctr < argsConfig.length; ctr++) {
			if(argsConfig[ctr].required) {
				if(validArg(argsConfig[ctr], arg)) {
					argsConfig[ctr].matched = true;
					matched[argsConfig[ctr].name] = arg;
					argConfigMin++;
					break;
				}
				else
					throw "missing_required";
			}
			else if((!argsConfig[ctr].required && (requiredLeftEnough(argsConfig, ctr) || (argsConfig[ctr].level > argsConfig[ctr - 1].level && argsConfig[ctr - 1].matched))) && validArg(argsConfig[ctr], arg)) {
				argsConfig[ctr].matched = true;
				matched[argsConfig[ctr].name] = arg;
				argConfigMin++;
				break;
			}
			else {
				argsConfig[ctr].matched = false;
				argConfigMin++;
			}
		}
	});

	// Add default options, if set
	argsConfig.forEach(function(argConfig) {
		if(typeof matched[argConfig.name] == 'undefined' && typeof argConfig.default != 'undefined')
			matched[argConfig.name] = argConfig.default;
	});

	return matched;
};

module.exports = Utils;
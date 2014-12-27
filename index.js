// var eachNode = require('./lib/each-node')
var Emitter = require('component-emitter')

var copy = require('./lib/copy')
var iter = require('./lib/iter')
var lex = require('./lib/lex')
var parse = require('./lib/parse')
var isExpr = require('./lib/isExpr')
var evaluate = require('./lib/evaluate')

var view = module.exports = function() {
	// Set a key to a value
	if(arguments.length === 2) {
		var obj = {}
		obj[arguments[0]] = arguments[1]
		return set(obj)
	}

	// Get a value
	if(typeof arguments[0] === 'string')
		return lex(parse(evaluate(expr, data)))
	else // Set an object
		return set(arguments[0])
}

/*
	* view('incr', function(x) { return x + 1 })
	* view('incr 1')
	*/

module.exports = view

var config = {cache: true}
var data = {}
var bindings = {}

function set(obj) {
	copy.shallow(obj, data)
	// iter.map(flatKeys(obj), function(key) { emit('set ' + key) })
	return data
}

// Return all the flat key names for an object
// eg: {x: 1, y: {z: 2}, arr: [{q: 'q'}, {q: 'q'}]} // -> ['x', 'y', 'y.z', 'arr']
function flatKeys(obj) {
	var stack = [[obj, '']] // a pair of current object level and current parent key name
	var keys = []
	while(stack.length) {
		var next = stack.pop(), currentObj = next[0], parentKey = next[1], nestedKey
		for(var key in currentObj) {
			nestedKey = parentKey.length ? parentKey + '.' + key : key
			keys.push(nestedKey)
			if(typeof currentObj[key] === 'object' && !(currentObj[key] instanceof Array))
				stack.push([currentObj[key], nestedKey])
		}
	}
	return keys
}

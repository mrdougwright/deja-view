// Get a possibly nested set of keys 
// eg. deep_get('x', {x: 1}) -> 1
// eg. deep_get('x.y', {x: {y: 1}}) -> 1
// eg. deep_get('x.y', {'x.y': 1}) -> 1
//
// Indexes on arrays
// eg. deep_get('xs.1', {xs: ['a','b','c']}) -> 'b'
//
// Use 'this' for an identity property, useful for self-referencing inside
// scopes
// eg. deep_get('this', 1) -> 1
// eg. deep_get('x.this', {x: 1}) -> 1
//
// Reference on the parent from the child using 'parent', useful for
// referencing the parent from within a scope
// eg. deep_get('x.parent.y', {x: 1, y: 2}) -> 2
//
// You can do a shadowing scope type of deal by passing in a third param, your scope
// eg. deep_get('x', {y: 1, thing: {x: 9}}, 'thing') -> 1
// eg. deep_get('x', {x: 9, thing: {y: 1}}, 'thing') -> 9
// eg. deep_get('this', {x: 9, thing: {y: 1}}, 'thing') -> {y: 1}

module.exports = deep_get
window.deep_get = deep_get

function deep_get(keys, obj, scope) {
	keys = (scope ? scope + '.' : '') + keys
	if(obj[keys]) return obj[keys]

	var current = obj,
		keys = keys.split('.'),
		stack = []

	for(var i = 0; i < keys.length; ++i) {
		var key = keys[i]
		if(key === 'this');
		else {
			if(!isNaN(key)) key = Number(key)
			if(current[key] !== undefined) {
				stack.push(current)
				current = current[key]
			} else if(scope) {
				current = stack.pop()
				--i
			} else return
		}
	}
	return current
}

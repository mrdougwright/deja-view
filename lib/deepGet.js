// Get a possibly nested set of keys 
// eg. deepGet('x', {x: 1}) -> 1
// eg. deepGet('x.y', {x: {y: 1}}) -> 1
// eg. deepGet('x.y', {'x.y': 1}) -> 1
module.exports = function deepGet(keys, obj) {
	if(obj[keys]) return obj[keys]
	var result = obj, keys = keys.split('.')
	for(var i = 0; i < keys.length; ++i) {
		if(result[keys[i]] !== undefined) result = result[keys[i]]
		else return
	}
	return result
}

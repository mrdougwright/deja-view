// mutating object copy utilities

var copy = module.exports = {}

copy.shallow = function(from, to) {
	to = to || {}
	for(var key in from) to[key] = from[key]
	return to
}

copy.deep = function(from, to) {
	to = to || {}
	for(var key in from) {
		if(from[key].constructor === Object)
			to[key] = copy.deep(from[key]) // TODO make it stack-iterative
		else
			to[key] = from[key]
	}
	return to
}

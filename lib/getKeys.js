// Given a view s-expr, return all the keywords
// eg. "(add 1 (incr x))" -> ["add", "incr", "x"]

module.exports = function getKeys(expr) {
	var keys = [],
	    matches = [],
	    re = /[\( \^]([^ \(\)'"0-9]+)(?=[\) \$])/g
	while(matches) {
		matches = re.exec(expr)
		if(matches && matches[1])
			keys.push(matches[1])
	}
	return keys
}

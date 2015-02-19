// Given a view s-expr, return all the keywords
// eg. "(add 1 (incr x))" -> ["add", "incr", "x"]

module.exports = function get_keys(expr) {
	return expr
		.replace(/([\(\)])|(\d+(\.\d+)?)|('.+')|(".+")/g,'').trim().split(" ")
}

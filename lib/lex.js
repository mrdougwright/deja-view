var lex = module.exports = function(expr) {
	return expr.match(/\(|\)|[^ \(\)]+/g)
}

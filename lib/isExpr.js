// Is the given string a view expression? (ie. is it surrounded by parens?)
var isExpr = module.exports = function(str) {
	return str.trim().match(/^\(.+$/)
}


// Convert a string expression into an array of labeled lexemes

// parse a string into an array of sub-expressions that can be evaluated
// eg. "(add 1 (fn (decr x)))"
//     -> ["add", "1", "(fn (decr x))"]
// We parse and evaluate everything lazily
module.exports = function parse(expr) {
	var lexemes = [],
	    matches = [],
	    re = /(\()|(\))|(\d+(?:\.\d+)?)|((?:'.+')|(?:".+"))|([^ \(\)]+)/g
	while(matches) {
		matches = re.exec(expr)
		if(matches && matches[0]) {
			if(matches[1]) lexemes.push('(')
			else if(matches[2]) lexemes.push(')')
			else if(matches[3]) lexemes.push({num: matches[3]})
			else if(matches[4]) lexemes.push({str: matches[4]})
			else if(matches[5]) lexemes.push({key: matches[5]})
			else throw new Error("Unexpected token: " + expr)
		}
	}
	return lexemes
}

// Return the string until the end of the first expression
// eg. "123 x y" -> "123"
// eg. "(add 1 2) x y" -> "add 1 2"
// eg. "(x)" -> "x"
//
// /'.+'/ and /".+"/ match strings
// /\d+(\.d+)?/ matches nums
// /[^ \(\)]/ matches keywords
module.exports = function parse(expr) {
	var matches = []
	while(expr.length) {
		// Return a nested expression bounded by parens
		if(expr[0] === "(") {
			for(var pos = 1, level = 1; pos < expr.length && level > 0; ++pos)
				if(expr[pos] === ')') --level
			matches.push(expr.slice(1,pos))
			expr = expr.slice(pos)
		} else {
			// Return a string, number, or keyword
			var atomMatches = str.match(/^((?:'.+')|(?:".+"))|(\d+(?:\.\d+)?)|([^ \(\)]+)/)
			if(atomMatches && atomMatches[0]) {
				if(atomMatches[1]) atomMatches.push({str: atomMatches[1]})
				if(atomMatches[2]) atomMatches.push({num: atomMatches[2]})
				if(atomMatches[3]) atomMatches.push({key: atomMatches[3]})
				else throw new Error("Unexpected token: " + expr)
				expr = expr.slice()
			}
		}
}

// Remove all opening and closing parens
// They are semantically whitespace
// eg. ((a b c (d e))) == a b c (d e)
function removeSurrounds(str) {
	return str.replace(/^\(+(.*?)(?:\)+$)/g, function($0, $1) {return $1})
}

// Convert a string expression into an array of labeled lexemes

module.exports = function lex(expr) {
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

/* RegExp reference:
	*   \(                       -> open scope
	*   \)                       -> close scope
	*   \d+(\.d+)?               -> number
	*   ('.+')|(".+")           -> string
	*   [^ \(\)]+                -> key
	*/

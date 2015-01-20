// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This is a flat O(n) where n is the number of characters in the expression

module.exports = function parse(expr) {
	var matches = []

	for(var position = 0; position < expr.length;) {

		// Return a nested expression bounded by parens
		if(expr[position] === "(") {
			++position
			var start = position
			for(var level = 1; level > 0 && position <= expr.length; ++position) {
				if(expr[position] === ')') --level
				else if(expr[position] === '(') ++level
			}
			matches.push(expr.slice(start, position - 1))
		}

		// Advance on whitespace
		else if(expr[position].match(/\s/)) {
			++position
		}

		// Unmatched closing parens
		else if(expr[position] === ")") {
			throw new Error("Unmatched closing paren")
		}

		// Return a string, number, or keyword
		else {
			var atomMatch = expr.slice(position).match( /^(?:'(.+?)')|(?:"(.+?)")|(\d+(?:\.\d+)?)|([^\s\(\)]+)/ )
			if(atomMatch && atomMatch[0]) {
				if(atomMatch[1] || atomMatch[2]) matches.push({str: atomMatch[1] || atomMatch[2]})
				else if(atomMatch[3]) matches.push({num: Number(atomMatch[3])})
				else if(atomMatch[4]) matches.push({key: atomMatch[4]})
				position += atomMatch[0].length
			} else throw new Error("Unexpected token: " + expr)
		}
	}
	return matches
}

// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This parser is designed like a finite state machine 

// This is a flat O(n) where n is the length in characters of the expression

module.exports = parse

function parse(expr, node) {
	if(expr === undefined) return []
	expr = expr.trim().replace(/^\(+/,'')

	var pos = 0, matches = []

	while(pos < expr.length) {
		if(expr[pos].match(/[\s)]/)) ++pos // Eat whitespace and extra close parens
		else {
			if(expr[pos].match(/["']/)) {
				var lookahead = find_delimiter(pos, expr, expr[pos]) + 1
				matches.push({val: expr.slice(pos + 1, lookahead - 1)})
			} else if(expr[pos] === '(') {
				var lookahead = find_scope(pos, expr)
				matches.push(expr.slice(pos + 1, lookahead - 1))
			} else {
				var lookahead = find_delimiter(pos, expr, /[\$\)\(\[\]" ]/),
					word = expr.slice(pos, lookahead)

				if(word === 'true' || word === 'false') matches.push({val: word === 'true'})
				else if(!isNaN(word)) matches.push({val: Number(word)})
				else matches.push({key: word})
			}
			pos = lookahead
		}
	}
	return matches
}

function find_scope(pos, str) {
	++pos
	for(var level = 1; level > 0 && pos < str.length; ++pos) {
		if(str[pos] === ')') --level
		else if(str[pos] === '(') ++level
	}
	return pos
}

function find_delimiter(pos, str, delimiter) {
	++pos
	while(pos < str.length && !str[pos].match(delimiter)) ++pos
	return pos
}


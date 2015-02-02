// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This parser is designed like a finite state machine 

// This is a flat O(n) where n is the length in characters of the expression

var eval_err = require('./eval_err')

module.exports = parse

// a ((b (c d)))
// x
// y

function parse(expr) {
	var pos = 0, matches = []
	expr = trim(expr)

	while(pos < expr.length) {
		// Eat whitespace
		if(expr[pos].match(/\s/)) ++pos
		// Unexpected close paren
		else if(expr[pos] === ')') eval_err('Unexpected close paren', null, pos, expr)
		else {
			if(expr[pos].match(/["']/))
				var lookahead = find_delimiter(pos, expr, expr[pos]) + 1
			else if(expr[pos] === '(')
				var lookahead = find_scope(pos, expr)
			else
				var lookahead = find_delimiter(pos, expr, /[\(\[" ]/)
			matches.push(expr.slice(pos, lookahead))
			pos = lookahead
		}
	}

	// Atomize the first element of the expression
	if(matches.length) {
		var atom_match = matches[0].trim().match( /^(?:'(.+?)')$|^(?:"(.+?)")$|^(\d+(?:\.\d+)?)$|^(true|false)$|^([^\s\(\)]+)$/ )
		if(atom_match && atom_match[0]) {
			if(atom_match[1] || atom_match[2]) matches[0] = {str: atom_match[1] || atom_match[2]}
			else if(atom_match[3]) matches[0] = {num: Number(atom_match[3])}
			else if(atom_match[4]) matches[0] = {bool: atom_match[4]}
			else if(atom_match[5]) matches[0] = {key: atom_match[5]}
		} else eval_err("Unrecognized token", null, 0, expr)
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

function trim(str) {
	return str
		.replace(/^[\s\(\)]*/, '')
		.replace(/[\s\(\)]*$/, '')
}

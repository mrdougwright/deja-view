// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This parser is designed like a finite state machine 

// This is a flat O(n) where n is the length in characters of the expression

module.exports = parse
window.parse = parse

function parse(expr, node) {
	if(expr === undefined) return []
	expr = trim(expr)
	
	var atom_match = expr
		.match( /^(?:'([^']+?)')$|^(?:"([^"]+?)")$|^(\d+(?:\.\d+)?)$|^(true|false)$|^([^\s\(\)]+)$/ )
	if(atom_match && atom_match[0]) {
		if(atom_match[1] || atom_match[2]) return [{val: atom_match[1] || atom_match[2]}]
		else if(atom_match[3]) return [{val: Number(atom_match[3])}]
		else if(atom_match[4]) return [{val: atom_match[4] === 'true'}]
		else if(atom_match[5]) return [{key: atom_match[5]}]
	}

	var pos = 0, matches = []

	while(pos < expr.length) {
		if(expr[pos].match(/[\s)]/)) ++pos // Eat whitespace and extra close parens
		else {
			if(expr[pos].match(/["']/)) {
				var lookahead = find_delimiter(pos, expr, expr[pos]) + 1
				matches.push(expr.slice(pos, lookahead))
			} else if(expr[pos] === '(') {
				var lookahead = find_scope(pos, expr)
				matches.push(expr.slice(pos+1, lookahead-1))
			} else {
				var lookahead = find_delimiter(pos, expr, /[\(\[" ]/)
				matches.push(expr.slice(pos, lookahead))
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

function trim(str) {
	if(str === undefined) return
	return str.replace(/^[\s]*/, '').replace(/[\s]*$/, '')
}

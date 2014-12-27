var iter = require('./iter')

// A basic recursive descent parser
// Avoids actual recursion with a stack
// O(n) where n is the length of the lexemes
var parse = module.exports = function(lexemes, line) {
	line = line || '?'
	var current, stack = []
	while(lexemes.length) {
		var token = lexemes.shift()
		if(token.match(atoms.openParen)) {
			var newLevel = []
			if(current) stack.push(current)
			current = newLevel
		} else if(token.match(atoms.closeParen)) {
			var parent = stack.pop()
			if(parent) current = parent.concat([current])
		}
		else if(!current) parseErr(line, '?', token, 'expecting opening parentheses')
		else if(token.match(atoms.str)) current.push(['str', token])
		else if(token.match(atoms.num)) current.push(['num', token])
		else if(token.match(atoms.key)) current.push(token)
		else parseErr(line, '?', token, 'unexpected token')
	}
	// Parse implicit close parens at the end of the expr
	if(stack.length)
		current = iter.foldr(stack, current, function(prev, next) {return next.concat([prev])})
	return current
}

var atoms = {
	key: /[^ \()]+/, // any word - allows alpha, num, and symbols
	str: /(['"].+?['"])/,
	num: /(\d+(\.\d+)?)/, // string (anything surrounded by quotes) or number
	openParen: /\(/,
	closeParen: /\)/
}

function parseErr(line, col, token, msg) {
	throw new Error("Unable to parse view expression at line " + line + ", col ?: '" + token + "' expecting open paren")
}

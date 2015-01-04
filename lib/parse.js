// A basic recursive descent parser
// Avoids actual recursion with a stack
// O(n) where n is the length of the lexemes
var parse = module.exports = function(lexemes) {
	var current, stack = []
	while(lexemes.length) {
		var token = lexemes.shift()
		if(token === '(') {
			if(current) stack.push(current)
			var newLevel = current = []
		} else if(token === ')') {
			var parent = stack.pop()
			if(parent) {
				parent.push(current)
				current = parent
			}
		}
		else if(!current)
			throw new Error("Unable to parse view expression: " + token + "' expecting open paren")
		else current.push(token)
	}
	// Parse implicit close parens at the end of the expr
	if(stack.length) {
		for(var i = 0; i < stack.length; ++i) {
			parent.push(current)
			current = parent
		}
	}
	return current
}

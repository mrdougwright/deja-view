var deepGet = require('./deepGet'),
    parse = require('./parse')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
var evaluate = module.exports = function(expr, view) {

	// Parse the expression first
	if(typeof expr === 'string') {
		var subExprs = parse(expr)
		if(!subExprs) throw new Error("[deja-view] Unable to parse expression: " + expr)
		// De-nest any surrounding parens, eg. "(((a)))" -> "a"
		while(subExprs.length === 1 && (typeof subExprs[0] === 'string'))
			subExprs = parse(subExprs[0])
		var atom = subExprs[0]
	}
	// Pre-parsed expression
	else var atom = expr, subExprs = []

	while(typeof atom === 'string')
		atom = evaluate(atom, view)
	
	// Return a single value
	if(atom.num) return atom.num
	if(atom.str) return atom.str

	// Apply a function
	else if(atom.key) {
		var val = deepGet(atom.key, view.data)
		if(typeof val === "function")
			return val.apply(view, subExprs.slice(1))
		else {
			return (val === undefined ? '' : val)
		}
	}

	else if(typeof atom === 'function')
		return atom.apply(view, subExprs.slice(1))

}

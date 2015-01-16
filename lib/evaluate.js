var deepGet = require('./deepGet'),
    parse = require('./parse')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
var evaluate = module.exports = function(expr, view) {

	// Parse the expression first
	if(typeof expr === 'string') {
		var subExprs = parse(expr)
		if(!subExprs) return null
		// De-nest any surrounding parens, eg. "(((a)))" -> "a"
		while(subExprs.length === 1 && (typeof subExprs[0] === 'string'))
			subExprs = parse(subExprs[0])
		var atom = subExprs[0]
	}
	// Pre-parsed expression
	else var atom = expr

	// Return a single value
	if(atom.num || atom.str) return atom.num || atom.str

	// Apply a function
	else if(atom.key) {
		var val = deepGet(atom.key, view.data)
		if(typeof val === "function") return val.apply(view, subExprs.slice(1))
		else return val || ''
	}

	// The rare case where the first argument is itself a funciton that returns a
	// function that is then applied to the rest of the expression. I'm content
	// with this being recursive since it's rare
	else if(typeof atom === 'string')
		return evaluate(atom, view).apply(view, subExprs.slice(1))
}

var deepGet = require('./deepGet'),
	parse = require('./parse'),
	eval_err = require('./eval_err')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
var evaluate = module.exports = function(expr, view) {
	var subExprs = parse(expr), atom = subExprs[0]

	if(atom === undefined) {
		eval_err("Evaluation error", view.node, 0, expr)
		return ''
	}

	// Return a single value
	if(atom.num)  return atom.num
	if(atom.str)  return atom.str
	if(atom.bool) return atom.bool

	// Apply a function
	if(atom.key) {
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

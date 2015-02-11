var deep_get = require('./deep_get'),
	parse = require('./parse'),
	eval_err = require('./eval_err')

module.exports = evaluate
window.evaluate = evaluate

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
function evaluate(expr, view) {
	var subExprs = parse(expr), atom = subExprs[0]

	if(atom === undefined) {
		eval_err("Evaluation error", view.node, 0, expr)
		return ''
	}

	if(atom.num  !== undefined) return atom.num
	if(atom.str  !== undefined) return atom.str
	if(atom.bool !== undefined) return atom.bool

	// Apply a function
	if(atom.key) {
		var val = deep_get(atom.key, view, view._current_scope)
		if(typeof val === "function")
			return val.apply(view, subExprs.slice(1))
		else {
			return (val === undefined ? '' : val)
		}
	}

	else if(typeof atom === 'function')
		return atom.apply(view, subExprs.slice(1))

}

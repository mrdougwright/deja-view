var iter = require('./iter')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion with a stack
var evaluate = module.exports = function(expr, data) {
	//base-case
	data = data || {}
	console.log('expr', expr)

	if(expr instanceof Array) {
		// Singleton nested expression (eg. '[['a', 'b']]')
		if(expr.length === 1 && expr[0] instanceof Array) return evaluate(expr[0], data)
		// Primitives
		if(expr[0] === 'num') return Number(expr[1])
		if(expr[0] === 'str') return String(expr[1])
		// Function calls
		else {
			var fn = evaluate(expr[0], data)
			console.log('fn', fn)
			if(typeof fn === 'function') {
				var args = iter.map(expr.slice(1), function(e) {return evaluate(e, data)})
				return fn.apply(data, args)
			}
			else return fn
		}
	}

	// Fetch a value from data with a given key
	return data[expr]
}

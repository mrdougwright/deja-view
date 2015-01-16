var deepGet = require('./deepGet')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
var evaluate = module.exports = function(ast, view) {
	console.log('evaluating', JSON.stringify(ast))
	var stack = [{read: true, expr: ast}], returnVals = []

	while(stack.length) {
		var current = stack.pop()

		// Read and process more tokens
		if(current.read) {
			var expr = current.expr
			if(expr instanceof Array) {
				// Single nested expression, eg. [['a', 'b']] -> ['a', 'b']
				if(expr.length === 1 && expr[0] instanceof Array)
					stack.push({read: true, expr: expr[0]})
				// Function calls, eg. ['add', ['incr', 1], 2]
				else {
					stack.push({apply: true, length: expr.length}) // Apply a function of length expr.length
					for(var i = expr.length-1; i >= 0; --i) // But first, evaluate every term
							stack.push({read: true, expr: expr[i]})
				}
			}
			// Primitives and key look-up
			else if(expr.num) returnVals.push(Number(expr.num))
			else if(expr.str) returnVals.push(expr.str.replace(/['"]/g,''))
			else if(expr.key) returnVals.push(deepGet(expr.key, view.data) || '')
		}

		// Function application
		else if(current.apply) {
			var split = returnVals.length - current.length,
			    fn = returnVals[split]
			if(typeof fn === 'function') {
				var prev = returnVals.slice(0, split),
				    args = returnVals.slice(split + 1)
				console.log('applying function', fn, args, view)
				returnVals = prev.concat([function() {fn.apply(view, args)}])
			}
		}
		console.log('returnVals', returnVals)
	}

	console.log('final returnVAl', returnVals[0])
	debugger

	if(typeof returnVals[0] === 'function') return returnVals[0]()
	else return returnVals[0]
}


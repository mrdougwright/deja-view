var deep_get = require('./deep_get'), parse = require('./parse'), iter = require('./iter')

module.exports = evaluate

function evaluate(expr, view) {
	var stack = [{parse: expr}], results = []

	while(stack.length) {
		var call = stack.pop()

		// Apply a function
		if(call.apply_fn) {
			var args = results.slice(results.length - call.param_len).reverse()
			results = results.slice(0, results.length - call.param_len)
			if(view.parent && call.key.indexOf("parent") === 0)
				var output = call.apply_fn.apply(view.parent, args)
			else var output = call.apply_fn.apply(view, args)
			results.push(output)
		}

		// Parse an expression or return an atom
		else if(call.parse) {
			if(call.parse.val !== undefined)
				results.push(call.parse.val)
			else if(call.parse.key !== undefined) {
				var val = deep_get(call.parse.key, view)

				if(val && val._lazy) {
					stack.push({apply_fn: val._lazy, param_len: call.expr_len - call.pos - 1, key: call.parse.key})
					for(var i = 0, len = stack.length; i < len; ++i)
						results.push(stack.pop().parse)
				}

				else if(typeof val === 'function')
					stack.push({apply_fn: val, param_len: call.expr_len - call.pos - 1, key: call.parse.key})

				else results.push(val)
			}

			else eval_expr(call.parse, stack, results, view)
		}
	}

	if(results.length === 0) return undefined
	if(results.length === 1) return results[0]
	else return results
}

function eval_expr(expr, stack, results, view) {
	var exprs = parse(expr, view.comment)
	// The first sub-expression must be the key to a function
	if(exprs === undefined || exprs[0] === undefined) return

	if(exprs[0].val !== undefined) {
		results.push(exprs[0].val)
		return
	}

	var fn = deep_get(exprs[0].key, view)
	if(!fn) return

	if(fn._lazy) {
		for(var i = exprs.length-1; i > 0; --i)
			results.push(exprs[i])
		stack.push({apply_fn: fn._lazy, param_len: exprs.length-1, pos: 0, key: exprs[0].key})
	}

	else
		for(var i = 0, len = exprs.length; i < len; ++i)
			stack.push({parse: exprs[i], expr_len: exprs.length, pos: i})

}


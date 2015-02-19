var deep_get = require('./deep_get'), parse = require('./parse'), iter = require('./iter')

module.exports = evaluate

function evaluate(expr, view) {
	var stack = [{parse: expr, expr_len: 1}], result = []

	while(stack.length) {
		var call = stack.pop()

		// Apply a function
		if(call.apply_fn) {
			var args = result.slice(result.length - call.param_len)
			result = result.slice(0, result.length - call.param_len)
			if(view.parent && call.key.indexOf("parent") === 0)
				var output = call.apply_fn.apply(view.parent, args)
			else var output = call.apply_fn.apply(view, args)
			result.push(output)
		}

		// Parse a string expression
		else if(call.parse) {
			var sub_exprs = parse(call.parse, view.comment), substack = []
			if(sub_exprs === undefined) return
			// Push expressions to the stack right-to-left, which facilitates lazy evaluation
			for(var i = 0; i < sub_exprs.length; ++i) {
				var term = sub_exprs[i]
				if(term.val !== undefined) result.push(term.val) // Parsed value (num/str/bool)
				else if(typeof term === 'string') // Un-parsed string
					substack.unshift({parse: term, expr_len: sub_exprs.length, pos: i})
				else if(term.key) { // Parsed keyword (aka object property) on the view data
					var val = deep_get(term.key, view)

					// Eager evaluate a function (ie. fully evaluate all the terms before applying the fn)
					// Take the parameter length to be the remaining terms in the parent expr
					// eg. for 'add'
					// (add 1 2 3 4 5) -> param_len = 5
					// (incr add 1 2) -> param_len = 2 (pos is 1, expr_len is 4, 4-1-1 = 2)
					if(typeof val === "function") {
						var param_len = call.expr_len-call.pos-1
						stack.splice(stack.length - param_len, 0, {apply_fn: val, param_len: param_len, key: term.key})
					}

					// Lazy evaluate a function (ie. dont evaluate any terms and apply the
					// func to its unparsed arguments)
					else if(val && val._lazy) {
						var param_len = call.expr_len-call.pos-1
						for(var j = 0; j < param_len; ++j) result.push(stack.pop().parse)
						stack.push({apply_fn: val._lazy, param_len: param_len, key: term.key})
					}

					// Just push an atomic value
					else result.push(val)
				}
			}
			stack = stack.concat(substack)
		}
	}

	if(result.length === 0) return undefined
	if(result.length === 1) return result[0]
	return result
}


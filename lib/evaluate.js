var deep_get = require('./deep_get'), parse = require('./parse')

module.exports = evaluate

function evaluate(expr, view) {
	var stack = [{parse: expr}], result = []

	while(stack.length) {
		var call = stack.pop()

		// Apply a function
		if(call.apply_fn) {
			var args = result.slice(result.length-call.len)
			result = result.slice(0,result.length-call.len)
			result.push(call.apply_fn.apply(view, args))
		}

		// Lazy application (apply a function to unparsed strings on the stack)
		if(call.apply_lazy) {
			var args = stack.slice(0, call.len).map(function(c) {return c.parse})
			stack = stack.slice(call.len)
			result.push(call.apply_lazy.apply(view, args))
		}

		// Parse a string expression
		else if(call.parse) {
			var sub_exprs = parse(call.parse, view.comment)
			if(sub_exprs === undefined) return
			// Push expressions to the stack right-to-left, which facilitates lazy evaluation
			for(var i = sub_exprs.length-1; i >= 0; --i) {
				var term = sub_exprs[i]
				if(term.val) result.push(term.val) // Parsed value (num/str/bool)
				else if(typeof term === 'string') // Un-parsed string
					stack.push({parse: term, len: sub_exprs.length})
				else if(term.key) { // Parsed keyword (aka object property) on the view data
					var val = deep_get(term.key, view)
					if(typeof val === "function")
						// Eager-evaluate a function: splice the func application into the
						// stack before its parameters so that the params get evaluated first
						stack.splice(stack.length - (call.len-1), 0, {apply_fn: val, len: call.len-1})
					else if(val && val._lazy) {
						// Lazy-evaluate a function: push the function to the end of the stack so
						// the parameters are not evaluated by the time the application is
						// called
						stack.push({apply_lazy: val._lazy, len: call.len-1})
						i = -1 // bail parsing of remaining terms
					} else result.push(val)
				}
			}
		}
	}

	return (result.length === 1 ? result[0] : result)
}


(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var eachNode = require('./lib/eachNode')
var copy = require('./lib/copy')
var iter = require('./lib/iter')
var parse = require('./lib/parse')
var flatKeys = require('./lib/flatKeys')
var unflattenKeys = require('./lib/unflattenKeys')
var evaluate = require('./lib/evaluate')
var isExpr = require('./lib/isExpr')
var getKeys = require('./lib/getKeys')
var previousOpenTag = require('./lib/previousOpenTag')
var deepGet = require('./lib/deepGet')

var app = module.exports = {
	config: {},
	data: {},
	_bindings: {}
}

app.view = function(x) {
	var self = this
	if(x instanceof Array)
		return iter.map(x, function(key) { self.view(key) })
	if(arguments.length === 0)
		return self.data
	return evaluate(x, self)
}

app.child = function(x) {
	var childView = copy.shallow(this)
	childView.clear().render(x)
	childView.data = copy.deep(this.data)
	return childView
}

app.clear = function() { this._bindings = {}; return this }

app.def = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2)
		var obj = unflattenKeys(arguments[0], arguments[1])
	else
		var obj = arguments[0]

	copy.deep(obj, self.data)
	iter.each(flatKeys(obj), function(key) {
		if(self._bindings[key]) {
			iter.each(self._bindings[key], function(node) {
				self.evalComment(node)
			})
		}
	})
	return self
}

app.render = function(q) {
	var self = this

	if(q instanceof Array || q instanceof NodeList)
		iter.each(q, function(n) { self.render(n) })
	else if(typeof q === 'string')
		if(this.parentNode)
			var node = this.parentNode.querySelector(q)
		else
			var node = document.body.querySelector(q)
	else if(q instanceof Node) var node = q
	else var node = this.parentNode
	if(!node) throw new Error("[deja-view] Could not render into: " + q)

	eachNode(node, function(n) {
		// nodeType 8 is a comment
		if(n.nodeType === 8 && isExpr(n.textContent)) {
			var keys = getKeys(n.textContent)
			iter.each(keys, function(k) {
				self._bindings[k] = self._bindings[k] || []
				self._bindings[k].push(n)
			})
			self.evalComment(n)
		}
		return true
	})
	return self
}

app.evalComment = function(commentNode) {
	var self = this, node = previousOpenTag(commentNode)
	if(!node) return

	self.node = node; self.commentNode = commentNode
	var result = evaluate(commentNode.textContent, self)
	if(!result) return

	// If there's actually some result, then we interpolate it (ie. we inject the result into the dom):
	if(commentNode.nextSibling && commentNode.nextSibling.className === 'deja-put')
		var interp = commentNode.nextSibling
	else {
		var interp = document.createElement('span')
		interp.className = 'deja-put'
		commentNode.parentNode.insertBefore(interp, commentNode.nextSibling)
	}
	interp.innerHTML = result
}

app.incr = function(key) {
	this.def(key, Number(this.view(key)) + 1)
	return this
}

app.decr = function(key) {
	this.def(key, this.view(key) - 1)
	return this
}

app.toggle = function(key, value) {
	var existing = this.view(key)
	if(existing === value) this.def(key, null)
	else this.def(key, value)
	return this
}

app.push = function(key, val) {
	this.def(key, this.view(key).concat([val]))
	return this
}

app.pop = function(key) {
	var arr = this.view(key), val = arr.pop()
	this.def(key, arr)
	return val
}

app.concat = function(key, arr) {
	this.def(key, this.view(key).concat(arr))
	return this
}

// Default view helpers

app.def('set', function(key, val) {
	key = this.view(key)
	val = this.view(val)
	this.def(key, val)
})

app.def('show_if', function(pred) {
	if(this.view(pred)) this.node.style.display = ''
	else this.node.style.display = 'none'
})

app.def('hide_if', function(pred) {
	if(this.view(pred)) this.node.style.display = 'none'
	else this.node.style.display = ''
})

app.def('repeat', function(arr) {
	arr = this.view(arr)
	if(!arr) return
	this.node.style.display = 'none'
	this.node.removeChild(this.commentNode)

	if(this.node.nextSibling && this.node.nextSibling.className === 'deja-repeat') {
		var wrapper = this.node.nextSibling
		this.node.nextSibling.innerHTML = ''
	} else {
		var wrapper = document.createElement('span')
		wrapper.className = 'deja-repeat'
		this.node.parentNode.insertBefore(wrapper, this.node.nextSibling)
	}

	for(var i = 0; i < arr.length; ++i) {
		var cloned = this.node.cloneNode(true),
		    childView = this.child(cloned)
		cloned.style.display = ''
		childView.def('this', arr[i])
		if(typeof arr[i] === 'object') childView.def(arr[i])
		wrapper.appendChild(cloned)
		childView.clear() // Save memory quicker?
	}

	this.node.insertBefore(this.commentNode, this.node.firstChild)
	return false
})

app.def('add', function() {
	var self = this
	return iter.fold(arguments, 0, function(sum, term) {
		return sum + self.view(term)
	})
})

app.def('sub', function(x, y) {
	var self = this
	return iter.fold(arguments, 0, function(diff, term) {
		return diff - self.view(term)
	})
})

app.def('mul', function(x, y) {
	var self = this
	return iter.fold(arguments, 0, function(product, term) {
		return product * self.view(term)
	})
})

app.def('div', function(x, y) {
	var self = this
	return iter.fold(arguments, 0, function(quot, term) {
		return quot / self.view(term)
	})
})

app.def('incr', function(key) {
	key = this.view(key)
	var val = this.view(key)
	this.def(key, val + 1)
	return val + 1
})

app.def('decr', function(key) {
	key = this.view(key)
	var val = this.view(key)
	this.def(key, val - 1)
	return val - 1
})

app.def('class', function(val) {
	this.node.className += ' ' + this.view(val)
})

app.def('cat', function() {
	var self = this
	return iter.fold(arguments, '', function(str, term) {
		return str += self.view(term)
	})
})


iter.each(['change', 'click', 'dblclick', 'mousedown', 'mouseup',
	'mouseenter', 'mouseleave', 'scroll', 'blur', 'focus', 'input',
	'submit', 'keydown', 'keypress', 'keyup'],
	function(event) {
	app.def('on_' + event, function(expr) {
		if(!this.node) throw new Error("[deja-view] Element not found for on_" + event + " event: " + this.node, event)
		var self = this, node = self.node, args = arguments
		node['on' + event] = function(ev) {
			ev.preventDefault()
			self.node = node
			self.event = event
			self.view(expr)
		}
	})
})

app.def('do', function() {
	var self = this
	iter.each(arguments, function(arg) {
		self.view(arg)
	})
})

app.def('empty',  function(arr)  { arr = this.view(arr); return !arr || arr.length <= 0 })
app.def('not',  function(val)  { return !this.view(val)})
app.def('length', function(arr) { return this.view(arr).length})
app.def('attr', function(key, val) { this.node.setAttribute(this.view(key), this.view(val)) })
app.def('href', function(url) { this.node.setAttribute('href', this.view(url)) })
app.def('push', function(val, arrKey) { this.push(this.view(arrKey), this.view(val)) })
app.def('pop', function(arrKey) { this.pop(this.view(arrKey)) })
app.def('log', function(expr) { console.log(this.view(expr)) })

app.def('toggle', function(key, val) { this.toggle(this.view(key), this.view(val)) })

app.def('if', function(predicate, thenExpr, elseExpr) {
	if(this.view(predicate)) return this.view(thenExpr)
	else return this.view(elseExpr)
})

app.def('and', function() {
	var self = this
	for(var i = 0; i < arguments.length; ++i) {
		if(arguments[i] && !this.view(arguments[i])) return false
	}
	return true
})

app.def('or', function() {
	for(var i = 0; i < arguments.length; ++i)
		if(this.view(arguments[i])) return true
	return false
})

app.def('delay', function(ms, expr) {
	var self = this, timer = 0, ms = self.view(ms), node = self.node
	setTimeout(function() {
		self.node = node
		self.view(expr)
	}, ms)

	var timer = 0
	return function(ms, callback) {
		clearTimeout(timer)
		timer = setTimeout(callback, ms)
	}
})

app.def('input_value', function() { return this.node.value })

app.render(document.body)

/* TODO
	*
	* -Pre-evaluate each argument for each bound function
	* -Set node on the view ('this') for each def function
	*    (that way we don't have to keep track of node passing overhead)
	*
	* Requires event triggering system on data changes:
	* view.def('trigger', fn..)
	* view.def('when', fn..)
	*
	* Requires array representation in view lanaguage:
	* view.def('concat', fn..)
	*
	* partial application, eg:
	* view.def('add', 1, function(n) { return n + 1})
	*
	* true and false atoms
	*/

},{"./lib/copy":2,"./lib/deepGet":3,"./lib/eachNode":4,"./lib/evaluate":5,"./lib/flatKeys":6,"./lib/getKeys":7,"./lib/isExpr":8,"./lib/iter":9,"./lib/parse":10,"./lib/previousOpenTag":11,"./lib/unflattenKeys":12}],2:[function(require,module,exports){
// mutating object copy utilities

var copy = module.exports = {}

copy.shallow = function(from, to) {
	to = to || {}
	for(var key in from) to[key] = from[key]
	return to
}

copy.deep = function(from, to) {
	to = to || {}
	var stack = [{from: from, to: to}]
	while(stack.length) {
		var current = stack.pop()
		for(var key in current.from) {
			if(current.from[key] && current.from[key].constructor === Object) {
				if(!current.to[key] || current.to[key].constructor !== Object) current.to[key] = current.from[key]
				stack.push({from: current.from[key], to: current.to[key]})
			}
			else
				current.to[key] = current.from[key]
		}
	}
	return to
}

window.copy = copy

},{}],3:[function(require,module,exports){
// Get a possibly nested set of keys 
// eg. deepGet('x', {x: 1}) -> 1
// eg. deepGet('x.y', {x: {y: 1}}) -> 1
// eg. deepGet('x.y', {'x.y': 1}) -> 1
module.exports = function deepGet(keys, obj) {
	if(obj[keys]) return obj[keys]
	var result = obj, keys = keys.split('.')
	for(var i = 0; i < keys.length; ++i) {
		if(result[keys[i]]) result = result[keys[i]]
		else return
	}
	return result
}

},{}],4:[function(require,module,exports){
// Traverse a DOM tree and apply a function to each node
// You can bail the traversal early if the fn returns false

var iter = require('./iter')

var eachNode = module.exports = function(node, fn) {
	var stack = [node]
	while (stack.length) {
		var current = stack.pop()
		if(fn(current))
			for(var i = 0; i < current.childNodes.length; ++i)
				stack.push(current.childNodes[i])
	}
}

// Note: a NodeList (which is what we get from node.childNodes) does not have Array methods

},{"./iter":9}],5:[function(require,module,exports){
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
	if(atom.num || atom.str) return atom.num || atom.str

	// Apply a function
	else if(atom.key) {
		var val = deepGet(atom.key, view.data)
		if(typeof val === "function")
			return val.apply(view, subExprs.slice(1))
		else return val || ''
	}

	else if(typeof atom === 'function')
		return atom.apply(view, subExprs.slice(1))

}

},{"./deepGet":3,"./parse":10}],6:[function(require,module,exports){
// Return all the flat key names for an object
// eg: {a: 1, b: {c: 2, {d: 1}}, e: [{q: 'q'}, {q: 'q'}]} // -> ['a', 'b', 'b.c', 'b.c.d', 'e']
// This is useful for binding nested keys 'a.b.c' to change events
module.exports = function flatKeys(obj) {
	var stack = [[obj, '']], // a pair of current object level and current parent key name
	    keys = []
	while(stack.length) {
		var next = stack.pop(), currentObj = next[0], parentKey = next[1], nestedKey
		for(var key in currentObj) {
			nestedKey = key
			if(parentKey.length) nestedKey = parentKey + '.' + nestedKey
			keys.push(nestedKey)
			if(currentObj[key] && currentObj[key].constructor === Object)
				stack.push([currentObj[key], nestedKey])
		}
	}
	return keys
}

},{}],7:[function(require,module,exports){
// Given a view s-expr, return all the keywords
// eg. "(add 1 (incr x))" -> ["add", "incr", "x"]

module.exports = function getKeys(expr) {
	var keys = [],
	    matches = [],
	    re = /[\( \^]([^ \(\)'"0-9]+)(?=[\) \$])/g
	while(matches) {
		matches = re.exec(expr)
		if(matches && matches[1])
			keys.push(matches[1])
	}
	return keys
}

},{}],8:[function(require,module,exports){
// Is the given string a view expression? (ie. is it surrounded by parens?)
var isExpr = module.exports = function(str) {
	return str.match(/^\s*\(.+/)
}


},{}],9:[function(require,module,exports){
// Very simple & tiny browser-compatible map/fold/each/filter without the extras

var iter = module.exports = {}

iter.each = function(arr, fn) {
	if(!arr) return
	for(var i = 0; i < arr.length; ++i)
		fn(arr[i], i)
}

iter.map = function(arr, fn) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		result.push(fn(arr[i], i))
	return result
}

iter.fold = function(arr, init, fn) {
	if(!arr) return init
	var result = init
	for(var i = 0; i < arr.length; ++i)
		result = fn(result, arr[i], i)
	return result
}

iter.filter = function(arr, pred) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		if(pred(arr[i], i)) result.push(arr[i])
	return result
}

},{}],10:[function(require,module,exports){
// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This is a flat O(n) where n is the number of characters in the expression

module.exports = function parse(expr) {
	var matches = []

	for(var position = 0; position < expr.length;) {

		// Return a nested expression bounded by parens
		if(expr[position] === "(") {
			++position
			var start = position
			for(var level = 1; level > 0 && position <= expr.length; ++position) {
				if(expr[position] === ')') --level
				else if(expr[position] === '(') ++level
			}
			matches.push(expr.slice(start, position - 1))
		}

		// Advance on whitespace
		else if(expr[position].match(/\s/)) {
			++position
		}

		// Unmatched closing parens
		else if(expr[position] === ")") {
			throw new Error("Unmatched closing paren")
		}

		// Return a string, number, or keyword
		else {
			var atomMatch = expr.slice(position).match( /^(?:'(.+?)')|(?:"(.+?)")|(\d+(?:\.\d+)?)|([^\s\(\)]+)/ )
			if(atomMatch && atomMatch[0]) {
				if(atomMatch[1] || atomMatch[2]) matches.push({str: atomMatch[1] || atomMatch[2]})
				else if(atomMatch[3]) matches.push({num: Number(atomMatch[3])})
				else if(atomMatch[4]) matches.push({key: atomMatch[4]})
				position += atomMatch[0].length
			} else throw new Error("Unexpected token: " + expr)
		}
	}
	return matches
}

},{}],11:[function(require,module,exports){
// Return the "previous tag" for a given node, disregarding tree structure If
// you flatten the tree structure of the DOM into just a top-down list of
// nodes, this will just return the node above the current node.

module.exports = function previousOpenTag(node) {
	var prev = node
	while(prev && prev.nodeType !== 1) {
		prev = prev.previousSibling
	}
	if(prev) return prev
	else return node.parentNode
}


},{}],12:[function(require,module,exports){
var iter = require('./iter')

module.exports = function unflattenKeys(keyStr, val) {
	if(!keyStr || !keyStr.length) throw new Error("[deja-view] Invalid key used for accessing view data: " + keyStr)
	var keys = keyStr.split('.'), obj = {}, nested = obj
	for(var i = 0; i < keys.length - 1; ++i) {
		nested[keys[i]] = {}
		nested = nested[keys[i]]
	}
	nested[keys[keys.length-1]] = val
	return obj
}

},{"./iter":9}]},{},[1]);

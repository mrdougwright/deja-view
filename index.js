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
	if(!node) return

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
	var result = evaluate(commentNode.textContent.slice(1), self)
	if(result === undefined || result === null || result === false || result === '') return

	// If there's actually some result, then we interpolate it (ie. we inject the result into the dom):
	if(commentNode.nextSibling && commentNode.nextSibling.className === 'deja-put')
		var interp = commentNode.nextSibling
	else {
		var interp = document.createElement('span')
		interp.className = 'deja-put'
		commentNode.parentNode.insertBefore(interp, commentNode.nextSibling)
	}

	interp.innerHTML = String(result)
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

app.render(document.body)

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
	var val = Number(this.view(key))
	if(val) {
		this.def(key, val + 1)
		return val + 1
	}
})

app.def('decr', function(key) {
	key = this.view(key)
	var val = this.view(key)
	this.def(key, val - 1)
	return val - 1
})

add_class = function(node, class_name) {
	if(node.className.indexOf(class_name) === -1)
		node.className += ' ' + class_name
}

remove_class = function(node, class_name) {
	node.className = node.className.replace(class_name, '')
}

app.def('class', function(class_name) {
	add_class(this.node, this.view(class_name))
})

app.def('class_if', function(predicate, class_name) {
	predicate = this.view(predicate)
	if(predicate) add_class(this.node, this.view(class_name))
	else remove_class(this.node, this.view(class_name))
})

app.def('toggle_class', function(class_name) {
	class_name = this.view(class_name)
	var index = this.node.className.indexOf(class_name)
	if(index !== -1)
		this.node.className = this.node.className.slice(index, class_name.length)
	else
		this.node.className += ' ' + class_name
})

app.def('remove_class', function(class_name) {
	remove_class(this.node, this.view(class_name))
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
			if(!this.node) return
			var self = this, node = self.node, args = arguments
			node['on' + event] = function(ev) {
				ev.preventDefault()
				self.node = node
				self.event = event
				self.view(expr)
			}
		})
})

app.def('any_event', function() {

	var expr = arguments[arguments.length - 1]
	for(var i = 0; i < arguments.length - 1; ++i) {
		this.view(arguments[i] + ' (' + expr + ')')
	}
})

app.def('do', function() {
	var self = this
	iter.each(arguments, function(arg) {
		self.view(arg)
	})
})

app.def('empty',  function(arr)  { arr = this.view(arr); return !arr || arr.length <= 0 })
app.def('not',  function(val)  { return !this.view(val)})

app.def('length', function(arr) {
	arr = this.view(arr)
	if(!arr) return 0
	return arr.length
})

app.def('attr', function(key, val) { this.node.setAttribute(this.view(key), this.view(val)) })
app.def('href', function(url) { this.node.setAttribute('href', this.view(url)) })
app.def('push', function(val, arrKey) { this.push(this.view(arrKey), this.view(val)) })
app.def('pop', function(arrKey) { this.pop(this.view(arrKey)) })
app.def('log', function(expr) { console.log(this.view(expr)) })

app.def('css', function(style_rule, val) {
	style_rule = this.view(style_rule)
	val = this.view(val)
	this.node.style[style_rule] = val
})

app.def('toggle', function(key, val) { this.toggle(this.view(key), this.view(val)) })

app.def('if', function(predicate, thenExpr, elseExpr) {
	if(this.view(predicate)) return this.view(thenExpr)
	else if(elseExpr) return this.view(elseExpr)
})

app.def('and', function() {
	var self = this
	for(var i = 0; i < arguments.length; ++i) {
		if(arguments[i] && !this.view(arguments[i])) return false
	}
	return true
})

app.def('or', function() {
	for(var i = 0; i < arguments.length; ++i) {
		var term = this.view(arguments[i])
		if(term) return term
	}
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

app.def('set_value', function(val) {
	this.node.value = this.view(val)
})

app.def('select_option', function(val) {
	val = this.view(val)
	var option = this.node.querySelector("option[value='" + val + "']")
	if(option) option.setAttribute('selected', 'selected')
})

app.def('style', function(style_rule, val) {
	this.node.style[this.view(style_rule)] = this.view(val)
})

app.def('form_data', function() {
	return new FormData(this.node)
})

app.def('eq', function() {
	var fn = function(x, y) { return x == y }
	return compare(fn, arguments, this)
})

app.def('<', function() {
	var fn = function(x, y) { return x < y }
	return compare(fn, arguments, this)
})

app.def('>', function() {
	var fn = function(x, y) { return x > y }
	return compare(fn, arguments, this)
})

app.def('<=', function() {
	var fn = function(x, y) { return x <= y }
	return compare(fn, arguments, this)
})

app.def('>=', function() {
	var fn = function(x, y) { return x >= y }
	return compare(fn, arguments, this)
})

function compare(fn, args, view) {
	var last = view.view(args[0])
	for(var i = 1; i < args.length; ++i) {
		if(!fn(last, view.view(args[i]))) return false
		last = view.view(args[i])
	}
	return true
}

app.def('reload', function() {
	window.location.reload()
})

app.def('redirect', function(url) {
	window.location.href = this.view(url)
})

/* TODO
	*
	* - Print comment node on exceptions
	*   - write a little exception printing lib for dejaview
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

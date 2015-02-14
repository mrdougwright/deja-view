var each_node = require('./lib/each_node'),
	copy = require('./lib/copy'),
	iter = require('./lib/iter'),
	parse = require('./lib/parse'),
	flatten_keys = require('./lib/flatten_keys'),
	unflatten_keys = require('./lib/unflatten_keys'),
	evaluate = require('./lib/evaluate'),
	is_expr = require('./lib/is_expr'),
	get_keys = require('./lib/get_keys'),
	prev_open_tag = require('./lib/prev_open_tag')

var app = module.exports = { _bindings: {}}

app.view = function(x) {
	if(arguments.length === 0) return this
	if(typeof x === 'string') return evaluate(x, this)
	return x
}

app.def = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2) var obj = unflatten_keys(arguments[0], arguments[1])
	else var obj = arguments[0]

	for(var key in obj) {
		if(obj[key] && obj[key].constructor === Object && self[key] && self[key].constructor === Object) {
			if(self.hasOwnProperty(key))
				copy.deep(obj[key], self[key])
			else // Make a complete copy so we do not affect objects in parents and siblings
				self[key] = copy.deep(obj[key], copy.deep(self[key]))
		} else {
			self[key] = obj[key]
		}
	}

	iter.each(flatten_keys(obj), function(key) {
		if(self._bindings[key])
			iter.each(self._bindings[key], function(n) { self.eval_comment(n) })
	})
	return self
}

app.def('set', function(key, val) {
	this.def(key, val)
})

app.def('set_at', function(arr_key, index, val) {
	var arr = this.view(arr_key)
	copy.deep(val, arr[index])
	this.def(arr_key, arr)
})

app.def_lazy = function(key,fn) { this.def(key, {_lazy: fn}) }

app.render = function(node) {
	var self = this
	each_node(node, function(n) {
		var cont = true
		if(n.nodeType === 8 && is_expr(n.textContent)) { // nodeType 8 == comment
			var keys = get_keys(n.textContent)
			iter.each(keys, function(k) {
				self._bindings[k] = self._bindings[k] || []
				if(self._bindings[k].indexOf(n) === -1) self._bindings[k].push(n)
			})
			var result = self.eval_comment(n)
			if(result && result.skip) {
				cont = false
			}
		}
		return cont
	})
	return self
}

app.clear_bindings = function() {this._bindings = {}; return this}

app.eval_comment = function(comment) {
	var self = this, prev_node = self.node
	self.node = prev_open_tag(comment)
	self.comment = comment
	var result = evaluate(comment.textContent, self)
	if(result === [] || result === undefined || result === null || result === NaN || result == self || !self.node || !comment.parentNode || result.skip)
		return
	var interp = comment.nextSibling
	if(!interp || interp.className !== 'deja-put') {
		interp = document.createElement('span')
		interp.className = 'deja-put'
		comment.parentNode.insertBefore(interp, comment.nextSibling)
	}
	interp.innerHTML = String(result)
	return result
}

// Inherit a view & namespace the parent! TODO
app.child = function() {
	var child_view = Object.create(this)
	child_view._bindings = Object.create(this._bindings, {})
	child_view.parent = this
	return child_view
}

// Default view helpers

app.def('no_op', function() {})
app.def('id', function(x) {return x})

// Array funcs

app.def('concat', function(arr1_key, arr2) {
	var arr1 = this.view(arr1_key)
	this.def(arr1_key, arr1.concat(arr2))
	return arr1
})

app.def('push', function(val, arr_key) {
	var arr = this.view(arr_key)
	if(!arr.length) arr = []
	arr.push(val)
	this.def(arr_key, arr)
})

app.def('pop', function(arr_key) {
	var arr = this.view(arr_key), val = arr.pop()
	this.def(arr_key, arr)
	return val
})

app.def('show_if', function(pred) {
	if(pred) this.node.style.display = ''
	else this.node.style.display = 'none'
})

app.def('hide_if', function(pred) {
	if(pred) this.node.style.display = 'none'
	else this.node.style.display = ''
})

app.def('repeat', function(arr) {
	var self = this
	self.node.style.display = 'none'
	self.node.removeChild(self.comment)

	var wrapper = self.node.nextSibling
	if(!wrapper || wrapper.className !== 'deja-repeat') {
		wrapper = document.createElement('span')
		wrapper.className = 'deja-repeat'
		self.node.parentNode.insertBefore(wrapper, self.node.nextSibling)
	} else while(wrapper.firstChild) wrapper.removeChild(wrapper.firstChild)

	iter.each(arr, function(x, i) {
		var cloned = self.node.cloneNode(true)
		cloned.style.display = ''
		var child = self.child().clear_bindings().def('each', x).def(x).def(x).render(cloned)
		wrapper.appendChild(cloned)
	})

	self.node.insertBefore(self.comment, self.node.firstChild)
	return {skip: true}
})

app.def('add', function() { return sum(arguments) })
app.def('sub', function() { return diff(arguments) })
app.def('mul', function() { return prod(arguments) })
app.def('div', function(x,y) { return x/y })

app.def('incr', function(key) {
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val + 1)
	return this.view(key)
})

app.def('decr', function(key) {
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val - 1)
	return val - 1
})

app.def('add_class', function(class_name) { add_class(this.node, class_name) })
app.def('remove_class', function(class_name) { remove_class(this.node, class_name) })

app.def('toggle_class', function(class_name) {
	if(this.node.className.indexOf(class_name)) remove_class(this.node, class_name)
	else add_class(this.node, class_name)
})

app.def('class_if', function(pred, class_name) {
	if(pred) add_class(this.node, class_name)
	else remove_class(this.node, class_name)
})

app.def('cat', function() {
	return iter.fold(arguments, '', function(str, term) { return str += term })
})

app.def_lazy('on', function(events) {
	if(!this.node) return
	var self = this, node = self.node, args = arguments
	events = this.view(events)
	if(!(events instanceof Array)) events = [events]

	iter.each(events, function(ev) {
		node['on' + ev] = function(e) {
			e.preventDefault()
			self.node = node
			for(var i = 1; i < args.length; ++i) self.view(args[i])
		}
	})
})

app.def('empty',  function(arr) { return !arr || !arr.length })
app.def('length', function(arr) { return (arr ? arr.length : 0) })
app.def('tail', function(arr) { return arr.slice(1) })
app.def('init', function(arr) { return arr.slice(0, arr.length-1) })
app.def('head', function(arr) {return arr[0]})
app.def('attr', function(key, val) { this.node.setAttribute(key, val) })
app.def('get_value', function() { return this.node.value })
app.def('set_value', function(val) { this.node.value = val })
app.def('reload', function() { window.location.reload() })
app.def('redirect', function(url) { window.location.href = url })
app.def('stringify', function(obj) { return JSON.stringify(obj) })
app.def('form_data', function() { return new FormData(this.node) })
app.def('log', function() { console.log.apply(console, arguments) })

app.def('toggle', function(key, val) {
	var existing = this.view(key)
	if(existing === val) this.def(key, null)
	else this.def(key, val)
})

app.def('css', function(style_rule, val) { this.node.style[style_rule] = val })

app.def_lazy('if', function(predicate, then_expr, else_expr) {
	if(this.view(predicate)) return this.view(then_expr)
	else return this.view(else_expr)
})

app.def_lazy('delay', function(ms, expr) {
	var self = this
	delay(self.view(ms), function() {self.view(expr)})
})

app.def('select_option', function(val) {
	var option = this.node.querySelector("option[value='" + val + "']")
	if(option) option.setAttribute('selected', 'selected')
})

app.def('not',  function(val) {return !val})
app.def('eq', function() { return compare(function(x, y) { return x == y }, arguments, this) })
app.def('<', function() { return compare(function(x, y) { return x < y }, arguments, this) })
app.def('>', function() { return compare(function(x, y) { return x > y }, arguments, this) })
app.def('<=', function() { return compare(function(x, y) { return x <= y }, arguments, this) })
app.def('>=', function() { return compare(function(x, y) { return x >= y }, arguments, this) })

app.def('all', function() {
	for(var i = 0; i < arguments.length; ++i) if(!arguments[i]) return false
	return arguments[arguments.length-1]
})

app.def('any', function() {
	for(var i = 0; i < arguments.length; ++i) if(arguments[i]) return arguments[i]
	return false
})

app.render(document.body)

// Utilities

function sum(ns) {return iter.fold(ns, 0, function(sum, n) {return sum+n})}
function diff(ns) {return iter.fold(ns, 0, function(diff, n) {return diff-n})}
function prod(ns) {return iter.fold(ns, 1, function(prod, n) {return prod*n})}
function add_class(node, class_name) { if(node.className.indexOf(class_name) === -1) node.className += ' ' + class_name }
function remove_class(node, class_name) { node.className = node.className.replace(class_name, '') }

// N-ary general purpose comparator func
function compare(fn, args) {
	var last = args[0]
	for(var i = 1; i < args.length; ++i) {
		if(!fn(last, args[i])) return false
		last = args[i]
	} return true
}

window.compare = compare

var delay = (function() {
	var timer = 0
	return function(ms, callback) {
		clearTimeout(timer)
		timer = setTimeout(callback, ms)
	}
})()

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
	var self = this
	if(typeof x !== 'string') return x
	if(x instanceof Array) return iter.map(x, function(key) { self.view(key) })
	if(arguments.length === 0) return self
	return evaluate(x, self)
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
		if(self._bindings[key]) {
			iter.each(self._bindings[key], function(n) { self.eval_comment(n) })
		}
	})
	return self
}

app.def_lazy = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2) var obj = unflatten_keys(arguments[0], arguments[1])
	else var obj = arguments[0]
}

app.render = function(node) {
	var self = this
	each_node(node, function(n) {
		var cont = true
		if(n.nodeType === 8 && is_expr(n.textContent)) { // nodeType 8 == comment
			var keys = get_keys(n.textContent)
			iter.each(keys, function(k) {
				self._bindings[k] = self._bindings[k] || []
				self._bindings[k].push(n)
			})
			var result = self.eval_comment(n)
			cont = !result || !result.skip
		}
		return cont
	})
	return self
}

app.eval_comment = function(comment) {
	var self = this
	self.node = prev_open_tag(comment)
	self.comment = comment
	var result = evaluate(comment.textContent, self)
	if(result === undefined || result === null || result === NaN || !self.node || !comment.parentNode || result.skip)
		return result
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
	child_view._bindings = {}
	child_view.parent = this
	return child_view
}

// Default view helpers

app.def('concat', function(arr1_key, arr2) {
	arr1_key = this.view(arr1_key)
	arr2 = this.view(arr2)
	var arr1 = this.view(arr1_key)
	arr1 = arr1.concat(arr2)
	this.def(arr1_key, arr1)
})

app.def('push', function(val, arr_key) {
	val = this.view(val)
	arr_key = this.view(arr_key)
	var arr = this.view(arr_key)
	if(!arr.length) arr = []
	arr.push(val)
	this.def(arr_key, arr)
})

app.def('pop', function(arr_key) {
	arr_key = this.view(arr_key)
	var arr = this.view(arr_key)
	arr.pop()
	this.def(arr_key, arr)
})

app.def('set', function(key, val) {
	this.def(this.view(key), this.view(val))
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
	var self = this, arr = self.view(arr)
	self.node.style.display = 'none'
	self.node.removeChild(self.comment)
	self.def("each", arr)

	var wrapper = self.node.nextSibling
	if(!wrapper || wrapper.className !== 'deja-repeat') {
		wrapper = document.createElement('span')
		wrapper.className = 'deja-repeat'
		self.node.parentNode.insertBefore(wrapper, self.node.nextSibling)
	} else while(wrapper.firstChild) wrapper.removeChild(wrapper.firstChild)

	iter.each(arr, function(x, i) {
		var cloned = self.node.cloneNode(true)
		cloned.style.display = ''
		self.child().def(x).render(cloned)
		wrapper.appendChild(cloned)
	})

	self.node.insertBefore(self.comment, self.node.firstChild)
	return {skip: true}
})

app.def('+', function() {
	var self = this
	return iter.fold(arguments, 0, function(sum, term) {
		return sum + self.view(term)
	})
})

app.def('-', function() {
	var self = this
	return iter.fold(arguments, 0, function(diff, term) {
		return diff - self.view(term)
	})
})

app.def('mul', function() {
	var self = this
	return iter.fold(arguments, 0, function(product, term) {
		return product * self.view(term)
	})
})

app.def('div', function(x,y) {
	var self = this
	return self.view(x)/self.view(y)
})

app.def('incr', function(key) {
	key = this.view(key)
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val + 1)
	return val + 1
})

app.def('decr', function(key) {
	key = this.view(key)
	var val = Number(this.view(key))
	if(val === undefined) return
	this.def(key, val - 1)
	return val - 1
})

function add_class(node, class_name) {
	if(node.className.indexOf(class_name) === -1)
		node.className += ' ' + class_name
}

function remove_class(node, class_name) {
	node.className = node.className.replace(class_name, '')
}

app.def('add_class', function(class_name) {
	add_class(this.node, this.view(class_name))
})

app.def('remove_class', function(class_name) {
	remove_class(this.node, this.view(class_name))
})

app.def('toggle_class', function(class_name) {
	class_name = this.view(class_name)
	if(this.node.className.indexOf(class_name))
		remove_class(this.node, class_name)
	else
		add_class(this.node, class_name)
})

app.def('class_if', function(pred, class_name) {
	if(this.view(pred)) add_class(this.node, this.view(class_name))
	else remove_class(this.node, this.view(class_name))
})

app.def('cat', function() {
	var self = this
	return iter.fold(arguments, '', function(str, term) { return str += self.view(term) })
})

iter.each(['change', 'click', 'dblclick', 'mousedown', 'mouseup',
	'mouseenter', 'mouseleave', 'scroll', 'blur', 'focus', 'input',
	'submit', 'keydown', 'keypress', 'keyup'],
	function(event) {
		app.def('on_' + event, function(expr) {
			if(!this.node) return
			var self = this, node = self.node, existing = node['on' + event]
			node['on' + event] = function(ev) {
				ev.preventDefault()
				if(typeof existing === 'function') existing(ev)
				self.node = node
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
	iter.each(arguments, function(arg) { self.view(arg) })
})

app.def('empty',  function(arr) {
	arr = this.view(arr)
	return !arr || !arr.length
})

app.def('length', function(arr) {
	arr = this.view(arr)
	return (arr ? arr.length : 0)
})

app.def('tail', function(arr) {
	return this.view(arr).slice(1)
})

app.def('init', function(arr) {
	arr = this.view(arr)
	return arr.slice(0, arr.length-1)
})

app.def('head', function(arr) {return this.view(arr)[0]})
app.def('index', function(i, arr) {return this.view(arr)[this.view(i)]})

app.def('attr', function(key, val) { this.node.setAttribute(this.view(key), this.view(val)) })
app.def('href', function(url) { this.node.setAttribute('href', this.view(url)) })
app.def('src', function(url) { this.node.setAttribute('src', this.view(url)) })
app.def('log', function(expr) { console.log(this.view(expr)) })
app.def('get_value', function() { return this.node.value })
app.def('set_value', function(val) { this.node.value = this.view(val) })
app.def('reload', function() { window.location.reload() })
app.def('redirect', function(url) { window.location.href = this.view(url) })
app.def('stringify', function(obj) { return JSON.stringify(this.view(obj)) })
app.def('form_data', function() { return new FormData(this.node) })

app.def('toggle', function(key, val) {
	key = this.view(key)
	val = this.view(val)
	var existing = this.view(key)
	if(existing === val) this.def(key, null)
	else this.def(key, val)
})

app.def('css', function(style_rule, val) {
	style_rule = this.view(style_rule)
	val = this.view(val)
	this.node.style[style_rule] = val
})

app.def('if', function(predicate, thenExpr, elseExpr) {
	if(this.view(predicate)) return this.view(thenExpr)
	else if(elseExpr) return this.view(elseExpr)
})

var delay = (function() {
	var timer = 0
	return function(ms, callback) {
		clearTimeout(timer)
		timer = setTimeout(callback, ms)
	}
})()

app.def('delay', function(ms, expr) {
	var self = this
	delay(self.view(ms), function() {self.view(expr)})
})

app.def('select_option', function(val) {
	val = this.view(val)
	var option = this.node.querySelector("option[value='" + val + "']")
	if(option) option.setAttribute('selected', 'selected')
})

app.def('style', function(style_rule, val) {
	this.node.style[this.view(style_rule)] = this.view(val)
})

// N-ary general purpose comparator func
function compare(fn, args, view) {
	var last = view.view(args[0])
	for(var i = 1; i < args.length; ++i) {
		if(!fn(last, view.view(args[i]))) return false
		last = view.view(args[i])
	} return true
}

app.def('==', function() {
	return compare(function(x, y) { return x == y }, arguments, this)
})

app.def('<', function() {
	return compare(function(x, y) { return x < y }, arguments, this)
})

app.def('>', function() {
	return compare(function(x, y) { return x > y }, arguments, this)
})

app.def('<=', function() {
	return compare(function(x, y) { return x <= y }, arguments, this)
})

app.def('>=', function() {
	return compare(function(x, y) { return x >= y }, arguments, this)
})

app.def('all', function() {
	return compare(function(x,y) {return x && y}, arguments, this)
})

app.def('any', function() {
	for(var i = 0; i < arguments.length; ++i) {
		if(this.view(arguments[i])) return this.view(arguments[i])
	} return false
})

app.def('not',  function(val) {return !this.view(val)})

app.render(document.body)

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
var ev = require('./lib/ev')
var deepGet = require('./lib/deepGet')

var app = module.exports = {
	config: {},
	data: {},
	_bindings: {}
}

app.view = function(x) {
	var self = this
	if(arguments.length > 1)
		return iter.map(arguments, function(a) { view(a) })
	if(!arguments.length)
		return self.data
	if(x instanceof Node)
		return self.render(x)
	return evaluate(x, self)
}

app.child = function(x) {
	if(typeof x === 'string')
		var childNode = this.parentNode.querySelector(x)
	else if(x instanceof Node)
		var childNode = x
	else
		var childNode = this.parentNode

	if(!childNode) throw new Error("[deja-view] Could not find child node: " + x)

	var childView = copy.shallow(this)
	childView.clear() 
	childView.render(childNode)
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

	copy.shallow(obj, self.data)
	iter.each(flatKeys(obj), function(key) {
		if(self._bindings[key]) {
			iter.each(self._bindings[key], function(node) {
				self.renderNode(node)
			})
		}
	})
	return self
}

app.render = function(parentNode) {
	var self = this
	self.parentNode = parentNode
	if(parentNode instanceof Array || parentNode instanceof NodeList)
		iter.each(parentNode, function(n) { self.render(n) })

	eachNode(parentNode, function(node) {
		// nodeType 8 is a comment
		if(node.nodeType === 8 && isExpr(node.textContent)) {
			iter.each(getKeys(node.textContent), function(k) {
				self._bindings[k] = self._bindings[k] || []
				self._bindings[k].push(node)
			})
			self.renderNode(node)
		}
		return true
	})
	return self
}

app.renderNode = function(commentNode) {
	var self = this
	self.node = previousOpenTag(commentNode) // this.node is the comment's previous open tag (usually the parent node)
	if(!self.node) return
	self.commentNode = commentNode
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
	this.def(key, this.get(key) + 1)
	return this
}

app.decr = function(key) {
	this.def(key, this.get(key) - 1)
	return this
}

app.toggle = function(key, value) {
	var existing = this.get(key)
	if(existing === val) this.def(key, null)
	else this.def(key, val)
	return this
}

app.push = function(key, val) {
	this.def(key, this.get(key).concat([val]))
	return this
}

app.pop = function(key) {
	var arr = this.view(key), val = arr.pop()
	this.def(key, arr)
	return val
}

app.concat = function(key, arr) {
	this.def(key, this.get(key).concat(arr))
	return this
}

// Default view helpers

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
	if(!arr || !arr.length) return
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

app.def('add', function(x, y) { return this.view(x) + this.view(y) })
app.def('incr', function(x) { return this.view(x) + 1 })
app.def('decr', function(x) { return this.view(x) - 1 })

app.def('class', function(val) {
	this.node.className += ' ' + this.view(val)
})

iter.each(ev.events, function(event) {
	app.def('on_' + event, function(expr) {
		ev.bind(this.node, event, function(ev) {
			app.def('event', ev)
			app.view(expr)
		})
	})
})

app.def('empty',  function(arr)  {arr = this.view(arr); return arr && arr.length <= 0})
app.def('length', function(arr) {return this.view(arr).length})
app.def('attr', function(key, val) { this.node.setAttribute(this.view(key), this.view(val)) })
app.def('href', function(url) { this.node.setAttribute('href', this.view(url)) })
app.def('push', function(val, arrKey) { this.push(this.view(arrKey), this.view(val)) })
app.def('pop', function(arrKey) { this.pop(this.view(arrKey)) })
app.def('toggle', function(key, val) { this.toggle(this.view(key), this.view(val)) })

app.def('if', function(predicate, thenExpr, elseExpr) {
	if(view(predicate)) return view(thenExpr)
	else return view(elseExpr)
})

app.def('all', function() {

	for(var i = 0; i < arguments.length; ++i)
		if(!this.view(arguments[i])) return false
	return true
})

app.def('any', function() {
	for(var i = 0; i < arguments.length; ++i)
		if(this.view(arguments[i])) return true
	return falise
})

app.render(document.body)

/* TODO
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
	*/

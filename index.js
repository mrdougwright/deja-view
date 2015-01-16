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

function view(x) {
	var self = this
	if(arguments.length > 1)
		return iter.map(arguments, function(a) { view(a) })
	if(!arguments.length)
		return self.data
	if(x instanceof Node)
		return self.render(x)
	return evaluate(x, self)
}

view.config = {}
view.data = {}
view._bindings = {}

view.create = function() { return copy.deep(this, this.bind({})) }
view.merge = function(otherView) { return copy.deep(otherView, this) }
view.clear = function() { this._bindings = {}; return this }

view.def = function() {
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

view.render = function(parentNode) {
	var self = this
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

view.renderNode = function(commentNode) {
	var self = this
	self.node = previousOpenTag(commentNode) // view.node is the comment's previous open tag (usually the parent node)
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

view.incr = function(key) {
	this.def(key, this.get(key) + 1)
	return this
}

view.decr = function(key) {
	this.def(key, this.get(key) - 1)
	return this
}

view.toggle = function(key, value) {
	var existing = this.get(key)
	if(existing === val) this.def(key, null)
	else this.def(key, val)
	return this
}

view.push = function(key, val) {
	this.def(key, this.get(key).concat([val]))
	return this
}

view.pop = function(key) {
	var arr = this.get(key), val = arr.pop()
	this.def(key, arr)
	return val
}

view.concat = function(key, arr) {
	this.def(key, this.get(key).concat(arr))
	return this
}

// Weird lol
view = copy.shallow(view, view.bind(view))
module.exports = view

// Default view helpers

view.def('show_if', function(pred) {
	if(pred) this.node.style.display = ''
	else this.node.style.display = 'none'
})

view.def('hide_if', function(pred) {
	if(pred) this.node.style.display = 'none'
	else this.node.style.display = ''
})

view.def('repeat', function(arr) {
	this.node.style.display = 'none'
	this.node.removeChild(this.commentNode)
	// this.commentNode.remove()

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
		    childView = this.create().render(cloned).clear() // clear() saves memory?
		cloned.style.display = ''
		childView.def('this', arr[i])
		if(typeof arr[i] === 'object') childView.def(arr[i])
		wrapper.appendChild(cloned)
	}

	this.node.insertBefore(this.commentNode, this.node.firstChild)
	return false
})

view.def('add', function(x, y) { return view(x) + view(y) })
view.def('incr', function(x) { return view(x) + 1 })
view.def('decr', function(x) { return view(x) - 1 })

view.def('class', function(val) {
	this.node.className += ' ' + val
})

iter.each(ev.events, function(event) {
	view.def('on_' + event, function(expr) {
		ev.bind(this.node, event, function(ev) {
			view.def('event', ev)
			view(expr)
		})
	})
})

view.def('empty',  function(arr)  {return view(arr).length <= 0})
view.def('length', function(arr) {return view(arr).length})
view.def('attr', function(key, val) { this.node.setAttribute(view(key), view(val)) })
view.def('href', function(url) { this.node.setAttribute('href', view(url)) })
view.def('push', function(val, arrKey) { view.push(view(arrKey), view(val)) })
view.def('pop', function(arrKey) { view.pop(view(arrKey)) })
view.def('toggle', function(key, val) { view.toggle(view(key), view(val)) })

view.def('if', function(predicate, thenExpr, elseExpr) {
	if(view(predicate)) return view(thenExpr)
	else return view(elseExpr)
})

view(document.body)

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

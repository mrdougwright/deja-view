var eachNode = require('./lib/eachNode')
var copy = require('./lib/copy')
var iter = require('./lib/iter')
var lex = require('./lib/lex')
var parse = require('./lib/parse')
var flatKeys = require('./lib/flatKeys')
var evaluate = require('./lib/evaluate')
var isExpr = require('./lib/isExpr')

var view = module.exports = {
	config: {cache: true},
	data: {},
	bindings: {},
}

view.create = function() { return copy.deep(this) }
view.merge = function(otherView) { return copy.deep(otherView, this) }
view.clear = function() {
	this.bindings = {}
	return this
}

view.get = function(key) {
	var self = this
	if(arguments.length > 1)
		return iter.map(arguments, function(a) { self.get(a) })
	return evaluate(parse(lex(key)), self)
}

view.set = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2) {
		var obj = {}
		obj[arguments[0]] = arguments[1]
	} else var obj = arguments[0]

	copy.shallow(obj, self.data)
	iter.each(flatKeys(obj), function(key) {
		if(self.bindings[key]) {
			iter.each(self.bindings[key], function(node) {
				interpolate(lex(node.textContent), node, self)
			})
		}
	})
	return self
}

view.render = function(parentNode) {
	var self = this
	self.bindings = {}
	if(parentNode instanceof Array || parentNode instanceof NodeList)
		iter.each(parentNode, function(n) { self.render(n) })

	eachNode(parentNode, function(node) {
		// if nodeType is 8, then it's a comment tag
		if(node.nodeType === 8 && isExpr(node.textContent)) {
			var parent = node.parentNode,
			    lexemes = lex(node.textContent),
			    keys = iter.map(iter.filter(lexemes, function(l) {return l.key}), function(l) {return l.key})

			iter.each(keys, function(k) {
				self.bindings[k] = self.bindings[k] || []
				self.bindings[k].push(node)
			})
			interpolate(lexemes, node, self)
		}
		return true
	})
	return self
}

function interpolate(lexemes, commentNode, view) {
	view.node = commentNode.parentNode
	view.commentNode = commentNode
	var result = evaluate(parse(lexemes), view)
	if(!result) return
	if(commentNode.previousSibling && commentNode.previousSibling.className === 'deja-put')
		var interp = commentNode.previousSibling
	else {
		var interp = document.createElement('span')
		interp.className = 'deja-put'
		commentNode.parentNode.insertBefore(interp, commentNode)
	}
	interp.innerHTML = result
}

view.set('show-if', function(pred) {
	if(pred) this.node.style.display = ''
	else this.node.style.display = 'none'
})

view.set('hide-if', function(pred) {
	if(pred) this.node.style.display = 'none'
	else this.node.style.display = ''
})

view.set('repeat', function(arr) {
	this.node.style.display = 'none'
	this.commentNode.remove()

	if(this.node.previousSibling && this.node.previousSibling.className === 'deja-repeat') {
		var wrapper = this.node.previousSibling
		this.node.previousSibling.innerHTML = ''
	} else {
		var wrapper = document.createElement('span')
		wrapper.className = 'deja-repeat'
		this.node.parentNode.insertBefore(wrapper, this.node)
	}

	for(var i = 0; i < arr.length; ++i) {
		var cloned = this.node.cloneNode(true),
		    childView = this.create().render(cloned)
		childView.set('this', arr[i])
		if(typeof arr[i] === 'object') childView.set(arr[i])
		wrapper.appendChild(cloned)
	}

	return false
})

view.render(document.body)


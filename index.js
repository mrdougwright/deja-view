var eachNode = require('./lib/eachNode')
var copy = require('./lib/copy')
var iter = require('./lib/iter')
var lex = require('./lib/lex')
var parse = require('./lib/parse')
var flatKeys = require('./lib/flatKeys')
var evaluate = require('./lib/evaluate')
var isExpr = require('./lib/isExpr')

var view = module.exports = function() {
	// Set a key to a value
	if(arguments.length === 2) {
		var obj = {}
		obj[arguments[0]] = arguments[1]
		return set(obj)
	}
	// Set an object
	else if(typeof arguments[0] === 'object')
		return set(arguments[0])
	// Get a value
	else if(typeof arguments[0] === 'string')
		return evaluate(parse(lex(arguments[0])), data)
	return this
}

var config = {cache: true}
var data = {}
var bindings = {}

view.render = function(parentNode) {
	if(parentNode instanceof Array || parentNode instanceof NodeList)
		iter.each(parentNode, view.render)

	eachNode(parentNode, function(node) {
		// if nodeType is 8, then it's a comment tag
		if(node.nodeType === 8 && isExpr(node.textContent)) {
			var parent = node.parentNode,
			    lexemes = lex(node.textContent),
			    keys = iter.map(iter.filter(lexemes, function(l) {return l.key}), function(l) {return l.key})

			iter.each(keys, function(k) {
				bindings[k] = bindings[k] || []
				bindings[k].push(node)
			})
			interpolate(lexemes, node)
		}
		return true
	})
}

function interpolate(lexemes, node) {
	var ast = parse(lexemes),
	    result = evaluate(ast, data, node.parentNode)

	if(result.length) {
		if(node.previousSibling && node.previousSibling.className === 'deja-put')
			var interp = node.previousSibling
		else {
			var interp = document.createElement('span')
			interp.className = 'deja-put'
			node.parentNode.insertBefore(interp, node)
		}
		interp.innerHTML = result
	}
}

function set(obj) {
	copy.shallow(obj, data)
	iter.each(flatKeys(obj), function(key) {
		if(bindings[key]) {
			iter.each(bindings[key], function(node) {
				interpolate(lex(node.textContent), node)
			})
		}
	})
	return data
}

view.render(document.body)


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

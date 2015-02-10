// Traverse a DOM tree and apply functions to each node

// Pass both an enter and exit function. The enter function is run when the
// traversal first enters a node. The exit function is run once the all the
// children nodes are done evaluating and we leave the node's parent node.

// You can bail the traversal early from within the same node by returning
// false on the enter function. It'll bail on the currrent node's parent node's
// evaluation of all its children.

var iter = require('./iter')

module.exports = each_node

function each_node(node, fn_enter, fn_exit) {
	var stack = [{enter: true, node: node}], breadth = 1
	while(stack.length) {
		var current = stack.pop()
		if(current.enter) {
			if(fn_enter(current.node)) {
				stack.splice(stack.length-breadth+1, 0, {exit: true, node: current.node})
				breadth = current.node.childNodes.length
				for(var i = current.node.childNodes.length-1; i >= 0; --i) // Eval top down
					stack.push({node: current.node.childNodes[i], enter: true})
			}
			else
				// Bail on the current traversal
				stack = stack.slice(0, stack.length - breadth+1)
		}
		else if(current.exit)
			fn_exit(current.node)
	}
}

// Note: a NodeList (which is what we get from node.childNodes) does not have Array methods

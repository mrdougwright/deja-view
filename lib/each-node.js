// Traverse a DOM tree and apply a function to each node
// You can bail the traversal early if fn returns false
module.exports = function eachNode(node, fn) {
	var stack = [node]
	while (stack.length > 0) {
		var current = stack.pop()
		if(fn(current)) stack = stack.concat(current.childNodes)
	}
}

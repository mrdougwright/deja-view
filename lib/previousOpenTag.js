// Return the "previous tag" for a given node, disregarding tree structure If
// you flatten the tree structure of the DOM into just a top-down list of
// nodes, this will just return the node above the current node.

module.exports = function previousOpenTag(node) {
	var prev = node
	while(prev && prev.nodeType !== 1)
		prev = prev.previousSibling
	if(!prev) return node.parentNode
	return prev
}


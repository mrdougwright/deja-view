module.exports = eval_err

function eval_err(msg, comment_node, col, expr) {
	console.log('[deja-view]', msg, comment_node, ', column', col || '?', ', expression:', expr)
}

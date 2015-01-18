// Really basic dom event handling

var prefix = window.addEventListener ? '' : 'on';

module.exports = {
	bind: function(el, type, fn, capture){
		el[window.addEventListener ? 'addEventListener' : 'attachEvent'](prefix + type, fn, capture || false)
		return fn
	},
	unbind: function(el, type, fn, capture) {
		el[window.removeEventListener ? 'removeEventListener' : 'detachEvent'](prefix + type, fn, capture || false)
		return fn
	},
	events: ['change', 'click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'scroll', 'blur', 'focus', 'input', 'submit', 'keydown', 'keypress', 'keyup']
}

var assert = require('assert'),
	domify = require('domify')

var app = window.app = require('../'),
	parse = require('../lib/parse'),
	evaluate = require('../lib/evaluate'),
	isExpr = require('../lib/isExpr'),
	iter = require('../lib/iter')

describe('parse', function() {

	it('denests parens', function() {
		assert.deepEqual(parse('(1)'), [{num: 1}])
	})

	it('turns a num into a demarcated number', function() {
		assert.deepEqual(parse('1'), [{num: 1}])
})

	it('turns a str into a demarcated string', function() {
		assert.deepEqual(parse('"what\'s up there bro?"'), [{str: "what's up there bro?"}])
	})

	it('turns a keyword into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns a bool into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns a bool into a demarcated key', function() {
		assert.deepEqual(parse('xyz'), [{key: "xyz"}])
	})

	it('turns an expression into an array of atoms and sub-expressions', function() {
		var sexpr = 'a (b (c z)) (d "hello!") 433.43 "sup brah"',
			parsed = [{key: 'a'}, '(b (c z))', '(d "hello!")', '433.43', "\"sup brah\""]
		assert.deepEqual(parse(sexpr), parsed)
	})

	it('correctly parses two strings in a row', function() {
		var sexpr = "'hey' 'there'",
			parsed = [{str: "hey"}, "'there'"]
		assert.deepEqual(parse(sexpr), parsed)
	})
})

describe('isExpr', function() {

	it('returns truthy with any string of chars beginning with parens', function() {
		assert(isExpr('(hey there! (hey lol))'))
		assert(isExpr('(hey there! (hey lol'))
	})

	it('returns null without parens surrounding', function() {
		assert.equal(isExpr('hey there! (hey lol)'), null)
	})
})


describe('.def', function() {

	it('sets a single val', function() {
		app.def('x', 1)
		assert.equal(app.data.x, 1)
	})

	it('sets a nested object', function() {
		app.def('x.y', 1)
		assert.equal(app.data.x.y, 1)
	})

	it('sets two vals in the same nested object without overriding each other', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.data.x.y, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y.z', 1)
		app.def('x.y.q', 420)
		assert.equal(app.data.x.y.z, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.data.x.y, 1)
	})
})


describe('.view', function() {

	it('returns a single num', function() {
		assert.equal(app.view('1'), 1)
	})

	it('returns a single num wrapped in arbitrary parens', function() {
		assert.equal(app.view('(((1)))'), 1)
	})

	it('returns a single str', function() {
		assert.equal(app.view('("hey there!")'), "hey there!")
	})

	it('returns the value for a single key set into the view data', function() {
		app.def('x', 420)
		assert.equal(app.view('x'), 420)
	})

	it('returns the return val of a singleton function', function() {
		app.def('hi', function() { return 'heyo!' })
		assert.equal(app.view('hi'), 'heyo!')
	})

	it('returns the return val of a function taking atoms as params', function() {
		assert.equal(app.view('add 1 2'), 3)
	})

	it('returns the return val of various nested functions', function() {
		assert.equal(app.view('add   (add   1 1)       (add 2  2)'), 6)
	})

	it('more nested lol', function() {
		assert.equal(app.view('add (add 1 1) (add (add 3 4) (add 2 2))'), 13)
	})

	it('evaluates keys that dont exist as empty string', function() {
		assert.equal(app.view('(watskfasdasdfasd)'), '')
	})

	xit('allows for the definition of partial application of functions', function() {
		app.def('partial', 'hi', function(name) { return 'hi ' + this.view(name) })
		// TODO
		// assert.equal(view('partial 420'), 'hi 420')
	})

	it('allows for the definition of nested dotted keys', function() {
		app.def('a.b.c', 22)
		assert.equal(app.data.a.b.c, 22)
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("(12.32)"))
		app.render(div)
		assert.equal(div.textContent, '12.32')
	})

	it('interpolates a str', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" ('hello! world!') "))
		app.render(div)
		assert.equal(div.textContent, 'hello! world!')
	})

	it('interpolates a fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add 1 2) "))
		app.render(div)
		assert.equal(div.textContent, '3')
	})

	it('interpolates a nested fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (cat 'answer is ' (add 1 2)) "))
		app.render(div)
		assert.equal(div.textContent, 'answer is 3')
	})

	it('interpolates key values', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add x y) "))
		app.def({x: 2, y: 3})
		app.render(div)
		assert.equal(div.textContent, '5')
	})

	it('runs a function that can mess with the parent node', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (make-blue) "))
		app.def('make-blue', function(node) { this.node.style.color = 'blue' })
		app.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		app.clear()
		app.def({x: {y: {z: 1}}})
		app.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		app.clear()
		app.def("x.y.z", 420)
		app.render(div)
		assert.equal(div.textContent, '420')
	})

	it('sets nested keys exclusively from each other without overriding', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y) "))
		app.clear()
		app.def('x.y', 1)
		app.def('x.z', 44)
		app.render(div)
		assert.equal(div.textContent, '1')
	})
})

describe('data binding/updating', function() {

	it('updates an interpolation when data is changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x) "))
		app.def('x', 1)
		app.render(div)
		assert.equal(div.textContent, '1')
		app.def('x', 2)
		assert.equal(div.textContent, '2')
	})

	it('updates the interpolation of a function return val when data in the function params was changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add (add (add x x) 1) 1)"))
		app.def('x', 1)
		app.render(div)
		assert.equal(div.textContent, '4')
		app.def('x', 2)
		assert.equal(div.textContent, '6')
	})
})

describe('repeat', function() {

	it('repeats an array of vals', function() {
		var el = domify("<div><div><!-- (repeat xs) --><!-- (this) --></div></div>")
		app.def('xs', [1,2,3])
		app.render(el)
		assert.equal(el.textContent, '123')
	})

	it('repeats an evaluated array', function() {
		app.def('tail', function(arr) {
			arr = this.view(arr)
			return arr.slice(1)
		})
		var el = domify("<div><div><!-- (repeat (tail xs))) --><!-- (this) --></div></div>")
		app.def('xs', [1,2,3])
		app.render(el)
		assert.equal(el.textContent, '23')
	})

	it('repeats changes in multiple arrays', function() {
		app.def('tail', function(arr) {
			arr = this.view(arr)
			return arr.slice(1)
		})

		var el = domify(
"<div id='parent'>\
<div id='xs'><!-- (repeat xs) --><!-- (this) --></div>\
<div id='ys'><!-- (repeat ys) --><!-- (this) --></div>\
</div>")

		app.def('xs', [1,2,3])
		app.def('ys', [4,5,6])
		app.render(el)
		assert.equal(el.textContent, '123456')

		app.def('ys', [7,8,9])
		assert.equal(el.textContent, '123789')

		app.def('xs', [10,11,12])
		assert.equal(el.textContent, '101112789')
	})

	it('allows for actions inside of each iteration to affect the parent', function() {
		var el = domify("<div><div><!-- (repeat xs) --><!-- (set 'z' this) --></div></div>")
		app.def('xs', [1,2,3])
		app.def('z', 9)
		app.render(el)
		assert.equal(app.view('z'), 3)
	})
})

describe('scope', function() {

	it('namespaces everything within the node', function() {
		var el = domify("<div><div><!-- (scope 'x') --><!-- (y) --></div></div>")
		app.def("x", {y: 'heyo!'})
		app.render(el)
		assert.equal(el.textContent, 'heyo!')
	})

	it('shadows parent keys', function() {
		var el = domify("<div><div><!-- (scope 'obj') --><!-- (x) --></div></div>")
		app.def('x', 'x')
		app.def('obj', {y: 'y'})
		app.render(el)
		assert.equal(el.textContent, 'x')
	})

	it('returns parent data from within a scope when undefined', function() {
		var el = domify("<div><div><!-- (scope 'obj') --><!-- (x) --></div></div>")
		app.def('x', 'x')
		app.def('obj', {y: 'y'})
		app.render(el)
		assert.equal(el.textContent, 'x')
	})

	it('sets parent data from within a scope when undefined', function() {
		var el = domify("<div><div><!-- (scope 'obj') --><!-- (set 'x' 'hey!') --></div></div>")
		app.def('x', 'x')
		app.def('obj', {y: 'y'})
		app.render(el)
		assert.equal(app.view('x'), 'hey!')
	})

	it('gets the parents parents data', function() {
		var el = domify("<div><div><!-- (scope 'x.y') --><!-- (a) --></div></div>")
		app.def('x', {y: 1})
		app.def('a', 'a')
		app.render(el)
		assert.equal(el.textContent, 'a')
	})
})

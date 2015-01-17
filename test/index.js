var assert = require('assert'),
    domify = require('domify')

var app = require('../'),
    parse = require('../lib/parse'),
    isExpr = require('../lib/isExpr'),
    iter = require('../lib/iter')

/*
var evaluate = require('../lib/evaluate')
*/

describe('parse', function() {

	it('denests parens', function() {
		assert.deepEqual(parse('(1)'), ['1'])
	})

	it('denests arbitrary opening parens', function() {
		assert.deepEqual(parse('(1'), ['1'])
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

	it('turns an expression into an array of atoms and sub-expressions', function() {
		var sexpr = 'a (b (c z)) (d "hello!") 433.43 "hey there bro"',
		    parsed = [{key: 'a'}, 'b (c z)', 'd "hello!"', {num: 433.43}, {str: 'hey there bro'}]
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

describe('.view', function() {

	it('returns a single num', function() {
		assert.equal(app.view('1'), 1)
	})

	it('returns a single num wrapped in arbitrary parens', function() {
		assert.equal(app.view('(1)'), 1)
		assert.equal(app.view('(((1)'), 1)
	})

	it('returns a single str', function() {
		assert.equal(app.view('("hey there!")'), "hey there!")
	})

	it('returns the value for a single key set into the view data', function() {
		app.def('x', 420)
		assert.equal(app.view('(x'), 420)
	})

	it('returns the return val of a singleton function', function() {
		app.def('hi', function() { return 'heyo!' })
		assert.equal(app.view('hi'), 'heyo!')
	})

	it('returns the return val of a function taking atoms as params', function() {
		assert.equal(app.view('(((add 1 2'), 3)
	})

	it('returns the return val of various nested functions', function() {
		assert.equal(app.view('(((add (incr 1) (decr 2'), 3)
	})

	it('more nested lol', function() {
		assert.equal(app.view('(((add (add 1 1) (add (add 3 4) (add 2 2)'), 13)
	})

	it('evaluates functions returned by another function', function() {
		app.def('addadd', function(x,y) { return function(z) { return this.view(x) + this.view(y) + this.view(z) }})
		assert.equal(app.view('((addadd 1 2) 3)'), 6)
	})

	it('evaluates keys that dont exist as empty string', function() {
		assert.equal(app.view('(watskfasdasdfasd)'), '')
	})

	it('allows for the definition of partial application of functions', function() {
		app.def('partial', 'hi', function(name) { return 'hi ' + this.view(name) })
		// TODO
		// assert.equal(view('partial 420'), 'hi 420')
	})

	it('allows for the definition of nested dotted keys', function() {
		app.def('x.y.z', 22)
		assert.equal(app.data.x.y.z, 22)
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (12.32) "))
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
		div.appendChild(document.createComment(" (str 'answer is' (add 1 2)) "))
		app.def('str', function() {
			var self = this;
			return iter.fold(arguments, '', function(result, s) {
				return result + ' ' + self.view(s)
			}).trim()
		})
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
		app.def('make-blue', function() { this.node.style.color = 'blue' })
		app.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		app.def({x: {y: {z: 1}}})
		app.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		app.def("x.y.z", 420)
		app.render(div)
		assert.equal(div.textContent, '420')
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


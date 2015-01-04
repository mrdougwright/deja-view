var assert = require('assert')
var domify = require('domify')

var view = require('../')
var lex = require('../lib/lex')
var parse = require('../lib/parse')
var isExpr = require('../lib/isExpr')
var evaluate = require('../lib/evaluate')
var iter = require('../lib/iter')

var sexpr = '(a ((b (c z)) (d "hello!") 433.43))'
var tokens = ['(', {key: 'a'}, '(', '(', {key: 'b'}, '(', {key: 'c'}, {key: 'z'}, ')', ')', '(', {key: 'd'}, {str: '"hello!"'}, ')', {num: '433.43'}, ')', ')']
var parsed = [{key: 'a'}, [[{key: 'b'}, [{key: 'c'}, {key: 'z'}]], [{key: 'd'}, {str: '"hello!"'}], {num: '433.43'}]]

describe('.lex', function() {

	it('turns an s-expr into an array of tokens', function() {
		assert.deepEqual(lex(sexpr), tokens)
	})

})

describe('.parse', function() {
	it('turns an array of tokens into a parsed nested array of atoms', function() {
		assert.deepEqual(parse(tokens), parsed)
	})

	it('throws an exception when no surrounding parens', function() {
		assert.throws(function() {parse(lex('hello')), 'hi'})
	})

	it('parses with implicit closing parens at the end of the expression', function() {
		assert.deepEqual(parse(lex('(a (b (c)))')), [{key: 'a'}, [{key: 'b'}, [{key: 'c'}]]])
	})
})

describe('.isExpr', function() {

	it('returns truthy with any string of chars surrounded by parens', function() {
		assert(isExpr('(hey there! (hey lol))'))
	})

	it('returns null without parens surrounding', function() {
		assert.equal(isExpr('hey there! (hey lol)'), null)
	})
})

describe('view', function() {

	it('returns a single val', function() {
		assert.equal(view('(1)'), '1')
	})

	it('returns val from the view data using a key', function() {
		view('x', 2)
		assert.equal(view('(x)'), '2')
	})

	it('evaluates singleton functions', function() {
		view('fn', function() {return 3})
		assert.equal(view('(fn)'), '3')
	})

	it('evaluates functions with one arg', function() {
		view('incr', function(x) { return x + 1})
		assert.equal(view('(incr 9)'), '10')
	})

	it('evaluates mult-arg function calls', function() {
		view('sum', function() { return iter.fold(arguments, 0, function(s,n){return s+n})})
		assert.equal(view('(sum 1 2 3 4 5)'), '15')
	})

	it('evaluates nested multi-arg function calls', function() {
		view('incr', function(x) { return x + 1})
		view('add', function(x,y) { return x+y})
		assert.equal(view('(incr (add 1 (add 2 3)))'), '7')
	})

	it('evaluates functions returned by other functions', function() {
		view('addadd', function(x,y) {return function(z) {return x+y+z}})
		assert.equal(view('((addadd 1 2) 3)'), '6')
	})

	it('evaluates keys that dont exist as empty string', function() {
		assert.equal(view('(wat)'), '')
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (12.32) ")
		div.appendChild(hallo)
		view.render(div)
		assert.equal(div.textContent, '12.32')
	})

	it('interpolates a str', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" ('hello! world!') ")
		div.appendChild(hallo)
		view.render(div)
		assert.equal(div.textContent, 'hello! world!')
	})

	it('interpolates a fn', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (add 1 2) ")
		div.appendChild(hallo)
		view('add', function(x,y) { return x + y})
		view.render(div)
		assert.equal(div.textContent, '3')
	})

	it('interpolates a nested fn', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (str 'answer is' (add 1 2)) ")
		div.appendChild(hallo)
		view('str', function() { return iter.fold(arguments, '', function(result, s) {return result + ' ' + s}).trim()})
		view('add', function(x,y) { return x+y})
		view.render(div)
		assert.equal(div.textContent, 'answer is 3')
	})

	it('interpolates a key', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (add x y) ")
		div.appendChild(hallo)
		view('add', function(x,y) { return x + y})
		view('x', 2)
		view('y', 3)
		view.render(div)
		assert.equal(div.textContent, '5')
	})

	it('runs a function that can mess with the parent node', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (make-blue) ")
		div.appendChild(hallo)
		view('make-blue', function() { this.node.style.color = 'blue' })
		view.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (x.y.z) ")
		div.appendChild(hallo)
		view({x: {y: {z: 1}}})
		view.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (x.y.z) ")
		div.appendChild(hallo)
		view("x.y.z", 420)
		view.render(div)
		assert.equal(div.textContent, '420')
	})

})

describe('data binding', function() {

	it('updates an interpolation when data is changed', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (x) ")
		div.appendChild(hallo)
		view('x', 1)
		view.render(div)
		assert.equal(div.textContent, '1')
		view('x', 2)
		assert.equal(div.textContent, '2')
	})

	it('updates the interpolation of a function return val when data in the function params was changed', function() {
		var div = document.createElement("div")
		var hallo = document.createComment(" (add (add (add x x) 1) 1)")
		div.appendChild(hallo)
		view('add', function(x,y) { return x + y})
		view('x', 1)
		view.render(div)
		assert.equal(div.textContent, '4')
		view('x', 2)
		assert.equal(div.textContent, '6')
	})

})


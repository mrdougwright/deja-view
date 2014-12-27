var assert = require('assert')
var domify = require('domify')

var view = require('../')
var lex = require('../lib/lex')
var parse = require('../lib/parse')
var isExpr = require('../lib/isExpr')
var evaluate = require('../lib/evaluate')
var iter = require('../lib/iter')

var sexpr = '(a ((b (c z)) (d "hello!") 433.43))'
var tokens = ['(', 'a', '(', '(', 'b', '(', 'c', 'z', ')', ')', '(', 'd', '"hello!"', ')', '433.43', ')', ')']
var parsed = ['a', [['b', ['c', 'z']], ['d', ['str', '"hello!"']], ['num', '433.43']]]

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
		assert.throws(function() {parse(lex('hello'), 1), 'hi'})
	})

	it('parses with implicit closing parens at the end of the expression', function() {
		assert.deepEqual(parse(lex('(a (b (c'), 1), ['a', ['b', ['c']]])
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

describe('.evaluate', function() {

	it('returns a single val', function() {
		assert.equal(evaluate(parse(lex('(1)'))), '1')
	})

	it('returns val from the view data using a key nested in parens', function() {
		assert.equal(evaluate(parse(lex('(x)')), {x: 2}), '2')
	})

	it('evaluates singleton functions', function() {
		assert.equal(evaluate(parse(lex('(fn)')), {fn: function() {return 3}}), '3')
	})

	it('evaluates functions with one arg', function() {
		assert.equal(evaluate(parse(lex('(incr 9)')), {incr: function(x) {return x + 1}}), '10')
	})

	it('evaluates mult-arg function calls', function() {
		assert.equal(evaluate(parse(lex('(add 1 2 3 4 5)')), {add: function() { return iter.fold(arguments, 0, function(s,n){return s+n})}}), '15')
	})

	it('evaluates nested multi-arg function calls', function() {
		assert.equal(evaluate(parse(lex('(incr (add 1 2))')), {incr: function(x) {return x+1}, add: function(x,y) {return x+y}}), '4')
	})

})

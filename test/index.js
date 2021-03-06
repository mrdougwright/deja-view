var assert = require('assert'),
	domify = require('domify')

var app = window.app = require('../'),
	parse = require('../lib/parse'),
	evaluate = require('../lib/evaluate')

describe('parse', function() {

	it('denests parens', function() {
		assert.deepEqual(parse('((1))'), [{val: 1}])
	})

	it('turns a num into a demarcated number', function() {
		assert.deepEqual(parse('1'), [{val: 1}])
})

	it('turns a str into a demarcated string', function() {
		assert.deepEqual(parse('"what\'s up there bro?"'), [{val: "what's up there bro?"}])
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
			parsed = [{key: 'a'}, 'b (c z)', 'd "hello!"', {val: '433.43'}, {val: "sup brah"}]
		assert.deepEqual(parse(sexpr), parsed)
	})

	it('correctly parses two strings in a row', function() {
		var sexpr = "'hey' 'there'",
			parsed = [{val: "hey"}, {val: "there"}]
		assert.deepEqual(parse(sexpr), parsed)
	})
})

describe('lib/evaluate', function() {

	it('returns a val', function() {
		assert.equal(evaluate('1', {}), 1)
		assert.equal(evaluate('"hi friends"', {}), "hi friends")
	})

	it('evals a 0-ary func', function() {
		assert.equal(evaluate("say_hi", {say_hi: function(){return 'hiii'}}), 'hiii')
	})

	it('evals an n-ary func', function() {
		assert.equal(evaluate("add 1 2", {add: function(x,y){return x+y}}), 3)
	})

	it('evals func chaining thing', function() {
		assert.equal(evaluate("add add 2 3 add 1 1", {add: function(x,y){return x+y}}), 7)
	})

	it('evals partial func chaining thing', function() {
		assert.equal(evaluate("add 1 add 2 add 1 1", {add: function(x,y){return x+y}}), 5)
	})

	it('evals nested scoped funcs', function() {
		assert.equal(evaluate("mul (add 1 2) 3", {add: function(x,y){return x+y}, mul: function(x,y) {return x*y}}), 9)
	})

	it('evals lazy funcs', function() {
		assert.equal(evaluate("fn", {fn: {_lazy: function(){return 'hiii'},}}), 'hiii')
	})

	it('evals a lazy n-ary func', function() {
		assert.equal(evaluate("add 1 2", {add: {_lazy: function(x,y){return x.val+y.val}}}), 3)
	})

	it('does not execute a nested func when the first func is undefined', function() {
		assert.equal(evaluate("add 1 dont 3 2", {dont: {_lazy: function() {return 'nope'}}}), undefined)
	})
})

describe('.def_lazy', function() {

	it('does stuff', function() {
		app.def_lazy('immediate', function(x) { this.view(x) })
		app.def_lazy('noop', function(x) {})
		var div = document.createElement("div")
		div.appendChild(document.createComment("= def 'hey' 'heeey'"))
		div.appendChild(document.createComment("= noop (def 'hey' 'wuwhut')"))
		app.render(div)
		assert.equal(app.hey, 'heeey')
	})
})

describe('.def', function() {

	it('sets a single val', function() {
		app.def('x', 1)
		assert.equal(app.x, 1)
	})

	it('sets a nested object', function() {
		app.def('x.y', 1)
		assert.equal(app.x.y, 1)
	})

	it('sets two vals in the same nested object without overriding each other', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.x.y, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y.z', 1)
		app.def('x.y.q', 420)
		assert.equal(app.x.y.z, 1)
	})

	it('sets a nested val using dot notation in a string', function() {
		app.def('x.y', 1)
		app.def('x.z', 420)
		assert.equal(app.x.y, 1)
	})

	it('can use the result of a 0-ary function in the args of another fn', function() {
		app.def('hi', function(){return 'hi'})
		app.view("def 'x' hi")
		assert.equal(app.x, 'hi')
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

	it('returns the value for a single key def into the view data', function() {
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

	it('evaluates keys that dont exist as undefined', function() {
		assert.equal(app.view('(watskfasdasdfasd)'), undefined)
	})

	// TODO
	xit('partial application', function() {
		app.def('partial', 'hi', function(name) { return 'hi ' + this.view(name) })
		assert.equal(view('partial 420'), 'hi 420')
	})

	it('allows for the definition of nested dotted keys', function() {
		app.def('a.b.c', 22)
		assert.equal(app.a.b.c, 22)
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put 12.32"))
		app.render(div)
		assert.equal(div.textContent, '12.32')
	})

	it('interpolates a str', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put 'hello! world!' "))
		app.render(div)
		assert.equal(div.textContent, 'hello! world!')
	})

	it('interpolates a fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put add 1 2 "))
		app.render(div)
		assert.equal(div.textContent, '3')
	})

	it('interpolates a nested fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put cat 'answer is ' (add 1 2) "))
		app.render(div)
		assert.equal(div.textContent, 'answer is 3')
	})

	it('interpolates key values', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put add x y "))
		app.def({x: 2, y: 3})
		app.render(div)
		assert.equal(div.textContent, '5')
	})

	it('runs a function that can mess with the parent node', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put make-blue "))
		app.def('make-blue', function(node) { this.node.style.color = 'blue' })
		app.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y.z "))
		app.def({x: {y: {z: 1}}})
		app.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y.z "))
		app.def("x.y.z", 420)
		app.render(div)
		assert.equal(div.textContent, '420')
	})

	it('sets nested keys exclusively from each other without overriding', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put x.y "))
		app.def('x.y', 1)
		app.def('x.z', 44)
		app.render(div)
		assert.equal(div.textContent, '1')
	})
})

describe('.child', function() {

	it('has access to the parents data', function() {
		var child = app.child()
		app.def('x', 420)
		assert.equal(child.view('x'), 420)
	})

	it('does not change its parents data vals', function() {
		var child = app.child()
		app.def('x', 99)
		child.def('x', 33)
		assert.equal(app.view('x'), 99)
	})

	it('does not change its parents data objects', function() {
		var child = app.child()
		app.def('x', {y: 99})
		child.def('x', {y: 33})
		assert.equal(app.view('x.y'), 99)
	})

	it('does not change its siblings data', function() {
		var sib1 = app.child(), sib2 = app.child()
		app.def('x', {y: 99})
		sib1.def('x', {y: 33})
		sib2.def('x', {y: 44})
		assert.equal(sib1.view('x.y'), 33)
		assert.equal(sib2.view('x.y'), 44)
		assert.equal(app.view('x.y'), 99)
	})

	it('can mess with the parent using the parent keyword', function() {
		var child = app.child()
		app.def('x', 99)
		child.def('parent.x', 101)
		assert.equal(app.view('x'), 101)
	})

	it('child view can define data from the dom for the parent view', function() {
		var div = document.createElement('div'),
			child = app.child()
		div.appendChild(document.createComment("= def 'parent.x' 99"))
		app.def('x', 420)
		child.render(div)
		assert.equal(app.view('x'), 99)
	})

})

describe('data binding/updating', function() {

	it('updates an interpolation when data is changed', function() {
		var div = document.createElement("div"), div2 = document.createElement("div")
		div.appendChild(div2)
		div2.appendChild(document.createComment("= put xx"))
		app.def('xx', 1)
		app.render(div)
		assert.equal(div.textContent, '1')
		app.def('xx', 2)
		assert.equal(div.textContent, '2')
	})

	it('updates the interpolation of a function return val when data in the function params was changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment("= put add (add (add x x) 1) 1"))
		app.def('x', 1)
		app.render(div)
		assert.equal(div.textContent, '4')
		app.def('x', 2)
		assert.equal(div.textContent, '6')
	})
})

describe('repeat', function() {

	it('repeats an array of vals', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put each --></div></div>")
		app.def('xs', [1,2,3])
		app.render(el)
		assert.equal(el.textContent, '123')
	})

	it('repeats an evaluated array', function() {
		var el = domify("<div><div><!--= repeat tail xs --><!--= put each --></div></div>")
		app.def('xs', [1,2,3]).render(el)
		assert.equal(el.textContent, '23')
	})

	it('repeats changes in multiple arrays', function() {
		app._bindings = {}
		var el = domify(
"<div id='parent'>\
<div id='xs'><!--= repeat xs --><!--= put each --></div>\
<div id='ys'><!--= repeat ys --><!--= put each --></div>\
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

	it('does not render into the template element', function() {
		var el = domify("<div><div><!--= repeat xs --><!--= put each --><!--= put wut --></div></div>")
		app.render(el)
		app.def('xs', [1,2,3])
		app.def('wut', 'dont show this')
		assert.equal(el.textContent, '123')
	})
})

describe('set_at', function() {
	it('sets individual elements in an array', function() {
		app.def('xs', [{name: 'Finn'}, {name: 'PB'}])
		app.set_at('xs', 0, {name: 'Jake'})
		assert.deepEqual(app.xs, [{name: 'Jake'}, {name: 'PB'}])
	})
})

describe("if", function() {

	it('evals then_expr with predicate true', function() {
		assert.equal(app.view("if true 'yup' 'nope'"), 'yup')
	})

	it('evals else_expr with predicate false', function() {
		assert.equal(app.view("if false 'nope' 'yup'"), 'yup')
	})
})

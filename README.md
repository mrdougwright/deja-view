deja-view
=========

really simple, fun, &amp; small but powerful UX library

* display data in your dom declaratively with no querying and have it update automatically
* describe behavior in your dom using **view expressions**, which you can extend yourself endlessly
* compose and extend views very easily
* automatically cache the state of your view to local storage
* small, no dependencies

## installing

You can install it with npm or bower, then use it with browserify:

```sh
npm install deja-view
```

```js
var app = require('deja-view')
```

## displaying and updating data on the page

deja uses HTML comments for **view expressions**. Wrap your expressions in parentheses within a comment. To simply display a string on your page, it looks like:

```html
<p>
	Hallo, <!-- (name) -->
</p>
```

Then in your js, use `def` to set data:

```js
app.def('name', 'Bob Ross')
```

The above produces

```html
<p>
	Hallo, Bob Ross
</p>
```

If we set `'name'` again, the page will update automatically:

```js
app.def('name', 'Bob Dole')
```

```html
<p>
	Hallo, Bob Dole
</p>
```

You can display any javascript value as long as it can be converted to a String: Numbers, Arrays, etc

# display each item in an array

You can show each item from an array on your page by using the `repeat` command. 

Every **view expression** affects its **parent element**. Use the `repeat` command inside the element you want to repeat:

```html
<table>
	<thead><th>Pokemon Name</th> <th>Weight</th></thead>
	<tbody>
		<tr>
			<!-- (repeat pokemon) -->
			<td> <!-- (name) --> </td>
			<td> <!-- (weight) --> lbs </td>
		</tr>
	</tbody>
</table>
```

```js
app.def('pokemon', [{name: 'Snorlax', weight: 1014.1}, {name: 'Psyduck', weight: 43.2}])
```

This will render like:

```html
<table>
	<thead><th>Pokemon Name</th> <th>Weight</th></thead>
	<tbody>
		<tr>
			<td> Snorlax </td>
			<td> 1014.1 lbs </td>
		</tr>
		<tr>
			<td> Psyduck </td>
			<td> 43.2 lbs </td>
		</tr>
	</tbody>
</table>
```

# conditionals in your view

If you want to display or hide elements on your page depending on your data, you can use `show_if` and `hide_if`

```html
<p>
	<!-- (show_if anonymous) -->
	You are an anonymous user.
</p>
```

Remember, every **view expression** (the expression inside the HTML comment) affects its **parent element**. So for the above, it'll only show the `<p>` element if anonymous is true.

In the case of `<input>`, `<img>` or other tags that don't have children,
simply place view expressions below them to affect them.

# create your own view functions

`show_if`, `repeat`, and many more are defined simply by using `def` with two
arguments, the key and value. If the value is a function, then the function
will be evaluated when placed into the view. Every function body has
`this.node` available to it to access the current parent node.

Deja uses **extremely** lazy evaluation. The arguments passed into view
functions are not yet evaluated or even parsed by the time they hit the
function body. It is up to you to define when you want to parse and evaluate
the argument by calling `app.view(arg)` on each arg. This allows for easy
definition of deffered/delayed functionality such as `if`, `on_click`, `delay`
etc.

For example, this is how `show_if` is defined:

```js
view('show_if', function(predicate) {
	if(this.view(pred))
		this.node.style.display = ''
	else
		this.node.style.display = 'none'
})
```

Notice that in the above we have to explicitly call `this.view` on the `pred`
argument to get the actual value.

# view function reference

* **repeat** Array - repeat the parent node for each element in the array.
* **show-if** Value - test a Value; if true, display the parent node as default; if false, hide the parent node
* **hide-if** Value - exact opposite of above
* **trigger** eventName - trigger an event
* **when** eventName expr - run a view expression when an event is triggered
* **set** key val - set the key to the given value in the view's data
* **default** key val - if the key is not set already, then set it to val
* **push** val arrayName - push a value into an array in the view, given by the array's key name
* **pop** arrayName - push a value into an array in the view, given by the array's name
* **remove** val arrayName - find and remove the value from the array inside the view, given by the array's name
* **attr** name val - set an attribute to a value on the parent node
* **remove-attr** name - remove the attribute from the parent node
* **add-class** val - set the class on the parent node as the value (will append to the node's class list)
* **remove-class** val - remove the class from the parent node's class list, if it is present
* **toggle-class** val - remove the class from the parent node's class list if present, add the class if it is absent

# more examples

### a simple to-do list

Let's build a very simple to-do list where we can add new items with an input field and remove finished items. We can implement the entire thing with only a few simple view expressions!

```html

<form>
	<!-- (on_submit (push form_data todos)) -->
	<input type='text' placeholder='What do you need to do?'>
</form>

<ul>
	<li>
		<!-- (repeat todos) -->
		<!-- (this) -->
		(<a> <!-- (on_click (remove this todos)) --> done </a>)
	</li>
</ul>
```


That's it! In only a dozen lines we have a fully functioning to-do list that will even store everything to localStorage.

## patterns & tips

* Think of your view -- that is, your HTML and your view expressions -- as only the description of the layout and behavior of your data.
* Any complicated logic -- like ajax, list reduction, or detailed data processing -- should still live in the JS, not the view.

## Why S-Expressions?

Reasons for using S-Expressions:

* It makes it clear that the view expressions are **not** javascript
* It's very fast and simple to parse
* It is visually scannable as distinct from html, but still reads similarly. It's also more quickly differentiated from regular comments

## view expression grammar

E = Key|Str|Num|Arr|('(' (E ' ')+  ')')
Key = /../
Str = /../
Num = /../
Arr = /../

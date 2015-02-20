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

```html
<input type='text' name='search'>
<!-- (on_keyup (fetch_results input_value)) -->
```

In the above example, every time we type in the input field, we call a function
called `fetch_results`, passing in the value of the input field. In this
example, `<input>` does not have any child elements, so we cannot place view
expressions as a child of the element. Instead, we simply place them afterward.
You can place view expressions directly afterwards `<img>`, `<hr>` or other
elements without closing tags to affect them.

# create your own view functions

`show_if`, `repeat`, and many more are defined simply by using `def` with two
arguments, the key and value. If the value is a function, then the function
will be evaluated. Every function has a `this.node` available inside the
function definition, which allows you to access the current parent node.

Deja uses **extremely** lazy evaluation. The arguments passed into view
functions are not yet evaluated or even parsed by the time they hit the
function body. It is up to you to define when you want to parse and evaluate
the argument by calling `this.view(arg)` on each arg. This allows for easy
definition of deffered/delayed functionality such as `if`, `on_click`, `delay`
etc.

Here's how `show_if` is defined:

```js
app.def('show_if', function(pred) {
	if(this.view(pred)) this.node.style.display = ''
	else this.node.style.display = 'none'
})
```

And here's a more generalized `if` construct that takes advantage of the lazy
evaluation:

```js
app.def('if', function(predicate, then_expr, else_expr) {
	if(this.view(pred)) return this.view(then_expr)
	else if(else_expr) return this.view(else_expr)
})
```

# view function reference

### functions that modify the node

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| repeat  | Array | repeat the parent node for each element in the array | `(repeat user_listing)` |
| show_if | Value (predicate to test) | test a Value; if true, set display to ''; if false, set display to 'none' | `(show_if public_profile)` |
| hide_if | Value(predicate to test) | test a Value; if false, set display to 'none'; if true set display to '' | `(hide_if anonymous_profile)` |
| attr | name val | set an attribute to a value on the parent node | `(attr 'href' profile_link)` |
| remove_attr | name | remove the attribute from the parent node | `(remove_attr 'href')` |
| toggle_attr | name | remove the attribute from the parent node | `(toggle_attr `data-selected` id)` |
| class | val | set the class on the parent node as the value (will append to the node's class list) | `(class 'active')` |
| remove_class | val | remove the class from the parent node's class list, if it is present | `(remove_class 'active')` |
| toggle_class | val | either remove the class from the parent node's class list if present, or add the class if it is absent | `(toggle_class 'active')` |

### conditionals

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| if | Value Expr Expr | if the predicate is true, evaluate the first expression, else evaluate the second expression (optional)  | `(if active_account (class 'active') (class 'inactive'))` |
| unless | Value Expr Expr | the inverse of `if` | `(unless confirmed_account (class 'confirmed'))` |

### data manipulation

| name | type | action | example |
|:---- |:---- |:------ |:----- |
| set | String Value | set the key to the given value in the view's data | `(set 'x' 1)` |
| push | Value String | push a value into an array in the view, given by the array's key name | `(push 1 'numbers')` |
| pop | String | push a value into an array in the view, given by the array's name | `(pop 'user_list')` |
| remove | Value String | find and remove the value from the array inside the view, given by the array's name | `(remove user 'user_list')` |

Legend:

# app examples

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
		(<a> <!-- (on_click (remove this todos)) --> finished! </a>)
	</li>
</ul>

<script>
app.def('todos', ['Do the laundry'])
</script>
```

That's it! In only a dozen lines we have a functioning to-do list.

## patterns & tips

* Think of your view -- that is, your HTML and your view expressions -- as only the description of the layout and behavior of your data.
* Any complicated logic -- like ajax, list reduction, or detailed data processing -- should still live in the JS, not the view.

## Why S-Expressions?

Reasons for using S-Expressions:

* It makes it clear that the view expressions are **not** javascript
* It's very fast and simple to parse
* It is visually scannable as distinct from html, but still reads similarly. It's also more quickly differentiated from regular comments

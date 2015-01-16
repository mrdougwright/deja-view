deja-view
=========

really simple, fun, &amp; small but powerful UX library

* display data in your dom declaratively with no querying and have it update automatically
* describe behavior in your dom using **view expressions**, which you can extend yourself endlessly
* compose and extend views very easily
* automatically cache the state of your view to local storage
* only 500 lines (10kb)
* IE6+ compatible

## installing

You can install it with npm or bower, then use it with browserify:

```sh
npm install deja-view
```

```js
var view = require('deja-view')
```

## displaying and updating data on the page

deja uses HTML comments for **view expressions**. Wrap your expressions in parentheses within a comment. To simply display a string on your page, it looks like:

```html
<p>
	Hallo, <!-- (name) -->
</p>
```

Then in your js:

```js
view('name', 'Bob Ross')
```

The above produces

```html
<p>
	Hallo, Bob Ross
</p>
```

If we set name again later, your page will update automatically:

```js
view('name', 'Bob Dole')
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
view('pokemon', [{name: 'Snorlax', weight: 1014.1}, {name: 'Psyduck', weight: 43.2}])
```

This will render as:

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

If you want to display or hide elements on your page depending on your data, you can use `show-if` and `hide-if`

```html
<p>
	<!-- (show-if anonymous) -->
	You are an anonymous user.
</p>
```

Remember, every **view expression** (the HTML comment) affects its **parent element**. So for the above, it'll only show the `<p>` element if anonymous is true.

# create your own view functions

`show-if`, `repeat`, and many more are defined simply by calling `view` with two arguments, where the first is the string (the name of the function), and the second is the function.

This is how `show-if` is defined inside `deja-view`

```js
view('show-if', function(predicate) {
	if(predicate)
		this.node.display = ''
	else
		this.node.display = 'none'
})
```

You can always access the node that your view function is currently inside of by using `this.node`

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

<!-- (on-submit (push form-data todos)) -->
	<input type='text' placeholder='What do you need to do?'>
</form>

<ul>
	<li>
		<!-- (repeat todos) -->
		<!-- (this) -->
		(<a> <!-- (on-click (remove this todos)) --> done </a>)
	</li>
</ul>
```


That's it! In only a dozen lines we have a fully functioning to-do list that will even store everything to localStorage.

### opening a modal

To open modals in your application, you can use a the `trigger` view function:

```html
<a>
	<!-- (on-click (trigger 'hello-modal')) -->
	Get a greeting
</a>

<div class='modal hide'>
	<!-- (when 'hello-modal' (toggle-class 'is-shown')) -->

	<a>
		<!-- (on-click (trigger 'hello-modal')) -->
		Close modal
	</a>

	<p>Hello to you!</p>

</div>
```

with a few expressions, we can toggle a class on a modal `div` using events.


### form validation

Here's a sample of how you could write a form validation plugin with very little code

```html 
<form>
	<div class='field'>
		<input type='email' required placeholder='Email address'>
	</div>

	<div class='field'>
		<input type='password' required placeholder='password' name='password'>
	</div>

	<div class='field'>
		<!-- (validate-match 'password') -->
		<input type='password' required placeholder='confirm password' name='password_confirmation'>
	</div>

</form>
```

```js
view('validate-match', function(name) {
	var input = this.node.querySelector('input')
	var form = this.node.parentNode
	var inputMatch = form.querySelector("input[name='" + name + "']")
	if(input.value !== inputMatch.value) alert("invalid omg!!!!")
})
```

## utilities

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

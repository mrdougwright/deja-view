(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/assert/assert.js":[function(require,module,exports){
// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

// when used in node, this will actually load the util module we depend on
// versus loading the builtin util module as happens otherwise
// this is a bug in node module loading as far as I am concerned
var util = require('util/');

var pSlice = Array.prototype.slice;
var hasOwn = Object.prototype.hasOwnProperty;

// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;

  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  }
  else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = stackStartFunction.name;
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function replacer(key, value) {
  if (util.isUndefined(value)) {
    return '' + value;
  }
  if (util.isNumber(value) && (isNaN(value) || !isFinite(value))) {
    return value.toString();
  }
  if (util.isFunction(value) || util.isRegExp(value)) {
    return value.toString();
  }
  return value;
}

function truncate(s, n) {
  if (util.isString(s)) {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}

function getMessage(self) {
  return truncate(JSON.stringify(self.actual, replacer), 128) + ' ' +
         self.operator + ' ' +
         truncate(JSON.stringify(self.expected, replacer), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

function _deepEqual(actual, expected) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;

  } else if (util.isBuffer(actual) && util.isBuffer(expected)) {
    if (actual.length != expected.length) return false;

    for (var i = 0; i < actual.length; i++) {
      if (actual[i] !== expected[i]) return false;
    }

    return true;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (!util.isObject(actual) && !util.isObject(expected)) {
    return actual == expected;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b) {
  if (util.isNullOrUndefined(a) || util.isNullOrUndefined(b))
    return false;
  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b);
  }
  try {
    var ka = objectKeys(a),
        kb = objectKeys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key])) return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  } else if (actual instanceof expected) {
    return true;
  } else if (expected.call({}, actual) === true) {
    return true;
  }

  return false;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (util.isString(expected)) {
    message = expected;
    expected = null;
  }

  try {
    block();
  } catch (e) {
    actual = e;
  }

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  if (!shouldThrow && expectedException(actual, expected)) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws.apply(this, [true].concat(pSlice.call(arguments)));
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/message) {
  _throws.apply(this, [false].concat(pSlice.call(arguments)));
};

assert.ifError = function(err) { if (err) {throw err;}};

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

},{"util/":"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/util/util.js"}],"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/inherits/inherits_browser.js":[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js":[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

process.nextTick = (function () {
    var canSetImmediate = typeof window !== 'undefined'
    && window.setImmediate;
    var canMutationObserver = typeof window !== 'undefined'
    && window.MutationObserver;
    var canPost = typeof window !== 'undefined'
    && window.postMessage && window.addEventListener
    ;

    if (canSetImmediate) {
        return function (f) { return window.setImmediate(f) };
    }

    var queue = [];

    if (canMutationObserver) {
        var hiddenDiv = document.createElement("div");
        var observer = new MutationObserver(function () {
            var queueList = queue.slice();
            queue.length = 0;
            queueList.forEach(function (fn) {
                fn();
            });
        });

        observer.observe(hiddenDiv, { attributes: true });

        return function nextTick(fn) {
            if (!queue.length) {
                hiddenDiv.setAttribute('yes', 'no');
            }
            queue.push(fn);
        };
    }

    if (canPost) {
        window.addEventListener('message', function (ev) {
            var source = ev.source;
            if ((source === window || source === null) && ev.data === 'process-tick') {
                ev.stopPropagation();
                if (queue.length > 0) {
                    var fn = queue.shift();
                    fn();
                }
            }
        }, true);

        return function nextTick(fn) {
            queue.push(fn);
            window.postMessage('process-tick', '*');
        };
    }

    return function nextTick(fn) {
        setTimeout(fn, 0);
    };
})();

process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

// TODO(shtylman)
process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};

},{}],"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/util/support/isBufferBrowser.js":[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/util/util.js":[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/util/support/isBufferBrowser.js","_process":"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/process/browser.js","inherits":"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/inherits/inherits_browser.js"}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/index.js":[function(require,module,exports){
var eachNode = require('./lib/eachNode')
var copy = require('./lib/copy')
var iter = require('./lib/iter')
var parse = require('./lib/parse')
var flatKeys = require('./lib/flatKeys')
var unflattenKeys = require('./lib/unflattenKeys')
var evaluate = require('./lib/evaluate')
var isExpr = require('./lib/isExpr')
var getKeys = require('./lib/getKeys')
var previousOpenTag = require('./lib/previousOpenTag')
var ev = require('./lib/ev')

function view(x) {
	var self = this
	if(arguments.length > 1)
		return iter.map(arguments, function(a) { view(a) })
	if(!arguments.length)
		return self.data
	if(x instanceof Node)
		return self.render(x)
	return evaluate(x, self)
}

view.config = {}
view.data = {}
view._bindings = {}

view.child = function() {
	return copy.deep(this, this.bind(this))
}

view.create = function() { return copy.deep(this, this.bind({})) }
view.merge = function(otherView) { return copy.deep(otherView, this) }
view.clear = function() { this._bindings = {}; return this }

view.def = function() {
	var self = this
	// Set a key to a value
	if(arguments.length === 2)
		var obj = unflattenKeys(arguments[0], arguments[1])
	else
		var obj = arguments[0]

	copy.shallow(obj, self.data)
	iter.each(flatKeys(obj), function(key) {
		if(self._bindings[key]) {
			iter.each(self._bindings[key], function(node) {
				self.renderNode(node)
			})
		}
	})
	return self
}

view.render = function(parentNode) {
	var self = this
	if(parentNode instanceof Array || parentNode instanceof NodeList)
		iter.each(parentNode, function(n) { self.render(n) })

	eachNode(parentNode, function(node) {
		// nodeType 8 is a comment
		if(node.nodeType === 8 && isExpr(node.textContent)) {
			iter.each(getKeys(node.textContent), function(k) {
				self._bindings[k] = self._bindings[k] || []
				self._bindings[k].push(node)
			})
			self.renderNode(node)
		}
		return true
	})
	return self
}

view.renderNode = function(commentNode) {
	var self = this
	self.node = previousOpenTag(commentNode) // view.node is the comment's previous open tag (usually the parent node)
	if(!self.node) return
	self.commentNode = commentNode
	var result = evaluate(commentNode.textContent, self)
	if(!result) return
	// If there's actually some result, then we interpolate it (ie. we inject the result into the dom):
	if(commentNode.nextSibling && commentNode.nextSibling.className === 'deja-put')
		var interp = commentNode.nextSibling
	else {
		var interp = document.createElement('span')
		interp.className = 'deja-put'
		commentNode.parentNode.insertBefore(interp, commentNode.nextSibling)
	}
	interp.innerHTML = result
}

view.incr = function(key) {
	this.def(key, this.get(key) + 1)
	return this
}

view.decr = function(key) {
	this.def(key, this.get(key) - 1)
	return this
}

view.toggle = function(key, value) {
	var existing = this.get(key)
	if(existing === val) this.def(key, null)
	else this.def(key, val)
	return this
}

view.push = function(key, val) {
	this.def(key, this.get(key).concat([val]))
	return this
}

view.pop = function(key) {
	var arr = this.get(key), val = arr.pop()
	this.def(key, arr)
	return val
}

view.concat = function(key, arr) {
	this.def(key, this.get(key).concat(arr))
	return this
}

// Weird lol
view = copy.shallow(view, view.bind(view))
module.exports = view

// Default view helpers

view.def('show_if', function(pred) {
	if(pred) this.node.style.display = ''
	else this.node.style.display = 'none'
})

view.def('hide_if', function(pred) {
	if(pred) this.node.style.display = 'none'
	else this.node.style.display = ''
})

view.def('repeat', function(arr) {
	this.node.style.display = 'none'
	this.node.removeChild(this.commentNode)
	// this.commentNode.remove()

	if(this.node.nextSibling && this.node.nextSibling.className === 'deja-repeat') {
		var wrapper = this.node.nextSibling
		this.node.nextSibling.innerHTML = ''
	} else {
		var wrapper = document.createElement('span')
		wrapper.className = 'deja-repeat'
		this.node.parentNode.insertBefore(wrapper, this.node.nextSibling)
	}

	for(var i = 0; i < arr.length; ++i) {
		var cloned = this.node.cloneNode(true),
		    childView = this.create().render(cloned).clear() // clear() saves memory?
		cloned.style.display = ''
		childView.def('this', arr[i])
		if(typeof arr[i] === 'object') childView.def(arr[i])
		wrapper.appendChild(cloned)
	}

	this.node.insertBefore(this.commentNode, this.node.firstChild)
	return false
})

view.def('add', function(x, y) { return view(x) + view(y) })
view.def('incr', function(x) { return view(x) + 1 })
view.def('decr', function(x) { return view(x) - 1 })

view.def('class', function(val) {
	this.node.className += ' ' + val
})

iter.each(ev.events, function(event) {
	view.def('on_' + event, function(expr) {
		ev.bind(this.node, event, function(ev) {
			view.def('event', ev)
			view(expr)
		})
	})
})

view.def('empty',  function(arr)  {return view(arr).length <= 0})
view.def('length', function(arr) {return view(arr).length})
view.def('attr', function(key, val) { this.node.setAttribute(view(key), view(val)) })
view.def('href', function(url) { this.node.setAttribute('href', view(url)) })
view.def('push', function(val, arrKey) { view.push(view(arrKey), view(val)) })
view.def('pop', function(arrKey) { view.pop(view(arrKey)) })
view.def('toggle', function(key, val) { view.toggle(view(key), view(val)) })

view.def('if', function(predicate, thenExpr, elseExpr) {
	if(view(predicate)) return view(thenExpr)
	else return view(elseExpr)
})

view(document.body)

/* TODO
	*
	* Requires event triggering system on data changes:
	* view.def('trigger', fn..)
	* view.def('when', fn..)
	*
	* Requires array representation in view lanaguage:
	* view.def('concat', fn..)
	*
	* partial application, eg:
	* view.def('add', 1, function(n) { return n + 1})
	*/

},{"./lib/copy":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/copy.js","./lib/eachNode":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/eachNode.js","./lib/ev":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/ev.js","./lib/evaluate":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/evaluate.js","./lib/flatKeys":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/flatKeys.js","./lib/getKeys":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/getKeys.js","./lib/isExpr":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/isExpr.js","./lib/iter":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/iter.js","./lib/parse":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/parse.js","./lib/previousOpenTag":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/previousOpenTag.js","./lib/unflattenKeys":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/unflattenKeys.js"}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/copy.js":[function(require,module,exports){
// mutating object copy utilities

var copy = module.exports = {}

copy.shallow = function(from, to) {
	to = to || {}
	for(var key in from) to[key] = from[key]
	return to
}

copy.deep = function(from, to) {
	to = to || {}
	for(var key in from) {
		if(from[key].constructor === Object)
			to[key] = copy.deep(from[key]) // TODO make it stack-iterative
		else
			to[key] = from[key]
	}
	return to
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/deepGet.js":[function(require,module,exports){
// Get a possibly nested set of keys 
// eg. deepGet('x', {x: 1}) -> 1
// eg. deepGet('x.y', {x: {y: 1}}) -> 1
// eg. deepGet('x.y', {'x.y': 1}) -> 1
module.exports = function deepGet(keys, obj) {
	if(obj[keys]) return obj[keys]
	var result = obj, keys = keys.split('.')
	for(var i = 0; i < keys.length; ++i) {
		if(result[keys[i]]) result = result[keys[i]]
		else return
	}
	return result
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/eachNode.js":[function(require,module,exports){
// Traverse a DOM tree and apply a function to each node
// You can bail the traversal early if the fn returns false

var iter = require('./iter')

var eachNode = module.exports = function(node, fn) {
	var stack = [node]
	while (stack.length) {
		var current = stack.pop()
		if(fn(current))
			for(var i = 0; i < current.childNodes.length; ++i)
				stack.push(current.childNodes[i])
	}
}

// Note: a NodeList (which is what we get from node.childNodes) does not have Array methods

},{"./iter":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/iter.js"}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/ev.js":[function(require,module,exports){
// Really basic dom event handling

var prefix = window.addEventListener ? 'on' : '';

module.exports = {
	bind: function(el, type, fn, capture){
		el[window.addEventListener ? 'addEventListener' : 'attachEvent'](prefix + type, fn, capture || false)
		return fn
	},
	unbind: function(el, type, fn, capture){
		el[window.removeEventListener ? 'removeEventListener' : 'detachEvent'](prefix + type, fn, capture || false)
		return fn
	},
	events: ['change', 'click', 'dblclick', 'mousedown', 'mouseup', 'mouseenter', 'mouseleave', 'scroll', 'blur', 'focus', 'input', 'submit', 'keydown', 'keypress', 'keyup']
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/evaluate.js":[function(require,module,exports){
var deepGet = require('./deepGet'),
    parse = require('./parse')

// Evaluate an AST
// Recursive by its nature, but avoids actual recursion using stacks
var evaluate = module.exports = function(expr, view) {

	// Parse the expression first
	if(typeof expr === 'string') {
		var subExprs = parse(expr)
		if(!subExprs) return null
		// De-nest any surrounding parens, eg. "(((a)))" -> "a"
		while(subExprs.length === 1 && (typeof subExprs[0] === 'string'))
			subExprs = parse(subExprs[0])
		var atom = subExprs[0]
	}
	// Pre-parsed expression
	else var atom = expr

	// Return a single value
	if(atom.num || atom.str) return atom.num || atom.str

	// Apply a function
	else if(atom.key) {
		var val = deepGet(atom.key, view.data)
		if(typeof val === "function") return val.apply(view, subExprs.slice(1))
		else return val || ''
	}

	// The rare case where the first argument is itself a funciton that returns a
	// function that is then applied to the rest of the expression. I'm content
	// with this being recursive since it's rare
	else if(typeof atom === 'string')
		return evaluate(atom, view).apply(view, subExprs.slice(1))
}

},{"./deepGet":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/deepGet.js","./parse":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/parse.js"}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/flatKeys.js":[function(require,module,exports){
// Return all the flat key names for an object
// eg: {a: 1, b: {c: 2, {d: 1}}, e: [{q: 'q'}, {q: 'q'}]} // -> ['a', 'b', 'b.c', 'b.c.d', 'e']
// This is useful for binding nested keys 'a.b.c' to change events
module.exports = function flatKeys(obj) {
	var stack = [[obj, '']], // a pair of current object level and current parent key name
	    keys = []
	while(stack.length) {
		var next = stack.pop(), currentObj = next[0], parentKey = next[1], nestedKey
		for(var key in currentObj) {
			nestedKey = key
			if(parentKey.length) nestedKey = parentKey + '.' + nestedKey
			keys.push(nestedKey)
			if(currentObj[key].constructor === Object)
				stack.push([currentObj[key], nestedKey])
		}
	}
	return keys
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/getKeys.js":[function(require,module,exports){
// Given a view s-expr, return all the keywords
// eg. "(add 1 (incr x))" -> ["add", "incr", "x"]

module.exports = function getKeys(expr) {
	var keys = [],
	    matches = [],
	    re = /[\( \^]([^ \(\)'"0-9]+)(?=[\) \$])/g
	while(matches) {
		matches = re.exec(expr)
		if(matches && matches[1])
			keys.push(matches[1])
	}
	return keys
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/isExpr.js":[function(require,module,exports){
// Is the given string a view expression? (ie. is it surrounded by parens?)
var isExpr = module.exports = function(str) {
	return str.trim().match(/^\(.+$/)
}


},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/iter.js":[function(require,module,exports){
// Very simple & tiny browser-compatible map/fold/each/filter without the extras

var iter = module.exports = {}

iter.each = function(arr, fn) {
	if(!arr) return
	for(var i = 0; i < arr.length; ++i)
		fn(arr[i], i)
}

iter.map = function(arr, fn) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		result.push(fn(arr[i], i))
	return result
}

iter.fold = function(arr, init, fn) {
	if(!arr) return init
	var result = init
	for(var i = 0; i < arr.length; ++i)
		result = fn(result, arr[i], i)
	return result
}

iter.filter = function(arr, pred) {
	if(!arr) return []
	var result = []
	for(var i = 0; i < arr.length; ++i)
		if(pred(arr[i], i)) result.push(arr[i])
	return result
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/parse.js":[function(require,module,exports){
// Convert a string expression into an array that evaluate() can use
// eg. "(add 1 (fn (decr x)))"  ->  ["add", 1, "(fn (decr x))"]

// Due to the evaluator's laziness, this is kind of a weird combination of a
// lexer/parser. We only lex/parse the very top level of the expression and
// pass in any sub-expressions unparsed.

// This is a flat O(n) where n is the number of characters in the expression

module.exports = function parse(expr) {
	var matches = []

	for(var position = 0; position < expr.length;) {

		// Return a nested expression bounded by parens
		if(expr[position] === "(") {
			++position
			var start = position
			for(var level = 1; level > 0 && position <= expr.length; ++position) {
				if(expr[position] === ')') --level
				else if(expr[position] === '(') ++level
			}
			matches.push(expr.slice(start, position - 1))
		}

		// Advance on whitespace
		else if(expr[position].match(/\s/)) {
			++position
		}

		// Unmatched closing parens
		else if(expr[position] === ")") {
			throw new Error("Unmatched closing paren")
		}

		// Return a string, number, or keyword
		else {
			var atomMatch = expr.slice(position).match( /^(?:'(.+)')|(?:"(.+)")|(\d+(?:\.\d+)?)|([^ \(\)]+)/ )
			if(atomMatch && atomMatch[0]) {
				if(atomMatch[1] || atomMatch[2]) matches.push({str: atomMatch[1] || atomMatch[2]})
				else if(atomMatch[3]) matches.push({num: Number(atomMatch[3])})
				else if(atomMatch[4]) matches.push({key: atomMatch[4]})
				position += atomMatch[0].length
			} else throw new Error("Unexpected token: " + expr)
		}
	}
	return matches
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/previousOpenTag.js":[function(require,module,exports){
// Return the "previous tag" for a given node, disregarding tree structure If
// you flatten the tree structure of the DOM into just a top-down list of
// nodes, this will just return the node above the current node.

module.exports = function previousOpenTag(node) {
	var prev = node
	while(prev && prev.nodeType !== 1)
		prev = prev.previousSibling
	if(!prev) return node.parentNode
	return prev
}


},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/unflattenKeys.js":[function(require,module,exports){
var iter = require('./iter')

window.uK = module.exports = function unflattenKeys(keyStr, val) {
	var keys = keyStr.split('.'), obj = {}, nested = obj
	for(var i = 0; i < keys.length - 1; ++i) {
		nested[keys[i]] = {}
		nested = nested[keys[i]]
	}
	nested[keys[keys.length-1]] = val
	return obj
}

},{"./iter":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/iter.js"}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/node_modules/domify/index.js":[function(require,module,exports){

/**
 * Expose `parse`.
 */

module.exports = parse;

/**
 * Tests for browser support.
 */

var div = document.createElement('div');
// Setup
div.innerHTML = '  <link/><table></table><a href="/a">a</a><input type="checkbox"/>';
// Make sure that link elements get serialized correctly by innerHTML
// This requires a wrapper element in IE
var innerHTMLBug = !div.getElementsByTagName('link').length;
div = undefined;

/**
 * Wrap map from jquery.
 */

var map = {
  legend: [1, '<fieldset>', '</fieldset>'],
  tr: [2, '<table><tbody>', '</tbody></table>'],
  col: [2, '<table><tbody></tbody><colgroup>', '</colgroup></table>'],
  // for script/link/style tags to work in IE6-8, you have to wrap
  // in a div with a non-whitespace character in front, ha!
  _default: innerHTMLBug ? [1, 'X<div>', '</div>'] : [0, '', '']
};

map.td =
map.th = [3, '<table><tbody><tr>', '</tr></tbody></table>'];

map.option =
map.optgroup = [1, '<select multiple="multiple">', '</select>'];

map.thead =
map.tbody =
map.colgroup =
map.caption =
map.tfoot = [1, '<table>', '</table>'];

map.text =
map.circle =
map.ellipse =
map.line =
map.path =
map.polygon =
map.polyline =
map.rect = [1, '<svg xmlns="http://www.w3.org/2000/svg" version="1.1">','</svg>'];

/**
 * Parse `html` and return a DOM Node instance, which could be a TextNode,
 * HTML DOM Node of some kind (<div> for example), or a DocumentFragment
 * instance, depending on the contents of the `html` string.
 *
 * @param {String} html - HTML string to "domify"
 * @param {Document} doc - The `document` instance to create the Node for
 * @return {DOMNode} the TextNode, DOM Node, or DocumentFragment instance
 * @api private
 */

function parse(html, doc) {
  if ('string' != typeof html) throw new TypeError('String expected');

  // default to the global `document` object
  if (!doc) doc = document;

  // tag name
  var m = /<([\w:]+)/.exec(html);
  if (!m) return doc.createTextNode(html);

  html = html.replace(/^\s+|\s+$/g, ''); // Remove leading/trailing whitespace

  var tag = m[1];

  // body support
  if (tag == 'body') {
    var el = doc.createElement('html');
    el.innerHTML = html;
    return el.removeChild(el.lastChild);
  }

  // wrap map
  var wrap = map[tag] || map._default;
  var depth = wrap[0];
  var prefix = wrap[1];
  var suffix = wrap[2];
  var el = doc.createElement('div');
  el.innerHTML = prefix + html + suffix;
  while (depth--) el = el.lastChild;

  // one element
  if (el.firstChild == el.lastChild) {
    return el.removeChild(el.firstChild);
  }

  // several elements
  var fragment = doc.createDocumentFragment();
  while (el.firstChild) {
    fragment.appendChild(el.removeChild(el.firstChild));
  }

  return fragment;
}

},{}],"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/test/index.js":[function(require,module,exports){
var assert = require('assert'),
    domify = require('domify')

var view = require('../'),
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

describe('view', function() {

	it('returns a single num', function() {
		assert.equal(view('1'), 1)
	})

	it('returns a single num wrapped in arbitrary parens', function() {
		assert.equal(view('(1)'), 1)
		assert.equal(view('(((1)'), 1)
	})

	it('returns a single str', function() {
		assert.equal(view('("hey there!")'), "hey there!")
	})

	it('returns the value for a single key set into the view data', function() {
		view.def('x', 420)
		assert.equal(view('(x'), 420)
	})

	it('returns the return val of a singleton function', function() {
		view.def('hi', function() { return 'heyo!' })
		assert.equal(view('hi'), 'heyo!')
	})

	it('returns the return val of a function taking atoms as params', function() {
		assert.equal(view('(((add 1 2'), 3)
	})

	it('returns the return val of various nested functions', function() {
		assert.equal(view('(((add (incr 1) (decr 2'), 3)
	})

	it('more nested lol', function() {
		assert.equal(view('(((add (add 1 1) (add (add 3 4) (add 2 2)'), 13)
	})

	it('evaluates functions returned by another function', function() {
		view.def('addadd', function(x,y) { return function(z) { return view(x) + view(y) + view(z) }})
		assert.equal(view('((addadd 1 2) 3)'), 6)
	})

	it('evaluates keys that dont exist as empty string', function() {
		assert.equal(view('(watskfasdasdfasd)'), '')
	})

	it('allows for the definition of partial application of functions', function() {
		view.def('partial', 'hi', function(name) { return 'hi ' + view(name) })
		// TODO
		// assert.equal(view('partial 420'), 'hi 420')
	})

	it('allows for the definition of nested dotted keys', function() {
		view.def('x.y.z', 22)
		assert.equal(view.data.x.y.z, 22)
	})

})

describe('.render', function() {

	it('interpolates a num', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (12.32) "))
		view.render(div)
		assert.equal(div.textContent, '12.32')
	})

	it('interpolates a str', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" ('hello! world!') "))
		view.render(div)
		assert.equal(div.textContent, 'hello! world!')
	})

	it('interpolates a fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add 1 2) "))
		view.render(div)
		assert.equal(div.textContent, '3')
	})

	it('interpolates a nested fn', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (str 'answer is' (add 1 2)) "))
		view.def('str', function() { return iter.fold(arguments, '', function(result, s) {return result + ' ' + view(s)}).trim()})
		view.render(div)
		assert.equal(div.textContent, 'answer is 3')
	})

	it('interpolates key values', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add x y) "))
		view.def({x: 2, y: 3})
		view.render(div)
		assert.equal(div.textContent, '5')
	})

	it('runs a function that can mess with the parent node', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (make-blue) "))
		view.def('make-blue', function() { this.node.style.color = 'blue' })
		view.render(div)
		assert.equal(div.style.color, 'blue')
	})

	it('retrieves nested keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		view.def({x: {y: {z: 1}}})
		view.render(div)
		assert.equal(div.textContent, '1')
	})

	it('retrieves unnested but dotted keys from view data', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x.y.z) "))
		view.def("x.y.z", 420)
		view.render(div)
		assert.equal(div.textContent, '420')
	})
})


describe('data binding/updating', function() {

	it('updates an interpolation when data is changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (x) "))
		view.def('x', 1)
		view.render(div)
		assert.equal(div.textContent, '1')
		view.def('x', 2)
		assert.equal(div.textContent, '2')
	})

	it('updates the interpolation of a function return val when data in the function params was changed', function() {
		var div = document.createElement("div")
		div.appendChild(document.createComment(" (add (add (add x x) 1) 1)"))
		view.def('x', 1)
		view.render(div)
		assert.equal(div.textContent, '4')
		view.def('x', 2)
		assert.equal(div.textContent, '6')
	})
})


},{"../":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/index.js","../lib/isExpr":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/isExpr.js","../lib/iter":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/iter.js","../lib/parse":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/lib/parse.js","assert":"/home/big/j/.npm-packages/lib/node_modules/watchify/node_modules/browserify/node_modules/assert/assert.js","domify":"/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/node_modules/domify/index.js"}]},{},["/home/big/j/code/commitchange/app/assets/javascripts/common/lib/deja-view/test/index.js"]);

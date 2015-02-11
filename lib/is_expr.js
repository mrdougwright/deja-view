// Is the given string a view expression? (ie. does it

module.exports = is_expr

function is_expr(str) { return str.match(/^\s*\(.+/) }


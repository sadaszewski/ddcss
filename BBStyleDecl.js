/*

Author: Stanislaw Adaszewski, 2014

*/

(function() {

if (window.BB === undefined) {
    BB = {};
}

BB.StyleDecl = function(params) {
    this.update = function (vars) { for (var i = 0; i < 2; i++) params['dynamicFn'](vars); };
    this._cssNode = params['cssNode'];
    this._params = params;
}

BB.StyleDecl.prototype.remove = function() {
    this._cssNode.remove();
}

BB.StyleDecl.parseUrl = function(url, vars, ctx, cb) {
    var xhr = new BB.XMLHttpRequest();
    xhr.open('GET', url, true);
    xhr.responseType = 'text';
    xhr.addEventListener('load', function(e) {
        if (e.target.status == 200 && cb !== undefined) cb(BB.StyleDecl.parse(e.target.responseText, vars, ctx));
    });
    xhr.send(null);
}

BB.StyleDecl.parse = function(txt, vars, ctx) {

    if (vars == undefined) {
        vars = [];
    }

    var PARSE_SELECTOR = 0;
    var PARSE_KEY = 1;
    var PARSE_VALUE = 2;

    var state = PARSE_SELECTOR;
    var selector = '';
    var key = '';
    var value = '';
    var current = undefined;
    var Q = [];
    var P = [];
    var comment = false;

    for (var i = 0; i < txt.length; i++) {
        var ch = txt[i];

        if (i < txt.length - 1){
            if (ch == '/' && txt[i + 1] == '*') { comment = true; i++; continue; }
            else if (ch == '*' && txt[i + 1] == '/') { comment = false; i++; continue;}
        }

        if (comment) continue;

        switch(state) {
        case PARSE_SELECTOR:
            if (ch == '{') {
                state = PARSE_KEY;
                Q.push(current);
                var attrs = {};
                if (current !== undefined) {
                    for (k in current.attrs) {
                        if (k[0] == '@') attrs[k] = current.attrs[k];
                    }
                }
                selector += ' ';
                current = {'selector': selector, 'attrs': attrs};
            } else {
                selector += ch;
            }
            break;
        case PARSE_KEY:
            if (ch == '{') {
                // nested selector
                state = PARSE_SELECTOR;
                i--;
                selector += key;
                key = '';
            } else if (key.length == 0 && (ch == ' ' || ch == '\t' || ch == '\r' || ch == '\n')) {
                // ignore
            } else if (ch == ':') {
                state = PARSE_VALUE;
                // key = '';
            } else if (ch == '}') {
                if (Q.length == 0) {
                    throw Error('Mismatched brackets.');
                }
                P.unshift(current);
                current = Q.pop();
                if (current !== undefined) {
                    selector = current.selector;
                } else {
                    selector = '';
                }
            } else {
                key += ch;
            }
            break;
        case PARSE_VALUE:
            if (ch == '}') {
                throw Error('Missing semicolon.');
            } else if (ch == ';') {
                key = key.trim();
                current.attrs[key] = value;
                key = '';
                value = '';
                state = PARSE_KEY;
            } else {
                value += ch;
            }
            break;
        }

    }

    if (Q.length != 0) {
        throw Error('Mismatched brackets');
    }

    var static = '';
    var dynamic = 'function dynamicFn(' + vars.join(', ') + ') {';

    for (var i in P) {
        var selector = P[i].selector;
        var attrs = P[i].attrs;

        static += selector + ' {\n';
        var dynamic_1 = [];
        var dynamic_2 = '';

        for (var k in attrs) {
            var v = attrs[k];

            if (k[0] == '@') {
                // variable
                dynamic_2 += 'var ' + k.substr(1) + ' = ' + v + ';\n';
            } else if (v.indexOf('+') != -1 || v.indexOf('==') != -1 || v.indexOf('?') != -1 || v.indexOf('@') != -1 || v.indexOf('*') != -1) {
                // dynamic
                dynamic_1.push('\'' + k.trim().replace('\'', '\\\'') + '\': ' + v);

            } else {
                // static
                static += k + ': ' + v + ';\n';
            }
        }

        static += '}\n';

        if (dynamic_1.length > 0) {
            dynamic += '$(\'' + selector.trim() + '\').each(function() {\n';
            dynamic += 'var cur = $(this);'
            for (var n in ctx) {
                dynamic += 'var ' + ctx[n] + ';\n';
            }

            dynamic += 'while (cur.length > 0) {\n';
            for (var n in ctx) {
                dynamic += 'if (' + ctx[n] + ' === undefined) {\n';
                dynamic += 'var tmp = cur.data(\'' + ctx[n] + '\');\n';
                dynamic += 'if (tmp !== undefined) ' + ctx[n] + ' = tmp;\n';
                dynamic += '}\n';
            }
            dynamic += 'cur = cur.parent();\n';
            dynamic += '}\n';

            dynamic += dynamic_2;

            dynamic += '$(this).css({' + dynamic_1.join(',\n') + '});\n';
            dynamic += '});\n';
        }
    }

    dynamic += '}';

    var cssNode = $('<style type="text/css"></style>').text(static);

    $('body').append(cssNode);

    var dynamicFn;
    eval(dynamic);

    return new BB.StyleDecl({'P': P, 'static': static, 'dynamic': dynamic, 'dynamicFn': dynamicFn, 'cssNode': cssNode});
};

})();
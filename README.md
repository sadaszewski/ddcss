ddcss
=====

Declaratively Dynamic Cascading Style Sheets

Example:

```css

/*
    app: Application variable
    obj: currently processed object
*/

.project .ui {
    @w: 300 + app.maxIndentLevel * app.indent;

    width: w + 'px';
    margin-left: (-w) + 'px';

    .tree {
        width: w + app.scrollBarWidth + 'px';
    }
}

.project .ui .tree .row {
    display: obj.parent == null ||
        obj.parent.row.find('.up:visible, .remove:visible').length > 0 ?
            'block' : 'none';

    @indent: (app.maxIndentLevel - obj.indentLevel) * app.indent;

    width: 300 - 8 + indent + 'px';

    margin-left: obj.indentLevel * app.indent;

    .path {
        width: 240 + indent + 'px';
    }

    .up {
        display: app.activeObj == obj ? 'block' : 'none';
    }

    .children {
        display: obj.parent == null &&
            app.activeObj != obj &&
                obj.children.length > 0 ?
                    'block' : 'none';
    }

    .remove {
        display: app.activeObj != obj &&
            (obj.parent != null ||
                obj.children.length == 0) ?
                    'block' : 'none';
    }
}
```

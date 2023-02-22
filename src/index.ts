import * as jQuery from 'jquery';
let $ = jQuery.default;

type PrepNode = {
  expanded: boolean;
  moves: Record<string, PrepNode>;
}

class PrepView {
  public root: PrepNode = {expanded: true, moves: {}};
  constructor() {
    this.root.moves['e4'] = {expanded: false, moves: {}};
    this.root.moves['e5'] = {expanded: true, moves: {'Nf6': {expanded: false, moves: {}}}};
  }
  render(node: PrepNode): JQuery {
    let res = $('<div class="prep-node">');
    if (!node.expanded) {
      return res;
    }
    let ul = $('<ul class="prep-ul">');
    for (let move in node.moves) {
      let child = node.moves[move];
      let li = $('<li class="prep-li">');
      let expText = $.isEmptyObject(child.moves) ? '\u25c6' : child.expanded ? '\u25BC' : '\u25B6';
      let exp = $('<span class="prep-exp">').text(expText);
      exp.click(() => {
        child.expanded = !child.expanded;
        this.rerender();
      });
      li.append(exp);
      li.append($('<span>').text(move));
      li.append(this.render(child));
      ul.append(li);
    }
    res.append(ul);
    return res;
  }
  rerender() {
    $('#prep-display').empty();
    $('#prep-display').append(this.render(this.root));
  }
}

function main() {
  $(function() {
    let view = new PrepView();
    view.rerender();
  });
}

main();

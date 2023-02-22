import * as jQuery from 'jquery';
let $ = jQuery.default;

type PrepNode = {
  expanded: boolean;
  moves: Record<string, PrepNode>;
}

class PrepView {
  public root: PrepNode = {expanded: false, moves: {}};
  constructor() {
    this.root.expanded = true;
    this.root.moves['e4'] = {expanded: false, moves: {}};
    this.root.moves['e5'] = {expanded: true, moves: {'Nf6': {expanded: false, moves: {}}}};
  }
  render(node: PrepNode): JQuery  {
    let res = $('<div class="prep-node">');
    if (!node.expanded) {
      return res;
    }
    let ul = $('<ul>');
    for (let move in node.moves) {
      let child = node.moves[move];
      let li = $('<li>');
      li.append($('<span>').text(move));
      li.append(this.render(child));
      ul.append(li);
    }
    res.append(ul);
    return res;
  }
}

function main() {
  $(function() {
    let view = new PrepView();
    $('#prep-display').append(view.render(view.root));
  });
}

main();

import * as jQuery from 'jquery';
let $ = jQuery.default;

type PrepNode = {
  expanded: boolean;
  moves: Record<string, PrepNode>;
}

class PrepView {
  public root: PrepNode = {expanded: false, moves: {}};
  constructor() {
  }
  render(node: PrepNode): JQuery  {
    return $('<div>').text('hello');
  }
}

function main() {
  $(function() {
    let view = new PrepView();
    $('#prep-display').append(view.render(view.root));
  });
}

main();

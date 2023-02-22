
import * as jQuery from 'jquery';
let $ = jQuery.default;
(window as any).$ = $;

import {Chess, PartialMove} from 'chess.ts';

import * as chessboard from 'chessboardjs';

type PrepNode = {
  expanded: boolean;
  moves: Record<string, PrepNode>;
}

class PrepView {
  public root: PrepNode = {expanded: true, moves: {}};
  public focus: string[] = [];

  constructor() {
    this.root.moves['e4'] = {expanded: false, moves: {}};
    this.root.moves['d4'] = {expanded: true, moves: {'Nf6': {expanded: false, moves: {}}}};
    this.focus = ['e4'];
  }

  render(node: PrepNode, history: string[]): JQuery {
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
      let moveText = $('<span class="prep-move">').text(move);
      li.append(moveText);
      let history2 = [...history, move];
      if (JSON.stringify(this.focus) == JSON.stringify(history2)) {
        moveText.addClass('prep-focus');
      }
      moveText.click(() => {
        this.focus = history2;
        this.rerender();
      });
      li.append(this.render(child, history2));
      ul.append(li);
    }
    res.append(ul);
    return res;
  }

  renderBoardAfterMoves(moves: string[]) {
    let chess = new Chess();
    for (let move of moves) {
      let legalMoves = chess.moves();
      if (!legalMoves.includes(move)) {
        console.log('illegal move: ' + move);
      }
      chess.move(move);
    }
    let fen = chess.fen();
    (chessboard as any).default('board', fen);
  }

  rerender() {
    $('#prep-display').empty();
    $('#prep-display').append(this.render(this.root, []));
    this.renderBoardAfterMoves(this.focus);
  }
}

function main() {
  (window as any).bar = chessboard;
  $(function() {
    let view = new PrepView();
    view.rerender();
  });
}

main();

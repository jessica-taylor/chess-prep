
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

  expandInto(moves: string[]) {
    var node = this.root;
    for (let move of moves) {
      node.expanded = true;
      if (node.moves[move] == null) {
        node.moves[move] = {expanded: false, moves: {}};
      }
      node = node.moves[move];
    }
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

  chessStateAfterMoves(moves: string[]): Chess {
    let chess = new Chess();
    for (let move of moves) {
      let legalMoves = chess.moves();
      if (!legalMoves.includes(move)) {
        console.log('illegal move: ' + move);
      }
      chess.move(move);
    }
    return chess;
  }

  renderBoardAfterMoves(moves: string[]) {
    let chess = this.chessStateAfterMoves(moves);
    let fen = chess.fen();
    (chessboard as any).default('board', {
      draggable: true,
      position: fen,
      onDrop: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: any) => {
        let oldState = this.chessStateAfterMoves(moves);
        let pmove: PartialMove = {from: source, to: target};
        if (piece[1] == 'P') {
          pmove.promotion = 'q'; // TODO popup prompt?
        }
        let move = oldState.move(pmove);
        if (move == null) {
          return 'snapback';
        }
        this.focus = [...moves, move.san];
        this.expandInto(this.focus);
        this.rerender();
        console.log('move: ' + source + ' ' + target + ' ' + piece + ' ' + newPos + ' ' + oldPos + ' ' + orientation);
      }
    });
  }

  rerender() {
    $('#prep-display').empty();
    let startMove = $('<span class="prep-move">').text('start');
    startMove.click(() => {
      this.focus = [];
      this.rerender();
    });
    if (this.focus.length == 0) {
      startMove.addClass('prep-focus');
    }
    $('#prep-display').append(startMove);
    $('#prep-display').append(this.render(this.root, []));
    this.renderBoardAfterMoves(this.focus);
  }

  deleteMove() {
    if (this.focus.length == 0) {
      return;
    }
    let node = this.root;
    for (let i = 0; i < this.focus.length - 1; i++) {
      node = node.moves[this.focus[i]];
    }
    let lastMove = this.focus[this.focus.length - 1];
    delete node.moves[lastMove];
    this.focus = this.focus.slice(0, this.focus.length - 1);
    this.rerender();
  }
}

function main() {
  (window as any).bar = chessboard;
  $(function() {
    let view = new PrepView();
    view.rerender();
    $('#delete-button').click(function() {
      console.log('deleting!');
      view.deleteMove();
    });
  });
}

main();

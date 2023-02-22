
import * as jQuery from 'jquery';
let $ = jQuery.default;
(window as any).$ = $;

import {Chess, PartialMove, PieceSymbol} from 'chess.ts';

import * as chessboard from 'chessboardjs';

type PrepMove = {
  algebraic: string;
  recommended: boolean;
  next: PrepNode;
}

type PrepNode = {
  expanded: boolean;
  moves: PrepMove[];
}

function nodeGetMoveIx(node: PrepNode, algebraic: string): number | null {
  for (var i = 0; i < node.moves.length; ++i) {
    if (node.moves[i].algebraic == algebraic) {
      return i;
    }
  }
  return null;
}

function nodeGetMove(node: PrepNode, algebraic: string): PrepMove | null {
  let ix = nodeGetMoveIx(node, algebraic);
  if (ix == null) {
    return null;
  }
  return node.moves[ix];
}

class PrepView {
  public root: PrepNode = {expanded: true, moves: []};
  public focus: string[] = [];

  constructor() {
    // this.root.moves['e4'] = {expanded: false, recommended: true, moves: {}};
    // this.root.moves['d4'] = {expanded: true, recommended: true, moves: {'Nf6': {expanded: false, recommended: false, moves: {}}}};
    // this.focus = ['e4'];
  }

  getNodeAfterMoves(moves: string[]): PrepNode | null {
    var node = this.root;
    for (let move of moves) {
      let pmove = nodeGetMove(node, move);
      if (pmove == null) {
        return null;
      }
      node = pmove.next;
    }
    return node;
  }

  expandInto(moves: string[]) {
    var node = this.root;
    for (let move of moves) {
      node.expanded = true;
      let pmove = nodeGetMove(node, move);
      if (pmove == null) {
        pmove = {algebraic: move, recommended: false, next: {expanded: false, moves: []}};
        node.moves.push(pmove);
      }
      node = pmove.next;
    }
  }

  render(node: PrepNode, history: string[]): JQuery {
    let res = $('<div class="prep-node">');
    if (!node.expanded) {
      return res;
    }
    let ul = $('<ul class="prep-ul">');
    for (let move of node.moves) {
      let li = $('<li class="prep-li">');
      var history2 = history;

      while (true) {
        let moveText = $('<span class="prep-move">').text(move.algebraic);
        li.append(moveText);
        history2 = [...history2, move.algebraic];
        if (JSON.stringify(this.focus) == JSON.stringify(history2)) {
          moveText.addClass('prep-focus');
        }
        if (move.recommended) {
          moveText.addClass('prep-recommended');
        }
        if (history2.length % 2 == 0) {
          moveText.addClass('prep-black');
        } else {
          moveText.addClass('prep-white');
        }
        let history3 = history2;
        moveText.click(() => {
          this.focus = history3;
          this.rerender();
        });

        let expText = $.isEmptyObject(move.next.moves) ? '\u25c6' : move.next.expanded ? '\u25BC' : '\u25B6';
        let exp = $('<span class="prep-exp">').text(expText);
        let move2 = move;
        exp.click(() => {
          move2.next.expanded = !move2.next.expanded;
          this.rerender();
        });
        li.append(exp);

        if (move2.next.expanded && Object.keys(move2.next.moves).length == 1) {
          move = move2.next.moves[0];
        } else {
          break;
        }
      }

      li.append(this.render(move.next, history2));
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
          pmove.promotion = $('#promote-select').val() as PieceSymbol;
        }
        let move = oldState.move(pmove);
        if (move == null) {
          return 'snapback';
        }
        this.focus = [...moves, move.san];
        this.expandInto(this.focus);
        this.rerender();
        // console.log('move: ' + source + ' ' + target + ' ' + piece + ' ' + newPos + ' ' + oldPos + ' ' + orientation);
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
    let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to delete move', this.focus);
      return;
    }
    let lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
    if (lastMoveIx == null) {
      console.log("failed to delete move", this.focus);
      return;
    }
    secondLast.moves.splice(lastMoveIx, 1);
    this.focus = this.focus.slice(0, this.focus.length - 1);
    this.rerender();
  }

  toggleRecommended() {
    let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to delete move', this.focus);
      return;
    }
    let lastMove = nodeGetMove(secondLast, this.focus[this.focus.length - 1]);
    if (lastMove == null) {
      console.log("failed to delete move", this.focus);
      return;
    }
    lastMove.recommended = !lastMove.recommended;
    this.rerender();
  }

  exportFile() {
    let content = JSON.stringify(this.root);

    // Create element with <a> tag
    const link = document.createElement("a");
    
    // Create a blog object with the file content which you want to add to the file
    const file = new Blob([content], { type: 'text/plain' });
    
    // Add file content in the object URL
    link.href = URL.createObjectURL(file);
    
    // Add file name
    link.download = "prep.json";
    
    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
  }

  importFile(text: string) {
    console.log('import', text);
    this.root = JSON.parse(text) as PrepNode;
    this.focus = [];
    this.rerender();
  }
}

function main() {
  (window as any).bar = chessboard;
  $(function() {
    let view = new PrepView();
    view.rerender();
    $('#delete-button').click(function() {
      view.deleteMove();
    });
    $('#recommended-button').click(function() {
      view.toggleRecommended();
    });
    $('#export-button').click(function() {
      view.exportFile();
    });
    $('#import-file').change(function() {
      ((this as any).files[0] as File).text().then((text) => view.importFile(text));
    });
  });
}

main();

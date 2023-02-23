
import * as jQuery from 'jquery';
let $ = jQuery.default;
(window as any).$ = $;

import {Chess, PartialMove, PieceSymbol} from 'chess.ts';

import * as chessboard from 'chessboardjs';

let startFen: string = new Chess().fen();

type PrepMove = {
  algebraic: string;
  recommended: boolean;
  // next: PrepNode;
}

type PrepNode = {
  expanded: boolean;
  notes: string;
  moves: PrepMove[];
}

function nodeGetMoveIx(node: PrepNode, algebraic: string): number{
  for (var i = 0; i < node.moves.length; ++i) {
    if (node.moves[i].algebraic == algebraic) {
      return i;
    }
  }
  return -1;
}

function nodeGetMove(node: PrepNode, algebraic: string): PrepMove | null {
  let ix = nodeGetMoveIx(node, algebraic);
  if (ix == -1) {
    return null;
  }
  return node.moves[ix];
}

function simplifyFen(fen: string): string {
  let chess = new Chess(fen);
  let moves = chess.moves({verbose: true});
  let parts = fen.split(' ');
  var hasEnPassent = false;
  for (let move of moves) {
    if (move.flags.includes('e')) {
      hasEnPassent = true;
      break;
    }
  }
  // remove en passent if not possible
  if (!hasEnPassent) {
    parts[3] = '-';
  }
  parts[4] = '0';
  parts[5] = '1';
  return parts.join(' ');
}

function chessStateAfterMoves(moves: string[]): Chess {
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

function fenAfterMoves(moves: string[]): string {
  return simplifyFen(chessStateAfterMoves(moves).fen());
}

function fenAfterMove(fen: string, move: string): string | null {
  let chess = new Chess(fen);
  if (chess.move(move) == null) {
    return null;
  }
  return simplifyFen(chess.fen());
}

interface TreeEventHandlers {
  clickMove(move: MoveComponent): void;
  getNodeAfterMoves(history: string[]): PrepNode | null;
}

class MoveComponent {
  public move: PrepMove;
  public history: string[];
  private handlers: TreeEventHandlers;
  public jquery: JQuery;
  constructor(move: PrepMove, history: string[], handlers: TreeEventHandlers) {
    this.move = move;
    this.history = history;
    this.handlers = handlers;
    this.jquery = $('<span class="prep-move">');
  }

  render(focus: string[]) {
    this.jquery.empty();
    this.jquery.text(this.move.algebraic);
    if (JSON.stringify(focus) == JSON.stringify([...this.history, this.move.algebraic])) {
      this.jquery.addClass('prep-focus');
    }
    if (this.move.recommended) {
      this.jquery.addClass('prep-recommended');
    }
    if (this.history.length % 2 == 0) {
      this.jquery.addClass('prep-white');
    } else {
      this.jquery.addClass('prep-black');
    }
    this.jquery.click(() => {
      this.handlers.clickMove(this)
    });
  }

}

type MoveAndNodeComponents = {
  moveComponent: MoveComponent;
  nodeComponent: NodeComponent;
};

class NodeComponent {
  public node: PrepNode;
  public history: string[];
  private moveNodeComponents: MoveAndNodeComponents[] = [];
  private handlers: TreeEventHandlers;
  public jquery: JQuery;

  constructor(node: PrepNode, history: string[], handlers: TreeEventHandlers) {
    this.node = node;
    this.history = history;
    this.handlers = handlers;
    this.jquery = $('<span class="prep-node">');
  }

  render(focus: string[]) {
    this.moveNodeComponents = [];
    for (let move of this.node.moves) {
      let newHistory = [...this.history, move.algebraic];
      let mc = new MoveComponent(move, newHistory, this.handlers);
      let node = this.handlers.getNodeAfterMoves(newHistory);
      if (node == null) {
        node = {expanded: false, notes: '', moves: []};
      }
      let nc = new NodeComponent(node, newHistory, this.handlers);
      this.moveNodeComponents.push({moveComponent: mc, nodeComponent: nc});
    }

    this.jquery.empty();

    let expText = $.isEmptyObject(this.node.moves) ? '\u25c6' : this.node.expanded ? '\u25BC' : '\u25B6';
    let exp = $('<span class="prep-exp">').text(expText);
    exp.click(() => {
      this.node.expanded = !this.node.expanded;
      this.render(focus);
    });

    this.jquery.append(exp);
    if (this.node.moves.length == 0) {
      return;
    }
    if (this.node.moves.length == 1) {
      let mc = this.moveNodeComponents[0].moveComponent;
      mc.render(focus);
      this.jquery.append(mc.jquery);
      let nc = this.moveNodeComponents[0].nodeComponent;
      nc.render(focus);
      this.jquery.append(nc.jquery);
      return;
    }
    let ul = $('<ul class="prep-ul">');
    for (var i = 0; i < this.node.moves.length; ++i) {
      let mnc = this.moveNodeComponents[i];
      let li = $('<li class="prep-li">');
      let mc = mnc.moveComponent;
      mc.render(focus);
      li.append(mc.jquery);
      let nc = mnc.nodeComponent;
      nc.render(focus);
      li.append(nc.jquery);
      ul.append(li);
    }
    this.jquery.append(ul);
  }

  getMoveComponent(postfix: string[]): MoveComponent | null {
    if (postfix.length == 0) {
      return null;
    }
    var node: NodeComponent = this;
    for (var i = 0; i < postfix.length - 1; ++i) {
      let ix = nodeGetMoveIx(node.node, postfix[i]);
      if (ix == -1) {
        return null;
      }
      node = node.moveNodeComponents[ix].nodeComponent;
    }
    let ix = nodeGetMoveIx(node.node, postfix[postfix.length - 1]);
    if (ix == -1) {
      return null;
    }
    return node.moveNodeComponents[ix].moveComponent;
  }
}

class PrepView implements TreeEventHandlers {
  public nodes: Record<string, PrepNode> = {};
  // public root: PrepNode = {expanded: true, moves: []};
  public focus: string[] = [];

  constructor() {
    this.nodes[startFen] = {expanded: true, notes: '', moves: []};
    // this.root.moves['e4'] = {expanded: false, recommended: true, moves: {}};
    // this.root.moves['d4'] = {expanded: true, recommended: true, moves: {'Nf6': {expanded: false, recommended: false, moves: {}}}};
    // this.focus = ['e4'];
  }

  getNodeOfFen(fen: string): PrepNode {
    let node = this.nodes[fen];
    if (!node) {
      return this.nodes[fen] = {expanded: true, notes: '', moves: []};
    }
    return node;
  }

  getNodeAfterMoves(moves: string[]): PrepNode | null {
    var fen = startFen;
    var node = this.getNodeOfFen(fen);
    for (let move of moves) {
      let pmove = nodeGetMove(node, move);
      if (pmove == null) {
        return null;
      }
      let nextFen = fenAfterMove(fen, move);
      if (nextFen == null) {
        return null;
      }
      fen = nextFen;
      node = this.getNodeOfFen(fen);
    }
    return node;
  }

  expandInto(moves: string[]) {
    var fen = startFen;
    var node = this.getNodeOfFen(fen);
    for (let move of moves) {
      var pmove = nodeGetMove(node, move);
      if (pmove == null) {
        pmove = {algebraic: move, recommended: false};
        node.moves.push(pmove);
      }
      let nextFen = fenAfterMove(fen, move);
      if (nextFen == null) {
        console.log('invalid move', move);
        return null;
      }
      fen = nextFen;
      node = this.getNodeOfFen(fen);
      node.expanded = true;
    }
  }

  render(fen: string, history: string[]): JQuery {
    let node = this.getNodeOfFen(fen);
    let res = $('<div class="prep-node">');
    if (!node.expanded) {
      return res;
    }
    let ul = $('<ul class="prep-ul">');
    for (let move of node.moves) {
      let li = $('<li class="prep-li">');
      var history2 = history;
      var currFen = fen;
      var error = false;

      while (true) {
        let childFen = fenAfterMove(currFen, move.algebraic);
        if (childFen == null) {
          console.log('invalid child move', move.algebraic);
          error = true;
          break;
        }

        let childNode = this.getNodeOfFen(childFen);
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
          this.rerender(true);
        });

        let expText = $.isEmptyObject(childNode.moves) ? '\u25c6' : childNode.expanded ? '\u25BC' : '\u25B6';
        let exp = $('<span class="prep-exp">').text(expText);
        let childNode2 = childNode;
        exp.click(() => {
          childNode2.expanded = !childNode2.expanded;
          this.rerender();
        });
        li.append(exp);

        currFen = childFen;
        if (childNode.expanded && Object.keys(childNode.moves).length == 1) {
          move = childNode.moves[0];
        } else {
          break;
        }
      }

      if (!error) {
        li.append(this.render(currFen, history2));
      }
      ul.append(li);
    }
    res.append(ul);
    return res;
  }


  renderBoardAfterMoves(moves: string[]) {
    (chessboard as any).default('board', {
      draggable: true,
      position: fenAfterMoves(moves),
      onDrop: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: any) => {
        let oldState = chessStateAfterMoves(moves);
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
        this.rerender(true);
      }
    });
  }

  rerender(changeNotes: boolean = false) {
    $('#prep-display').empty();
    let startMove = $('<span class="prep-move">').text('start');
    startMove.click(() => {
      this.focus = [];
      this.rerender(true);
    });
    if (this.focus.length == 0) {
      startMove.addClass('prep-focus');
    }
    $('#prep-display').append(startMove);
    $('#prep-display').append(this.render(startFen, []));
    this.renderBoardAfterMoves(this.focus);

    if (changeNotes) {
      let node = this.getNodeAfterMoves(this.focus);
      if (node != null) {
        $('#position-notes').val(node.notes);
      }
    }
  }

  clickMove(mc: MoveComponent) {
    mc.render(this.focus);
    // TODO render other focused thing
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
    if (lastMoveIx == -1) {
      console.log("failed to delete move", this.focus);
      return;
    }
    let last = this.getNodeAfterMoves(this.focus);
    if (last != null && (last.moves.length > 0 || last.notes != '')) {
      if (!confirm('This move has children or notes. Are you sure you want to delete it?')) {
        return;
      }
    }
    secondLast.moves.splice(lastMoveIx, 1);
    this.focus = this.focus.slice(0, this.focus.length - 1);
    this.rerender(true);
  }

  toggleRecommended() {
    if (this.focus.length == 0) {
      return;
    }
    let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to change recommended move', this.focus);
      return;
    }
    let lastMove = nodeGetMove(secondLast, this.focus[this.focus.length - 1]);
    if (lastMove == null) {
      console.log("failed to change recommended move", this.focus);
      return;
    }
    lastMove.recommended = !lastMove.recommended;
    this.rerender();
  }

  swapMove(offset: number) {
    if (this.focus.length == 0) {
      return;
    }
    let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to swap move', this.focus);
      return;
    }
    let lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
    if (lastMoveIx == -1) {
      console.log("failed to swap move", this.focus);
      return;
    }
    let swapIx = lastMoveIx + offset;
    if (swapIx < 0 || swapIx >= secondLast.moves.length) {
      return;
    }
    let temp = secondLast.moves[lastMoveIx];
    secondLast.moves[lastMoveIx] = secondLast.moves[swapIx];
    secondLast.moves[swapIx] = temp;
    this.rerender();
  }

  exportFile() {
    let content = JSON.stringify(this.nodes);

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
    this.nodes = JSON.parse(text) as Record<string, PrepNode>;
    this.focus = [];
    this.rerender(true);
  }

  focusArrow(direction: string) {
    var secondLast = null;
    var lastMoveIx = -1;
    if (this.focus.length != 0) {
      secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
      if (secondLast != null) {
        lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
      }
    }
    let last = this.getNodeAfterMoves(this.focus);
    if (direction == 'left') {
      this.focus = this.focus.slice(0, -1);
      this.rerender();
    } else if (direction == 'right') {
      if (last != null && last.moves.length > 0) {
        this.focus = [...this.focus, last.moves[0].algebraic];
        this.rerender();
      }
    } else if (direction == 'up') {
      let moveIx = lastMoveIx - 1;
      if (moveIx >= 0 && secondLast != null) {
        this.focus = [...this.focus.slice(0, -1), secondLast.moves[moveIx].algebraic];
        this.rerender();
      }
    } else if (direction == 'down') {
      if (lastMoveIx != -1 && secondLast != null) {
        let moveIx = lastMoveIx + 1;
        if (moveIx < secondLast.moves.length) {
          this.focus = [...this.focus.slice(0, -1), secondLast.moves[moveIx].algebraic];
          this.rerender();
        }
      }
    }
  }
}

function main() {
  (window as any).bar = chessboard;
  $(function() {
    let view = new PrepView();
    view.rerender(true);
    $('#delete-button').click(function() {
      view.deleteMove();
    });
    $('#up-button').click(function() {
      view.swapMove(-1);
    });
    $('#down-button').click(function() {
      view.swapMove(1);
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
    $('#save-notes-button').click(function() {
      let node = view.getNodeAfterMoves(view.focus);
      if (node != null) {
        node.notes = $('#position-notes').val() as string;
      }
    });
    $(document).keydown(function(event) {
      if (event.ctrlKey) {
        if (event.key == 'ArrowLeft') {
          view.focusArrow('left');
        } else if (event.key == 'ArrowRight') {
          view.focusArrow('right');
        } else if (event.key == 'ArrowUp') {
          view.focusArrow('up');
        } else if (event.key == 'ArrowDown') {
          view.focusArrow('down');
        }
      }
    });
    $(window).on('beforeunload', function() {
      return 'Are you sure you want to leave?';
    });
  });
}

main();

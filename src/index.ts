
import * as jQuery from 'jquery';
let $ = jQuery.default;
(window as any).$ = $;

import {Chess, PartialMove, PieceSymbol} from 'chess.ts';

import * as chessboard from 'chessboardjs';

import {PrepMove, PrepNode, startPrepMove, startFen, TreeEventHandlers, getMoveIx, nodeGetMoveIx, nodeGetMove, simplifyFen, chessStateAfterMoves, fenAfterMoves, fenAfterMove} from './types';
import Move from './svelte/Move.svelte';
import Node from './svelte/Node.svelte';
import Main from './svelte/Main.svelte';




// class MoveComponent {
//   public move: PrepMove;
//   public history: string[];
//   private handlers: TreeEventHandlers;
//   public jquery: JQuery;
//   constructor(move: PrepMove, history: string[], handlers: TreeEventHandlers) {
//     this.move = move;
//     this.history = history;
//     this.handlers = handlers;
//     this.jquery = $('<span class="move-container">');
//   }
// 
//   render() {
//     this.jquery.empty();
//     let moveSpan = $('<span class="prep-move">');
//     this.jquery.append(moveSpan);
//     moveSpan.text(this.move.algebraic);
//     if (JSON.stringify(this.handlers.getFocus()) == JSON.stringify(this.history)) {
//       moveSpan.addClass('prep-focus');
//     }
//     if (this.move.recommended) {
//       moveSpan.addClass('prep-recommended');
//     }
//     if (this.history.length % 2 == 1) {
//       moveSpan.addClass('prep-white');
//     } else {
//       moveSpan.addClass('prep-black');
//     }
//     moveSpan.click(() => {
//       this.handlers.clickMoveAt(this.history);
//     });
//     let fenAfter = fenAfterMoves(this.history);
//     if (fenAfter != null) {
//       let nodeAfter = this.handlers.getNodeOfFen(fenAfter);
//       if (nodeAfter.notes) {
//         moveSpan.addClass('prep-annotated');
//       }
//     }
//   }
// 
// }
// 
// type MoveAndNodeComponents = {
//   moveComponent: MoveComponent;
//   nodeComponent: NodeComponent;
// };
// 
// class NodeComponent {
//   public node: PrepNode;
//   public history: string[];
//   private moveNodeComponents: MoveAndNodeComponents[] = [];
//   private handlers: TreeEventHandlers;
//   private fen: string;
//   public jquery: JQuery;
// 
//   constructor(node: PrepNode, history: string[], fen: string, handlers: TreeEventHandlers) {
//     this.node = node;
//     this.history = history;
//     this.handlers = handlers;
//     this.fen = fen;
//     this.jquery = $('<span class="prep-node">');
//   }
// 
// 
//   render() {
//     this.moveNodeComponents = [];
//     if (this.node.expanded) {
//       for (let move of this.node.moves) {
//         let newHistory = [...this.history, move.algebraic];
//         let fen = fenAfterMove(this.fen, move.algebraic);
//         if (fen == null) {
//           console.log('invalid move', move.algebraic);
//           fen = startFen;
//         }
//         let mc = new MoveComponent(move, newHistory, this.handlers);
//         let node = this.handlers.getNodeOfFen(fen);
//         if (node == null) {
//           node = {expanded: false, notes: '', moves: []};
//         }
//         let nc = new NodeComponent(node, newHistory, fen, this.handlers);
//         this.moveNodeComponents.push({moveComponent: mc, nodeComponent: nc});
//       }
//     }
// 
//     this.jquery.empty();
// 
//     let expText = $.isEmptyObject(this.node.moves) ? '\u25c6' : this.node.expanded ? '\u25BC' : '\u25B6';
//     let exp = $('<span class="prep-exp">').text(expText);
//     exp.click(() => {
//       this.node.expanded = !this.node.expanded;
//       this.render();
//     });
// 
//     this.jquery.append(exp);
//     if (!this.node.expanded || this.node.moves.length == 0) {
//       return;
//     }
//     if (this.node.moves.length == 1) {
//       let mc = this.moveNodeComponents[0].moveComponent;
//       mc.render();
//       this.jquery.append(mc.jquery);
//       let nc = this.moveNodeComponents[0].nodeComponent;
//       nc.render();
//       this.jquery.append(nc.jquery);
//       return;
//     }
//     let ul = $('<ul class="prep-ul">');
//     for (var i = 0; i < this.node.moves.length; ++i) {
//       let mnc = this.moveNodeComponents[i];
//       let li = $('<li class="prep-li">');
//       let mc = mnc.moveComponent;
//       mc.render();
//       li.append(mc.jquery);
//       let nc = mnc.nodeComponent;
//       nc.render();
//       li.append(nc.jquery);
//       ul.append(li);
//     }
//     this.jquery.append(ul);
//   }
// 
//   getNodeComponent(postfix: string[]): NodeComponent | null {
//     var node: NodeComponent = this;
//     for (let nextMove of postfix) {
//       if (node.moveNodeComponents.length == 0) {
//         return null;
//       }
//       let ix = nodeGetMoveIx(node.node, nextMove);
//       if (ix == -1) {
//         return null;
//       }
//       node = node.moveNodeComponents[ix].nodeComponent;
//     }
//     return node;
//   }
// 
//   getMoveComponent(postfix: string[]): MoveComponent | null {
//     if (postfix.length == 0) {
//       return null;
//     }
//     var node = this.getNodeComponent(postfix.slice(0, -1));
//     if (node == null || node.moveNodeComponents.length == 0) {
//       return null;
//     }
//     let ix = nodeGetMoveIx(node.node, postfix[postfix.length - 1]);
//     if (ix == -1) {
//       return null;
//     }
//     return node.moveNodeComponents[ix].moveComponent;
//   }
// }
// 
// class PrepView implements TreeEventHandlers {
//   public nodes: Record<string, PrepNode> = {};
//   // public root: PrepNode = {expanded: true, moves: []};
//   public focus: string[] = [];
// 
//   private startMove: MoveComponent;
//   private rootComponent: NodeComponent;
// 
//   constructor() {
//     this.nodes[startFen] = {expanded: true, notes: '', moves: []};
//     this.startMove = new MoveComponent(startPrepMove, [], this);
//     this.rootComponent = new NodeComponent(this.nodes[startFen], [], startFen, this);
//   }
// 
//   getFocus(): string[] {
//     return this.focus;
//   }
// 
//   getNodeOfFen(fen: string): PrepNode {
//     let node = this.nodes[fen];
//     if (!node) {
//       return this.nodes[fen] = {expanded: true, notes: '', moves: []};
//     }
//     return node;
//   }
// 
//   getNodeAfterMoves(moves: string[]): PrepNode | null {
//     var fen = startFen;
//     var node = this.getNodeOfFen(fen);
//     for (let move of moves) {
//       let pmove = nodeGetMove(node, move);
//       if (pmove == null) {
//         return null;
//       }
//       let nextFen = fenAfterMove(fen, move);
//       if (nextFen == null) {
//         return null;
//       }
//       fen = nextFen;
//       node = this.getNodeOfFen(fen);
//     }
//     return node;
//   }
// 
//   expandInto(moves: string[]) {
//     var fen = startFen;
//     var node = this.getNodeOfFen(fen);
//     for (let move of moves) {
//       var pmove = nodeGetMove(node, move);
//       if (pmove == null) {
//         pmove = {algebraic: move, recommended: false};
//         node.moves.push(pmove);
//       }
//       let nextFen = fenAfterMove(fen, move);
//       if (nextFen == null) {
//         console.log('invalid move', move);
//         return null;
//       }
//       fen = nextFen;
//       node = this.getNodeOfFen(fen);
//       node.expanded = true;
//     }
//   }
// 
//   renderBoardAfterMoves(moves: string[]) {
//     (chessboard as any).default('board', {
//       draggable: true,
//       position: fenAfterMoves(moves),
//       onDrop: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: any) => {
//         let oldState = chessStateAfterMoves(moves);
//         let pmove: PartialMove = {from: source, to: target};
//         if (piece[1] == 'P') {
//           pmove.promotion = $('#promote-select').val() as PieceSymbol;
//         }
//         let move = oldState.move(pmove);
//         if (move == null) {
//           return 'snapback';
//         }
//         let newFocus = [...moves, move.san];
//         this.expandInto(newFocus);
//         let parentNode = this.rootComponent.getNodeComponent(moves);
//         if (parentNode != null) {
//           parentNode.render();
//         }
//         this.clickMoveAt(newFocus);
//       }
//     });
//   }
// 
//   rerender() {
//     $('#prep-display').empty();
//     this.startMove.render();
//     $('#prep-display').append(this.startMove.jquery);
//     this.rootComponent = new NodeComponent(this.nodes[startFen], [], startFen, this);
//     this.rootComponent.render();
//     $('#prep-display').append(this.rootComponent.jquery);
//     this.renderBoardAfterMoves(this.focus);
// 
//     let node = this.getNodeAfterMoves(this.focus);
//     if (node != null) {
//       $('#position-notes').val(node.notes);
//     }
//   }
// 
//   getMoveComponentAt(history: string[]) : MoveComponent | null {
//     return history.length == 0 ? this.startMove : this.rootComponent.getMoveComponent(history);
//   }
// 
//   clickMove(mc: MoveComponent) {
//     let mc2 = this.getMoveComponentAt(this.focus);
//     this.focus = mc.history;
//     mc.render();
//     if (mc2 != null) {
//       mc2.render();
//     }
//     this.renderBoardAfterMoves(this.focus);
//     let node = this.getNodeAfterMoves(this.focus);
//     if (node != null) {
//       $('#position-notes').val(node.notes);
//     }
//   }
// 
//   clickMoveAt(history: string[]) {
//     let mc = this.getMoveComponentAt(history);
//     if (mc != null) {
//       this.clickMove(mc);
//     }
//   }
// 
//   rerenderNodeAt(history: string[]) {
//     let nc = this.rootComponent.getNodeComponent(history);
//     if (nc != null) {
//       nc.render();
//     }
//   }
// 
//   rerenderMoveAt(history: string[]) {
//     let mc = history.length == 0 ? this.startMove : this.rootComponent.getMoveComponent(history);
//     if (mc != null) {
//       mc.render();
//     }
//   }
// 
//   deleteMove() {
//     if (this.focus.length == 0) {
//       return;
//     }
//     let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
//     if (secondLast == null) {
//       console.log('failed to delete move', this.focus);
//       return;
//     }
//     let lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
//     if (lastMoveIx == -1) {
//       console.log("failed to delete move", this.focus);
//       return;
//     }
//     let last = this.getNodeAfterMoves(this.focus);
//     if (last != null && (last.moves.length > 0 || last.notes != '')) {
//       if (!confirm('This move has children or notes. Are you sure you want to delete it?')) {
//         return;
//       }
//     }
//     secondLast.moves.splice(lastMoveIx, 1);
//     this.clickMoveAt(this.focus.slice(0, -1));
//     this.rerenderNodeAt(this.focus);
//   }
// 
//   toggleRecommended() {
//     if (this.focus.length == 0) {
//       return;
//     }
//     let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
//     if (secondLast == null) {
//       console.log('failed to change recommended move', this.focus);
//       return;
//     }
//     let lastMove = nodeGetMove(secondLast, this.focus[this.focus.length - 1]);
//     if (lastMove == null) {
//       console.log("failed to change recommended move", this.focus);
//       return;
//     }
//     lastMove.recommended = !lastMove.recommended;
//     this.rerenderMoveAt(this.focus);
//   }
// 
//   swapMove(offset: number) {
//     if (this.focus.length == 0) {
//       return;
//     }
//     let secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
//     if (secondLast == null) {
//       console.log('failed to swap move', this.focus);
//       return;
//     }
//     let lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
//     if (lastMoveIx == -1) {
//       console.log("failed to swap move", this.focus);
//       return;
//     }
//     let swapIx = lastMoveIx + offset;
//     if (swapIx < 0 || swapIx >= secondLast.moves.length) {
//       return;
//     }
//     let temp = secondLast.moves[lastMoveIx];
//     secondLast.moves[lastMoveIx] = secondLast.moves[swapIx];
//     secondLast.moves[swapIx] = temp;
//     this.rerenderNodeAt(this.focus.slice(0, -1));
//   }
// 
//   exportFile() {
//     let content = JSON.stringify(this.nodes);
// 
//     // Create element with <a> tag
//     const link = document.createElement("a");
//     
//     // Create a blog object with the file content which you want to add to the file
//     const file = new Blob([content], { type: 'text/plain' });
//     
//     // Add file content in the object URL
//     link.href = URL.createObjectURL(file);
//     
//     // Add file name
//     link.download = "prep.json";
//     
//     // Add click event to <a> tag to save file.
//     link.click();
//     URL.revokeObjectURL(link.href);
//   }
// 
//   importFile(text: string) {
//     console.log('importing');
//     this.nodes = JSON.parse(text) as Record<string, PrepNode>;
//     console.log('parsed');
//     this.focus = [];
//     this.rerender();
//     console.log('rendered');
//   }
// 
//   focusArrow(direction: string) {
//     var secondLast = null;
//     var lastMoveIx = -1;
//     if (this.focus.length != 0) {
//       secondLast = this.getNodeAfterMoves(this.focus.slice(0, -1));
//       if (secondLast != null) {
//         lastMoveIx = nodeGetMoveIx(secondLast, this.focus[this.focus.length - 1]);
//       }
//     }
//     let last = this.getNodeAfterMoves(this.focus);
//     if (direction == 'left') {
//       this.clickMoveAt(this.focus.slice(0, -1));
//     } else if (direction == 'right') {
//       if (last != null && last.moves.length > 0) {
//         this.clickMoveAt([...this.focus, last.moves[0].algebraic]);
//       }
//     } else if (direction == 'up') {
//       let moveIx = lastMoveIx - 1;
//       if (moveIx >= 0 && secondLast != null) {
//         this.clickMoveAt([...this.focus.slice(0, -1), secondLast.moves[moveIx].algebraic]);
//       }
//     } else if (direction == 'down') {
//       if (lastMoveIx != -1 && secondLast != null) {
//         let moveIx = lastMoveIx + 1;
//         if (moveIx < secondLast.moves.length) {
//           this.clickMoveAt([...this.focus.slice(0, -1), secondLast.moves[moveIx].algebraic]);
//         }
//       }
//     }
//   }
// }

function main() {
  $(function() {
    let testComponent = new Main({target: document.body});
  });
  // $(function() {
  //   let view = new PrepView();
  //   view.rerender();
  //   $('#delete-button').click(function() {
  //     view.deleteMove();
  //   });
  //   $('#up-button').click(function() {
  //     view.swapMove(-1);
  //   });
  //   $('#down-button').click(function() {
  //     view.swapMove(1);
  //   });
  //   $('#recommended-button').click(function() {
  //     view.toggleRecommended();
  //   });
  //   $('#export-button').click(function() {
  //     view.exportFile();
  //   });
  //   $('#import-file').change(function() {
  //     ((this as any).files[0] as File).text().then((text) => view.importFile(text));
  //   });
  //   $('#save-notes-button').click(function() {
  //     let node = view.getNodeAfterMoves(view.focus);
  //     if (node != null) {
  //       node.notes = $('#position-notes').val() as string;
  //       view.rerenderMoveAt(view.focus);
  //     }
  //   });
  //   $(document).keydown(function(event) {
  //     if (event.ctrlKey) {
  //       if (event.key == 'ArrowLeft') {
  //         view.focusArrow('left');
  //       } else if (event.key == 'ArrowRight') {
  //         view.focusArrow('right');
  //       } else if (event.key == 'ArrowUp') {
  //         view.focusArrow('up');
  //       } else if (event.key == 'ArrowDown') {
  //         view.focusArrow('down');
  //       }
  //     }
  //   });
  //   $(window).on('beforeunload', function() {
  //     return 'Are you sure you want to leave?';
  //   });
  // });
}

(window as any).startup = main;

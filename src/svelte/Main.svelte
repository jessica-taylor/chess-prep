

<script lang="ts">
  import {PrepMove, PrepNode, startPrepMove, TreeEventHandlers, fenAfterMoves, startFen} from '../types';
  import Move from './Move.svelte';
  import Node from './Node.svelte';


  import * as chessboard from 'chessboardjs';
  let nodes: Record<string, PrepNode> = {};
  let startMove: Move;
  let rootNode: Node;
  let focus: string[] = [];

  nodes[startFen] = {expanded: true, notes: '', moves: []};

  export function getFocus(): string[] {
    return this.focus;
  }

  export function getNodeOfFen(fen: string): PrepNode {
    let node = this.nodes[fen];
    if (!node) {
      return this.nodes[fen] = {expanded: true, notes: '', moves: []};
    }
    return node;
  }

  export let handlers: TreeEventHandlers = {
    getFocus, getNodeOfFen, clickMoveAt
  };

  export function getNodeAfterMoves(moves: string[]): Node | null {
    let fen = startFen;
    let node = getNodeOfFen(fen);
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

  export function expandInto(moves: string[]) {
    let fen = startFen;
    let node = getNodeOfFen(fen);
    for (let move of moves) {
      let pmove = nodeGetMove(node, move);
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
      node = getNodeOfFen(fen);
      node.expanded = true;
    }
  }

  export function getMoveComponentAt(history: string[]): MoveComponent | null {
    return history.length == 0 ? startMove : rootNode.getMoveComponent(history);
  }

  export function clickMove(mc: MoveComponent) {
    let mc2 = getMoveComponentAt(focus);
    focus = mc.history;
    mc.handlers = handlers;
    if (mc2 != null) {
      mc2.handlers = handlers;
    }
    // this.renderBoardAfterMoves(focus);
    let node = getNodeAfterMoves(focus);
    // if (node != null) {
    //   $('#position-notes').val(node.notes);
    // }
  }

  export function clickMoveAt(history: string[]) {
    let mc = getMoveComponentAt(history);
    if (mc != null) {
      clickMove(mc);
    }
  }

  $: (chessboard as any).default('board2', {
    draggable: true,
    position: fenAfterMoves(focus),
    onDrop: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: any) => {
      let oldState = chessStateAfterMoves(focus);
      let pmove: PartialMove = {from: source, to: target};
      if (piece[1] == 'P') {
        // TODO
        // pmove.promotion = $('#promote-select').val() as PieceSymbol;
      }
      let move = oldState.move(pmove);
      if (move == null) {
        return 'snapback';
      }
      let newFocus = [...focus, move.san];
      expandInto(newFocus);
      let parentNode = this.rootComponent.getNodeComponent(moves);
      if (parentNode != null) {
        parentNode.render();
      }
      clickMoveAt(newFocus);
    }
  });



</script>

<main>
  <Move bind:this={startMove} handlers={handlers} move={startPrepMove} history={[]}/>
  <Node bind:this={rootNode} handlers={handlers} node={this.nodes[startFen]} fen={startFen} history={[]}/>
  
</main>


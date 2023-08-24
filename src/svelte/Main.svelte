

<script lang="ts">
  import { onMount } from 'svelte';
  import {PrepMove, PrepNode, startPrepMove, TreeEventHandlers, fenAfterMove, fenAfterMoves, startFen, chessStateAfterMoves, nodeGetMove} from '../types';
  import Move from './Move.svelte';
  import Node from './Node.svelte';


  import * as chessboard from 'chessboardjs';
  let nodes: Record<string, PrepNode> = {};
  let startMove: Move;
  let rootNode: Node;
  let focus: string[] = [];

  nodes[startFen] = {expanded: true, notes: '', moves: []};

  export function getFocus(): string[] {
    return focus;
  }

  export function getNodeOfFen(fen: string): PrepNode {
    let node = nodes[fen];
    if (!node) {
      return nodes[fen] = {expanded: true, notes: '', moves: []};
    }
    return node;
  }

  export function rerender() {
    handlers = {...handlers};
  }

  export function clickMoveAt(history: string[]) {
    console.log('clickMoveAt', history);
    focus = history;
    rerender();
    // let mc = getMoveComponentAt(history);
    // if (mc != null) {
    //   clickMove(mc);
    // }
  }

  var handlers: TreeEventHandlers = {
    getFocus, getNodeOfFen, clickMoveAt
  };

  export function getFenAfterMoves(moves: string[]): string | null {
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
      node = getNodeOfFen(fen);
    }
    return fen;
  }

  export function getNodeAfterMoves(moves: string[]): PrepNode | null {
    let fen = getFenAfterMoves(moves);
    if (fen == null) {
      return null;
    }
    return getNodeOfFen(fen);
  }

  export function setNodeAfterMoves(moves: string[], node: PrepNode) {
    let fen = getFenAfterMoves(moves);
    if (fen == null) {
      return;
    }
    nodes[fen] = node;
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


  export function toggleRecommended() {
    if (focus.length == 0) {
      return;
    }
    let secondLast = getNodeAfterMoves(focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to change recommended move', focus);
      return;
    }
    let lastMove = nodeGetMove(secondLast, focus[focus.length - 1]);
    if (lastMove == null) {
      console.log("failed to change recommended move", focus);
      return;
    }
    console.log('old lastMove', lastMove);
    // TODO set nodes...
    lastMove.recommended = !lastMove.recommended;
    console.log('new lastMove', lastMove);
    setNodeAfterMoves(focus.slice(0, -1), secondLast);
    rerender();
  }

  // export function clickMove(mc: MoveComponent) {
  //   let mc2 = getMoveComponentAt(focus);
  //   focus = mc.history;
  //   mc.refreshHandlers();
  //   if (mc2 != null) {
  //     mc2.refreshHandlers();
  //   }
  //   // renderBoardAfterMoves(focus);
  //   let node = getNodeAfterMoves(focus);
  //   // if (node != null) {
  //   //   $('#position-notes').val(node.notes);
  //   // }
  //   console.log('focus is', focus);
  // }

  function initializeChessboard(focus: string[]) {
    (chessboard as any).default('board', {
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
        // let parentNode = rootNode.getNodeComponent(focus);
        // if (parentNode != null) {
        //   parentNode.refreshHandlers();
        // }
        clickMoveAt(newFocus);
      }
    });
  }

  let isMounted = false;
  onMount(() => {
    isMounted = true;
    initializeChessboard(focus)
  });

  $: if(isMounted) initializeChessboard(focus);



</script>

<main>
  
  <div id="left">
    <div id="board" style="width: 30em"></div>
    <hr/>
    <span>Promote to:</span><select id="promote-select">
      <option value="q">Queen</option>
      <option value="r">Rook</option>
      <option value="b">Bishop</option>
      <option value="k">Knight</option>
    </select>
    <br/>
    <input type="submit" id="recommended-button" value="Toggle recommended" on:click={toggleRecommended}/>
    <br/>
    <input type="submit" id="delete-button" value="Delete move"/>
    <br/>
    <span id="up-button">&#11014;&#65039;</span>
    <span id="down-button">&#11015;&#65039;</span>
    <br/>
    <input type="submit" id="export-button" value="Export as file"/>
    <br/>
    <label for="import-file">Import file</label>
    <input type="file" name="import-file" id="import-file" accept=".json,.txt"/>
    <br/>
    <label for="position-notes">Comment on this position</label>
    <input type="submit" id="save-notes-button" value="Save"/>
    <br/>
    <textarea id="position-notes" name="position-notes" rows="10" cols="60"></textarea>
    <br/>
    <a href="https://github.com/jessica-taylor/chess-prep">View this project on GitHub</a>
    <br/>
    <div class="tooltip">&#x2753;
      <span class="tooltiptext">A tool for chess prep. Make moves to change the position and add branches to the tree. Click parts of the tree on the left to focus, showing the board of that position. Click arrows to expand/collapse. Underlined moves are considered recommended; non-recommended moves can be added to show good responses to them. Positions (not moves!) can be commented on; this tool detects transpositions. Use ctrl-arrow keys to move around. Export/import as JSON.</span>
    </div>
  </div>
  <div id="right">
    <div id="prep-display">
      <Move bind:this={startMove} handlers={handlers} move={startPrepMove} history={[]}/>
      <Node bind:this={rootNode} handlers={handlers} node={nodes[startFen]} fen={startFen} history={[]}/>
    </div>
  </div>
</main>

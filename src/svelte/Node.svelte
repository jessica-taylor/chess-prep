
<script lang="ts">
  import {PrepMove, PrepNode, startFen, fenAfterMove} from '../types';
  import Move from './Move.svelte';
  import Node from './Node.svelte';
  export let handlers: TreeEventHandlers;
  export let node: PrepNode = {
    expanded: true,
    notes: '',
    moves: []
  };
  export let fen: string = startFen;
  let childMoves: Move[] = [];
  let childNodes: Node[] = [];
  function clickedExp() {
    node = {
      expanded: !node.expanded,
      notes: node.notes,
      moves: node.moves
    };
  }
  function keyDownExp(event) {
    // Check for Enter (key code 13) or Space (key code 32)
    if (event.keyCode === 13 || event.keyCode === 32) {
      clickedExp();
      
      // Prevent the default action to stop scrolling when space is pressed
      event.preventDefault();
    }
  }

  export function getNodeComponent(postfix: string[]): Node | null {
    var node: NodeComponent = this;
    for (let nextMove of postfix) {
      if (node.childNodes.length == 0) {
        return null;
      }
      let ix = nodeGetMoveIx(node.node, nextMove);
      if (ix == -1) {
        return null;
      }
      node = node.childNodes[ix];
    }
    return node;
  }

  export function getMoveComponent(postfix: string[]): Move | null {
    if (postfix.length == 0) {
      return null;
    }
    var node = this.getNodeComponent(postfix.slice(0, -1));
    if (node == null || node.childMoves.length == 0) {
      return null;
    }
    let ix = nodeGetMoveIx(node.node, postfix[postfix.length - 1]);
    if (ix == -1) {
      return null;
    }
    return node.childMoves[ix];
  }
</script>
<main>
  <span class="prep-node">
    <span class="prep-exp" role="button" tabindex="0" on:click={clickedExp} on:keydown={keyDownExp}>
      {node.moves.length == 0 ? '\u25c6' : node.expanded ? '\u25BC' : '\u25B6'}
    </span>
    {#if node.expanded && node.moves.length > 0}
      <ul class="prep-ul">
        {#each node.moves as move, ix}
          <li class="prep-li">
            <Move bind:this={childMoves[ix]} handlers={handlers} move={move} history={[...history, move.algebraic]}/>
            <Node bind:this={childNodes[ix]} handlers={handlers} node={handlers.getNodeOfFen(fenAfterMove(fen, move.algebraic) || startFen)} history={[...history, move.algebraic]} fen={fenAfterMove(fen, move.algebraic) || startFen}/>
          </li>
        {/each}
      </ul>
    {/if}
  </span>
</main>

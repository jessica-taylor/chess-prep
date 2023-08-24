<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->

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
  export let history: string[] = [];
  export let fen: string = startFen;

  let childMoves: Move[] = [];
  let childNodes: Node[] = [];

  let self = this;

  function clickedExp() {
    node = {
      expanded: !node.expanded,
      notes: node.notes,
      moves: node.moves
    };
  }

  export function getNodeComponent(postfix: string[]): Node | null {
    var node: NodeComponent = self;
    console.log('this node component is', node, 'postfix', postfix);
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
    console.log('getMoveComponent', postfix);
    if (postfix.length == 0) {
      return null;
    }
    var node = getNodeComponent(postfix.slice(0, -1));
    console.log('node is', node);
    if (node == null || node.childMoves.length == 0) {
      return null;
    }
    let ix = nodeGetMoveIx(node.node, postfix[postfix.length - 1]);
    console.log('ix is', ix);
    if (ix == -1) {
      return null;
    }
    return node.childMoves[ix];
  }
</script>

<span class="prep-node">
  <span class="prep-exp" on:click={clickedExp}>
    {node.moves.length == 0 ? '\u25c6' : node.expanded ? '\u25BC' : '\u25B6'}
  </span>
  {#if node.expanded && node.moves.length > 0}
    {#if node.moves.length == 1}
      <Move bind:this={childMoves[0]} handlers={handlers} move={node.moves[0]} history={[...history, node.moves[0].algebraic]}/>
      <Node bind:this={childNodes[0]} handlers={handlers} node={handlers.getNodeOfFen(fenAfterMove(fen, node.moves[0].algebraic) || startFen)} history={[...history, node.moves[0].algebraic]} fen={fenAfterMove(fen, node.moves[0].algebraic) || startFen}/>
    {:else}
      <ul class="prep-ul">
        {#each node.moves as move, ix}
          <li class="prep-li">
            <Move bind:this={childMoves[ix]} handlers={handlers} move={move} history={[...history, move.algebraic]}/>
            <Node bind:this={childNodes[ix]} handlers={handlers} node={handlers.getNodeOfFen(fenAfterMove(fen, move.algebraic) || startFen)} history={[...history, move.algebraic]} fen={fenAfterMove(fen, move.algebraic) || startFen}/>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</span>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->

<script lang="ts">
  import {PrepMove, PrepNode, startFen, fenAfterMove} from '../types';
  import Move from './Move.svelte';
  import Node from './Node.svelte';
  export let handlers: TreeEventHandlers;
  export let hash: string;
  export let history: string[] = [];
  export let focus: string[] = [];

  let merkleNode;
  let node;
  let expanded;
  $: {
    merkleNode = handlers.getMerkleOfHash(hash) || {node: {expanded: true, moves: [], notes: 'help me!'}, childHashes: []};
  }
  $: node = merkleNode.node;

  let childMoves: Move[] = [];
  let childNodes: Node[] = [];

  let self = this;

  function getChildFocus(foc, ix) {
    if (foc.length >= history.length + 1 && foc[history.length] == node.moves[ix].algebraic) {
      return foc;
    }
    return [];
  }
  // let childFocuses = [];
  // $: {
  //   childFocuses = node.moves.map((move) => {
  //     if (focus.length >= history.length + 1 && focus[history.length] == move.algebraic) {
  //       return focus;
  //     }
  //     return [];
  //   });
  //   console.log('history', history, 'focus', focus, 'childFocuses', childFocuses);
  // }

  function clickedExp() {
    handlers.toggleExpandedAt(history);
  }

  export function getNodeComponent(postfix: string[]): Node | null {
    var node: NodeComponent = self;
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
    var node = getNodeComponent(postfix.slice(0, -1));
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

<span class="prep-node">
  <span class="prep-exp" on:click={clickedExp}>
    {node.moves.length == 0 ? '\u25c6' : node.expanded ? '\u25BC' : '\u25B6'}
  </span>
  {#if node.expanded && node.moves.length > 0}
    {#if node.moves.length == 1}
      <Move bind:this={childMoves[0]} handlers={handlers} focus={getChildFocus(focus, 0)} move={node.moves[0]} history={[...history, node.moves[0].algebraic]}/>
      <Node bind:this={childNodes[0]} handlers={handlers} focus={getChildFocus(focus, 0)} history={[...history, node.moves[0].algebraic]} hash={merkleNode.childHashes[0]}/>
    {:else}
      <ul class="prep-ul">
        {#each node.moves as move, ix}
          <li class="prep-li">
            <Move bind:this={childMoves[ix]} handlers={handlers} focus={getChildFocus(focus, ix)} move={move} history={[...history, move.algebraic]}/>
            <Node bind:this={childNodes[ix]} handlers={handlers} focus={getChildFocus(focus, ix)} history={[...history, move.algebraic]} hash={merkleNode.childHashes[ix]}/>
          </li>
        {/each}
      </ul>
    {/if}
  {/if}
</span>

import {PrepMove, PrepNode, startFen, fenAfterMove} from '/types';
import {Move} from './Move.svelte';

<script>
  export let handlers: TreeEventHandlers;
  export let node: PrepNode = {
    expanded: true,
    notes: '',
    moves: []
  };
  export let fen: string = startFen;
  export let childMoves: Move[] = [];
  export let childNodes: Node[] = [];
  function clickedExp() {
    node = {
      expanded: !node.expanded,
      notes: node.notes,
      moves: node.moves
    };
  }
</script>
<main>
  <span class="prep-node">
    <span class="prep-exp" on:click={clickedExp}>
      {node.moves.length == 0 ? '\u25c6' : node.expanded ? '\u25BC' : '\u25B6'}
    </span>
    {#if node.expanded && node.moves.length > 0}
      <ul class="prep-ul">
        {#each node.moves as move, ix}
          <li class="prep-li">
            {# let newHistory = [...history, move.algebraic] }
            {# let fen2 = fenAfterMove(fen, move.algebraic) || startFen }
            <Move bind:this={childMoves[ix]} handlers={handlers} move={move} history={newHistory}/>
            <Node bind:this={childNodes[ix]} handlers={handlers} node={handlers.getNodeOfFen(fen2)} history={newHistory} fen={fen2}/>
          </li>
        {/each}
      </ul>
    {/if}
  </span>
</main>

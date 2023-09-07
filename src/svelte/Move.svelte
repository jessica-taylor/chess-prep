<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->

<script lang="ts">
  import {startPrepMove, TreeEventHandlers, fenAfterMoves, startFen} from '../types';
  export let handlers: TreeEventHandlers;
  export let move: PrepMove = startPrepMove;
  export let history: string[] = [];
  export let focus: string[] = [];
  export let hash: string;

  let isFocused: boolean = false;
  let fenAfter: string = startFen;
  let nodeAfter: any = {
    expanded: true,
    notes: '',
    moves: []
  };

  $: isFocused = JSON.stringify(focus) == JSON.stringify(history);
  $: nodeAfter = (handlers.getMerkleOfHash(hash) || {node: nodeAfter}).node;

  function handleClick() {
    handlers.clickMoveAt(history);
  }

</script>

<span class="move-container">
  <span class:prep-move={true}
        class:prep-focus={isFocused}
        class:prep-recommended={move.recommended}
        class:prep-white={history.length % 2 == 1}
        class:prep-black={history.length % 2 == 0}
        class:prep-annotated={!!nodeAfter.notes}
        on:click={handleClick}>
    {move.algebraic}
  </span>
</span>

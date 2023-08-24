
<script lang="ts">
  import {startPrepMove, TreeEventHandlers, fenAfterMoves, startFen} from '../types';
  export let handlers: TreeEventHandlers;
  export let move: PrepMove = startPrepMove;
  export let history: string[] = [];

  let isFocused: boolean = false;
  let fenAfter: string = startFen;
  let nodeAfter: any = {
    expanded: true,
    notes: '',
    moves: []
  };

  $: isFocused = JSON.stringify(handlers.getFocus()) == JSON.stringify(history);
  $: fenAfter = fenAfterMoves(history);
  $: nodeAfter = handlers.getNodeOfFen(fenAfter);

</script>
<main>
  <span class="move-container">
    <span class:prep-move={true}
          class:prep-focus={isFocused}
          class:prep-recommended={move.recommended}
          class:prep-white={history.length % 2 == 1}
          class:prep-black={history.length % 2 == 0}
          class:prep-annotated={!!nodeAfter.notes}>
      {move.algebraic}
    </span>
  </span>
</main>

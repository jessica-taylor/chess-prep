import {PrepMove, PrepNode, startPrepMove, TreeEventHandlers, fenAfterMoves} from '/types';

<script>
  export let handlers: TreeEventHandlers;
  export let move: PrepMove = startPrepMove;
  export let history: string[] = [];

  $: isFocused: boolean = JSON.stringify(handlers.getFocus()) == JSON.stringify(history);
  $: fenAfter: string = fenAfterMoves(history);
  $: nodeAfter: PrepNode = handlers.getNodeOfFen(fenAfter);
</script>
<main>
  <span class="move-container">
    <span class:prep-move={true}
          class:prep-focus={isFocused}
          class:prep-recommended={move.recommended}
          class:prep-white={history.length % 2 == 1}
          class:prep-black={history.length % 2 == 0}
          chess:prep-annotated={!!nodeAfter.notes}>
      {move.algebraic}
    </span>
  </span>
</main>

import {PrepMove, PrepNode, startPrepMove} from '/types';
import { Node } from './Node.svelte';

<script>
  export let move: PrepMove = startPrepMove;
</script>
<main>
  <span class="move-container">
    <span class="prep-move">
      {move.algebraic}
    </span>
  </span>
</main>

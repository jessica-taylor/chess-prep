import {PrepMove, PrepNode, startPrepMove} from '/types';
import { Node } from './Node.svelte';

<script>
  export let move: PrepMove = startPrepMove;
</script>
<main>
  <span>{move.algebraic}</span>
</main>

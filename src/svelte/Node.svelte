import {PrepMove, PrepNode} from '/types';
import {Move} from './Move.svelte';

<script>
  export let node: PrepNode = {
    expanded: true,
    notes: '',
    moves: []
  };
</script>
<main>
  <span>{node.notes}</span>
</main>

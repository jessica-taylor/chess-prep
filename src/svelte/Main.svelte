<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-static-element-interactions -->

<script lang="ts">
  import { onMount, beforeDestroy } from 'svelte';
  import * as cjsonStringify from 'canonical-json';
  import * as chessboard from 'chessboardjs';

  import {PrepMove, PrepNode, PrepHashedMerkle, startPrepMove, TreeEventHandlers, fenAfterMove, fenAfterMoves, startFen, chessStateAfterMoves, nodeGetMove, nodeGetMoveIx, hashValue} from '../types';
  import {MutableCell, FunctionalCell, getCellValue} from '../datacell';
  import Move from './Move.svelte';
  import Node from './Node.svelte';

  let nodeCells: Record<string, MutableCell<PrepNode>> = {};
  let nodeMerklesByHash: Record<string, PrepHistoryMerkle> = {};
  let nodeMerkleHashes: Record<string, FunctionalCell<string>> = {};


  let nodes: Record<string, PrepNode> = {};
  let startMove: Move;
  let rootNode: Node;
  let focus: string[] = [];
  let promotionChoice = 'q';
  let positionNotesChanged: boolean = false;
  let positionNotes: string = '';
  $: if(!positionNotesChanged) positionNotes = (getNodeAfterMoves(focus) || {notes: ''}).notes;

  // nodes[startFen] = {expanded: true, notes: '', moves: []};

  export function nodeCellOfFen(fen: string): MutableCell<PrepNode> {
    if (!nodeCells[fen]) {
      nodeCells[fen] = new MutableCell({expanded: true, notes: '', moves: []});
    }
    return nodeCells[fen];
  }

  export function nodeCellAfterMoves(history: string[]): MutableCell<PrepNode> | null {
    let fen = fenAfterMoves(history);
    if (fen == null) {
      return null;
    }
    return nodeCellOfFen(fen);
  }


  export function getNodeOfFen(fen: string): PrepNode {
    return nodeCellOfFen(fen).getValue();
  }

  export function setNodeAfterMoves(moves: string[], node: PrepNode) {
    let fen = fenAfterMoves(moves);
    if (fen == null) {
      return;
    }
    nodeCellOfFen(fen).setValue(node);
    updateRootHash();
  }

  export function getNodeAfterMoves(history: string[]): PrepNode | null {
    let cell = nodeCellAfterMoves(history);
    if (cell == null) {
      return null;
    }
    return cell.getValue();
  }

  function getMerkleHashCell(history: string[]): FunctionalCell<string> {
    let historyStr = JSON.stringify(history);
    if (!(historyStr in nodeMerkleHashes)) {
      nodeMerkleHashes[historyStr] = new FunctionalCell((tracker) => {
        let cell = nodeCellAfterMoves(history);
        let merkle;
        if (cell == null) {
          merkle = {node: {expanded: true, notes: '', moves: []}, childHashes: []};
        } else {
          let node = getCellValue(tracker, cell);
          let childHashes: string[] = [];
          if (node.expanded) {
            for (let move of node.moves) {
              let newHistory = [...history, move.algebraic];
              let childHash = getCellValue(tracker, getMerkleHashCell(newHistory));
              childHashes.push(childHash);
            }
          }
          merkle = {node: getCellValue(tracker, cell), childHashes};
        }
        let hash = hashValue(cjsonStringify(merkle));
        nodeMerklesByHash[hash] = merkle;
        return hash;
      });
    }
    return nodeMerkleHashes[historyStr];
  }

  let rootHash;

  function updateRootHash() {
    rootHash = getMerkleHashCell([]).getValue();
  }

  updateRootHash();




  function getMerkleOfHash(hash: string): PrepHistoryMerkle | null {
    return nodeMerklesByHash[hash] || null;
  }

  export function rerender() {
    handlers = {...handlers};
  }

  export function clickMoveAt(history: string[]) {
    focus = history;
    positionNotesChanged = false;
  }

  export function toggleExpandedAt(history: string[]) {
    var node = getNodeAfterMoves(history);
    if (node == null) {
      return;
    }
    node = {...node};
    node.expanded = !node.expanded;
    setNodeAfterMoves(history, node);
  }

  var handlers: TreeEventHandlers = {
    getNodeAfterMoves, clickMoveAt, getMerkleOfHash, toggleExpandedAt
  };

  // export function getFenAfterMoves(moves: string[]): string | null {
  //   let fen = startFen;
  //   let node = getNodeOfFen(fen);
  //   for (let move of moves) {
  //     let pmove = nodeGetMove(node, move);
  //     if (pmove == null) {
  //       return null;
  //     }
  //     let nextFen = fenAfterMove(fen, move);
  //     if (nextFen == null) {
  //       return null;
  //     }
  //     fen = nextFen;
  //     node = getNodeOfFen(fen);
  //   }
  //   return fen;
  // }

  export function expandInto(moves: string[]) {
    let fen = startFen;
    let node = {...getNodeOfFen(fen)};
    let ix = 0;
    for (let move of moves) {
      let pmove = nodeGetMove(node, move);
      if (pmove == null) {
        pmove = {algebraic: move, recommended: false};
        node = {...node};
        node.moves.push(pmove);
        setNodeAfterMoves(moves.slice(0, ix), node);
      }
      let nextFen = fenAfterMove(fen, move);
      if (nextFen == null) {
        console.log('invalid move', move);
        return null;
      }
      fen = nextFen;
      node = {...getNodeOfFen(fen)};
      node.expanded = true;
      setNodeAfterMoves(moves.slice(0, ix + 1), node);
      ++ix;
    }
  }

  export function getMoveComponentAt(history: string[]): MoveComponent | null {
    return history.length == 0 ? startMove : rootNode.getMoveComponent(history);
  }


  export function toggleRecommended() {
    if (focus.length == 0) {
      return;
    }
    let secondLast = getNodeAfterMoves(focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to change recommended move', focus);
      return;
    }
    let lastMove = nodeGetMove(secondLast, focus[focus.length - 1]);
    if (lastMove == null) {
      console.log("failed to change recommended move", focus);
      return;
    }
    lastMove.recommended = !lastMove.recommended;
    setNodeAfterMoves(focus.slice(0, -1), secondLast);
  }


  export function deleteMove() {
    if (focus.length == 0) {
      return;
    }
    let secondLast = getNodeAfterMoves(focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to delete move', focus);
      return;
    }
    let lastMoveIx = nodeGetMoveIx(secondLast, focus[focus.length - 1]);
    if (lastMoveIx == -1) {
      console.log("failed to delete move", focus);
      return;
    }
    let last = getNodeAfterMoves(focus);
    if (last != null && (last.moves.length > 0 || last.notes != '')) {
      if (!confirm('This move has children or notes. Are you sure you want to delete it?')) {
        return;
      }
    }
    secondLast.moves.splice(lastMoveIx, 1);
    setNodeAfterMoves(focus.slice(0, -1), secondLast);
    clickMoveAt(focus.slice(0, -1));
  }


  export function swapMove(offset: number) {
    if (focus.length == 0) {
      return;
    }
    let secondLast = getNodeAfterMoves(focus.slice(0, -1));
    if (secondLast == null) {
      console.log('failed to swap move', focus);
      return;
    }
    let lastMoveIx = nodeGetMoveIx(secondLast, focus[focus.length - 1]);
    if (lastMoveIx == -1) {
      console.log("failed to swap move", focus);
      return;
    }
    let swapIx = lastMoveIx + offset;
    if (swapIx < 0 || swapIx >= secondLast.moves.length) {
      return;
    }
    let temp = secondLast.moves[lastMoveIx];
    secondLast.moves[lastMoveIx] = secondLast.moves[swapIx];
    secondLast.moves[swapIx] = temp;
    setNodeAfterMoves(focus.slice(0, -1), secondLast);
  }

  function handleNotesChange() {
    positionNotesChanged = true;
  }

  export function saveNotes() {
    let node = {...getNodeAfterMoves(focus)};
    if (node != null) {
      node.notes = positionNotes;
      setNodeAfterMoves(focus, node);
    }
  }


  export function exportFile() {
    let content = JSON.stringify(nodes);

    // Create element with <a> tag
    const link = document.createElement("a");
    
    // Create a blog object with the file content which you want to add to the file
    const file = new Blob([content], { type: 'text/plain' });
    
    // Add file content in the object URL
    link.href = URL.createObjectURL(file);
    
    // Add file name
    link.download = "prep.json";
    
    // Add click event to <a> tag to save file.
    link.click();
    URL.revokeObjectURL(link.href);
  }


  export function importFile(event) {
    (event.target.files[0] as File).text().then((text) => {
      nodes = JSON.parse(text) as Record<string, PrepNode>;
      focus = [];
      rerender();
    });
  }

  onMount(() => {
    const handleKeydown = (event) => {
      if (event.ctrlKey) {
        switch (event.key) {
          case 'ArrowLeft':
            focusArrow('left');
            break;
          case 'ArrowRight':
            focusArrow('right');
            break;
          case 'ArrowUp':
            focusArrow('up');
            break;
          case 'ArrowDown':
            focusArrow('down');
            break;
        }
      }
    };

    document.addEventListener('keydown', handleKeydown);

    return () => { // This function will run when the component is destroyed.
      document.removeEventListener('keydown', handleKeydown);
    };
  });

  export function focusArrow(direction: string) {
    var secondLast = null;
    var lastMoveIx = -1;
    if (focus.length != 0) {
      secondLast = getNodeAfterMoves(focus.slice(0, -1));
      if (secondLast != null) {
        lastMoveIx = nodeGetMoveIx(secondLast, focus[focus.length - 1]);
      }
    }
    let last = getNodeAfterMoves(focus);
    if (direction == 'left') {
      clickMoveAt(focus.slice(0, -1));
    } else if (direction == 'right') {
      if (last != null && last.moves.length > 0) {
        clickMoveAt([...focus, last.moves[0].algebraic]);
      }
    } else if (direction == 'up') {
      let moveIx = lastMoveIx - 1;
      if (moveIx >= 0 && secondLast != null) {
        clickMoveAt([...focus.slice(0, -1), secondLast.moves[moveIx].algebraic]);
      }
    } else if (direction == 'down') {
      if (lastMoveIx != -1 && secondLast != null) {
        let moveIx = lastMoveIx + 1;
        if (moveIx < secondLast.moves.length) {
          clickMoveAt([...focus.slice(0, -1), secondLast.moves[moveIx].algebraic]);
        }
      }
    }
  }

  function initializeChessboard(history: string[]) {
    (chessboard as any).default('board', {
      draggable: true,
      position: fenAfterMoves(history),
      onDrop: (source: string, target: string, piece: string, newPos: any, oldPos: any, orientation: any) => {
        let oldState = chessStateAfterMoves(history);
        let pmove: PartialMove = {from: source, to: target};
        if (piece[1] == 'P') {
          pmove.promotion = promotionChoice;
        }
        let move = oldState.move(pmove);
        if (move == null) {
          return 'snapback';
        }
        let newFocus = [...history, move.san];
        expandInto(newFocus);
        // let parentNode = rootNode.getNodeComponent(history);
        // if (parentNode != null) {
        //   parentNode.refreshHandlers();
        // }
        clickMoveAt(newFocus);
      }
    });
  }

  let isMounted = false;
  onMount(() => {
    isMounted = true;
    initializeChessboard(focus)
  });

  $: if(isMounted) initializeChessboard(focus);




</script>

<main>
  
  <div id="left">
    <div id="board" style="width: 30em"></div>
    <hr/>
    <span>Promote to:</span><select id="promote-select" bind:value={promotionChoice}>
      <option value="q">Queen</option>
      <option value="r">Rook</option>
      <option value="b">Bishop</option>
      <option value="k">Knight</option>
    </select>
    <br/>
    <input type="submit" id="recommended-button" value="Toggle recommended" on:click={toggleRecommended}/>
    <br/>
    <input type="submit" id="delete-button" value="Delete move" on:click={deleteMove}/>
    <br/>
    <span id="up-button" on:click={() => swapMove(-1)}>&#11014;&#65039;</span>
    <span id="down-button" on:click={() => swapMove(1)}>&#11015;&#65039;</span>
    <br/>
    <input type="submit" id="export-button" value="Export as file" on:click={exportFile}/>
    <br/>
    <label for="import-file">Import file</label>
    <input type="file" name="import-file" id="import-file" accept=".json,.txt" on:change={importFile}/>
    <br/>
    <label for="position-notes">Comment on this position</label>
    <input type="submit" id="save-notes-button" value="Save" on:click={saveNotes}/>
    <br/>
    <textarea id="position-notes" name="position-notes" rows="10" cols="60" bind:value={positionNotes} on:input={handleNotesChange}></textarea>
    <br/>
    <a href="https://github.com/jessica-taylor/chess-prep">View this project on GitHub</a>
    <br/>
    <div class="tooltip">&#x2753;
      <span class="tooltiptext">A tool for chess prep. Make moves to change the position and add branches to the tree. Click parts of the tree on the left to focus, showing the board of that position. Click arrows to expand/collapse. Underlined moves are considered recommended; non-recommended moves can be added to show good responses to them. Positions (not moves!) can be commented on; this tool detects transpositions. Use ctrl-arrow keys to move around. Export/import as JSON.</span>
    </div>
  </div>
  <div id="right">
    <div id="prep-display">
      <Move bind:this={startMove} handlers={handlers} focus={focus} move={startPrepMove} hash={rootHash} history={[]}/>
      <Node bind:this={rootNode} handlers={handlers} focus={focus} hash={rootHash} history={[]}/>
    </div>
  </div>
</main>

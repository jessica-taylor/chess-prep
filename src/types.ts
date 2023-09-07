import {Chess, PartialMove, PieceSymbol} from 'chess.ts';
import * as CryptoJS from 'crypto-js';

export type PrepMove = {
  algebraic: string;
  recommended: boolean;
  // next: PrepNode;
};

export type PrepNode = {
  expanded: boolean;
  notes: string;
  moves: PrepMove[];
};

export type PrepMerkle = {
  node: PrepNode,
  fen: string,
  childHashes: string[]
};

export type PrepHistoryMerkle = {
  node: PrepNode,
  childHashes: string[]
};

export let startPrepMove = {algebraic: 'start', recommended: false};
export let startFen: string = new Chess().fen();

export interface TreeEventHandlers {
  clickMoveAt(history: string[]): void;
  toggleExpandedAt(history: string[]): void;
  getNodeAfterMoves(history: string[]): PrepNode;
  getMerkleOfHash(hash: string): PrepMerkle | null;
}

export function getMoveIx(moves: PrepMove[], algebraic: string): number{
  for (var i = 0; i < moves.length; ++i) {
    if (moves[i].algebraic == algebraic) {
      return i;
    }
  }
  return -1;
}

export function nodeGetMoveIx(node: PrepNode, algebraic: string): number{
  return getMoveIx(node.moves, algebraic);
}

export function nodeGetMove(node: PrepNode, algebraic: string): PrepMove | null {
  let ix = nodeGetMoveIx(node, algebraic);
  if (ix == -1) {
    return null;
  }
  return node.moves[ix];
}

export function simplifyFen(fen: string): string {
  let chess = new Chess(fen);
  let moves = chess.moves({verbose: true});
  let parts = fen.split(' ');
  var hasEnPassent = false;
  for (let move of moves) {
    if (move.flags.includes('e')) {
      hasEnPassent = true;
      break;
    }
  }
  // remove en passent if not possible
  if (!hasEnPassent) {
    parts[3] = '-';
  }
  parts[4] = '0';
  parts[5] = '1';
  return parts.join(' ');
}

export function chessStateAfterMoves(moves: string[]): Chess {
  let chess = new Chess();
  for (let move of moves) {
    let legalMoves = chess.moves();
    if (!legalMoves.includes(move)) {
      console.log('illegal move: ' + move);
    }
    chess.move(move);
  }
  return chess;
}

export function fenAfterMoves(moves: string[]): string {
  return simplifyFen(chessStateAfterMoves(moves).fen());
}

export function fenAfterMove(fen: string, move: string): string | null {
  let chess = new Chess(fen);
  if (chess.move(move) == null) {
    return null;
  }
  return simplifyFen(chess.fen());
}

export function hashValue(value: string): string {
  return CryptoJS.SHA256(value).toString();
}


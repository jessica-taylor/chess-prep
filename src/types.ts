import {Chess, PartialMove, PieceSymbol} from 'chess.ts';

export type PrepMove = {
  algebraic: string;
  recommended: boolean;
  // next: PrepNode;
}

export type PrepNode = {
  expanded: boolean;
  notes: string;
  moves: PrepMove[];
}

export let startPrepMove = {algebraic: 'start', recommended: false};
export let startFen: string = new Chess().fen();

export interface TreeEventHandlers {
  clickMoveAt(history: string[]): void;
  // getNodeAfterMoves(history: string[]): PrepNode | null;
  getNodeOfFen(fen: string): PrepNode;
  getFocus(): string[];
}

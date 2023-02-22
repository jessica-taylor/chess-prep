import { Chess, PartialMove } from 'chess.ts';

type TaggedMove = {
  move: PartialMove;
  good: boolean;
};


type StateMoves = Record<string, TaggedMove>;

let initialFen: string = new Chess().fen();

type StateTreeEdge = {
  move: TaggedMove;
  destination: string;
};

type StateTree = {
  root: string;
  edges: Record<string, StateTreeEdge>;
};

type MoveTreeEdge = {
  move: TaggedMove;
  responses: MoveTreeEdge[];
};

type MoveTree = {
  moves: MoveTreeEdge[];
};


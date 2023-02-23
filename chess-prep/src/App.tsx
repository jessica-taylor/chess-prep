import React from 'react';
import logo from './logo.svg';
import './App.css';

type MoveProps = {algebraic: string, isWhite: boolean, focused: boolean, recommended: boolean};
type MoveState = {};

class Move extends React.Component<MoveProps, MoveState> {
  constructor(props: MoveProps) {
    super(props);
    this.state = {};
  }
  render() {
    let className = 'prep-move';
    if (this.props.focused) {
      className += ' prep-focus';
    }
    if (this.props.isWhite) {
      className += ' prep-white';
    } else {
      className += ' prep-black';
    }
    if (this.props.recommended) {
      className += ' prep-recommended';
    }
    return (
      <span className="Move">
        <span className={className}>{this.props.algebraic}</span>
      </span>
    )
  }
}

// type NodeProps = {
//   moves: MoveProps[]
// };
// 
// type NodeState = {
// };
// 
// class Node extends React.Component<NodeProps, NodeState> {
//   constructor(props: NodeProps) {
//     super(props);
//   }
//   render() {
//     let lis = [];
//     for (let move of this.props.moves) {
//       lis.push(<li><Move {...move} /></li>);
//     }
//     return (
//       <div className="Node">
//         <ul>{lis}</ul>
//       </div>
//     )
//   }
// }

export function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Move algebraic="e4" isWhite={true} focused={true} recommended={true}/>
        <a
          className="App-link"
          href="https://reactjs.org"
          target="_blank"
          rel="noopener noreferrer"
        >
          Learn React
        </a>
      </header>
    </div>
  );
}

// export default App;

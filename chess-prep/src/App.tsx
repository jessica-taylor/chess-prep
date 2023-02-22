import React from 'react';
import logo from './logo.svg';
import './App.css';

type MoveProps = {algebraic: string, isWhite: boolean};
type MoveState = {focused: boolean};

class Move extends React.Component<MoveProps, MoveState> {
  constructor(props: MoveProps) {
    super(props);
    this.state = {focused: true};
  }
  render() {
    let className = 'prep-move';
    if (this.state.focused) {
      className += ' prep-focus';
    }
    if (this.props.isWhite) {
      className += ' prep-white';
    } else {
      className += ' prep-black';
    }
    return (
      <span className="Move">
        <span className={className}>{this.props.algebraic}</span>
      </span>
    )
  }
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Move algebraic="e4" isWhite={true}/>
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

export default App;

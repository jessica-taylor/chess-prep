import React from 'react';
import logo from './logo.svg';
import './App.css';

function Move(props: {algebraic: string, focused: boolean, isWhite: boolean}) {
  let className = 'prep-move';
  if (props.focused) {
    className += ' prep-focus';
  }
  if (props.isWhite) {
    className += ' prep-white';
  } else {
    className += ' prep-black';
  }
  return (
    <span className="Move">
      <span className={className}>{props.algebraic}</span>
    </span>
  )
}

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <p>
          Edit <code>src/App.tsx</code> and save to reload.
        </p>
        <Move algebraic="e4" focused={true} isWhite={true}/>
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

import React from 'react';
import { RecoilRoot } from 'recoil';
import './App.css';
import Board from './board';

function App(): JSX.Element {
  console.log('render App');
  return (
    <div className="App">
      <RecoilRoot>
        <Board />
      </RecoilRoot>
    </div>
  );
}

export default App;

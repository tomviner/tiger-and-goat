import React from 'react';
import { RecoilRoot, atom, selector, useRecoilState, useRecoilValue } from 'recoil';

import './App.css';
import Board from './board';

function App(): JSX.Element {
  return (
    <div className="App">
      <RecoilRoot>
        <Board />
      </RecoilRoot>
    </div>
  );
}

export default App;

import React from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { RecoilRoot } from 'recoil';
import './App.css';
import Board from './board';
import Nav from './Nav';
import Rules from './Rules';
import Strategies from './Strategies';

function App(): JSX.Element {
  return (
    <div className="App">
      <RecoilRoot>
        <HashRouter>
          <Nav />
          <Routes>
            <Route path="/" element={<Board />} />
            <Route path="/rules" element={<Rules />} />
            <Route path="/strategies" element={<Strategies />} />
          </Routes>
        </HashRouter>
      </RecoilRoot>
    </div>
  );
}

export default App;

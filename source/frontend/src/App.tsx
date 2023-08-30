import React from 'react';
import './App.css';
import { BrowserRouter, Route, Routes } from 'react-router-dom';

const HomePage = React.lazy(() => import('./components/pages/HomePage'));

function App()
{
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={ <React.Suspense fallback={ <div>Loading...</div> }><HomePage /></React.Suspense> } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;

import React from 'react';
import './App.css';
import './server/microservices';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';

const HomePage = React.lazy(() => import('./components/pages/HomePage'));

function App()
{
  return (
    <SnackbarProvider maxSnack={ 3 }>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={ <React.Suspense fallback={ <div>Loading...</div> }><HomePage /></React.Suspense> } />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;

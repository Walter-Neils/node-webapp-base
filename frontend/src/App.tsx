import './App.css';
import { BrowserRouter, Route, RouteProps, Routes } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import React, { Suspense } from 'react';
import { CircularProgress } from '@mui/material';
const HomePage = React.lazy(() => import('./pages/HomePage'));

let __getRoutes: () => RouteProps[] = () => [];
let __addRoute: (route: RouteProps) => void = () => { };
let __removeRoute: (predicate: (route: RouteProps) => boolean) => void = () => { };

export function getRoutes()
{
  return __getRoutes();
}

export function addRoute(route: any)
{
  __addRoute(route);
}

export function removeRoute(predicate: (route: RouteProps) => boolean)
{
  __removeRoute(predicate);
}

function App()
{
  const [ routes, setRoutes ] = React.useState<RouteProps[]>([ { path: '/', element: <HomePage /> } ]);
  __getRoutes = () => routes;
  __addRoute = (route: any) => setRoutes(routes => [ ...routes, route ]);
  __removeRoute = (predicate: (route: RouteProps) => boolean) => setRoutes(routes => routes.filter(route => !predicate(route)));
  return (
    <SnackbarProvider maxSnack={ 3 }>
      <Suspense fallback={ <CircularProgress /> }>
        <BrowserRouter>
          <Routes>
            {
              routes.map((route, index) => <Route key={ index } { ...route } />)
            }
          </Routes>
        </BrowserRouter>
      </Suspense>
    </SnackbarProvider>
  );
}

export default App;

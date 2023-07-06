import './App.css';
import { BrowserRouter, Route, RouteProps, Routes } from 'react-router-dom';
import { SnackbarProvider } from 'notistack';
import React, { Suspense } from 'react';
import { Alert, Backdrop, CircularProgress, Fade, Grow, Paper, Slide, Theme, ThemeProvider, Typography, createTheme } from '@mui/material';
import { localCoreDataServer } from './data/ServerConnection';
import { IUIConfiguration, IUIModule } from './shared/UIConfigurationTypes';
import AboutPage from './pages/AboutPage';
import { FlashNotification } from './components/FlashNotification';
const HomePage = React.lazy(() => import('./pages/HomePage'));

let __getRoutes: () => RouteProps[] = () => [];
let __addRoute: (route: RouteProps) => void = () => { };
let __removeRoute: (predicate: (route: RouteProps) => boolean) => void = () => { };
let __setTheme: (theme: Theme) => void;

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

export function setTheme(theme: Theme)
{
  __setTheme(theme);
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark'
  }
});

let modules: IUIModule[] = [];

function App()
{
  const [ routes, setRoutes ] = React.useState<RouteProps[]>(
    [
      {
        path: '/',
        element: <HomePage />
      },
      {
        path: '/about',
        element: <AboutPage />
      }
    ]);
  const [ theme, setTheme ] = React.useState<Theme>(darkTheme);
  const [ clientConfiguration, setClientConfiguration ] = React.useState<IUIConfiguration | undefined>();
  const [ showDebugNotice, setShowDebugNotice ] = React.useState<boolean>(process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development');

  React.useEffect(() =>
  {
    if (showDebugNotice)
    {
      setTimeout(() =>
      {
        setShowDebugNotice(false);
      }, 2500);
    }
  }, [ showDebugNotice ]);

  React.useEffect(() =>
  {
    (async () =>
    {
      const configuration = await localCoreDataServer.getClientConfiguration();
      modules = configuration.modules;
      setClientConfiguration(configuration);
    })();
  }, []);

  React.useEffect(() =>
  {
    (async () =>
    {
      if (!clientConfiguration) 
      {
        return;
      }

      let newRoutes: RouteProps[] = [];
      for (const routeProps of routes)
      {
        const targetModule = clientConfiguration.modules.find(x => x.path === routeProps.path);
        if (!targetModule)
        {
          newRoutes.push(routeProps);
          localCoreDataServer.notifyMissingClientConfigurationModule({
            path: routeProps.path!,
            enabled: true
          });
        }
        else
        {
          if (targetModule.enabled)
          {
            newRoutes.push(routeProps);
          }
        }
        setRoutes(newRoutes);
      }
    })();
  }, [ clientConfiguration ]);


  __getRoutes = () => routes;
  __addRoute = (route: any) => setRoutes(routes => [ ...routes, route ]);
  __removeRoute = (predicate: (route: RouteProps) => boolean) => setRoutes(routes => routes.filter(route => !predicate(route)));
  __setTheme = x => setTheme(x);


  if (!clientConfiguration) return <></>;


  return (
    <ThemeProvider theme={ theme }>
      <SnackbarProvider maxSnack={ 3 }>
        <Suspense fallback={ <CircularProgress /> }>
          <BrowserRouter>
            <Routes>
              {
                routes.map((route, index) => <Route key={ index } { ...route } />)
              }
            </Routes>
          </BrowserRouter>
          <FlashNotification open={ showDebugNotice }>
            <Typography variant='h6'>
              Test
            </Typography>
          </FlashNotification>
        </Suspense>
      </SnackbarProvider>
    </ThemeProvider>
  );
};

export default App;;

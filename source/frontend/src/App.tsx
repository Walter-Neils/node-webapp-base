import React, { Suspense } from 'react';
import './App.css';
import './server/microservices';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { Alert, Box, Button, Card, CircularProgress, Collapse, CssBaseline, Fade, LinearProgress, ThemeProvider, Typography, createTheme } from '@mui/material';
import { useTimeout } from './components/hooks/ClockEvents';
import { ErrorBoundary } from './components/buildingblocks/conditionals/errorboundaries/ErrorBoundary';
import { useTextElements } from './components/buildingblocks/text/TextScaleContext';

const HomePage = React.lazy(() => import('./components/pages/HomePage'));
const LoginPage = React.lazy(async () =>
{
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return import('./components/pages/LoginPage');
});

const PortfolioPage = React.lazy(() => import('./components/pages/PortfolioPage'));


function EncaseSuspense(props: { children: React.ReactNode; })
{
  const [ isTakingLongerThanExpected, setIsTakingLongerThanExpected ] = React.useState(false);
  const { Body } = useTextElements('Major Mono Display', 'body');
  useTimeout(() =>
  {
    setIsTakingLongerThanExpected(true);
  }, 2500);

  return (
    <ErrorBoundary errorHandler={ (error, errorInfo, componentStack, reset) =>
    {
      return (
        <>
          <Box sx={ {
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh'
          } }>
            <Box sx={ {
              // Stack children vertically
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
            } }>
              <Alert severity='error'>
                An error occurred while rendering this page.
              </Alert>
              <Button onClick={ () =>
              {
                reset();
              } }>Reset</Button>
            </Box>
          </Box>
        </>
      );
    } }>
      <Suspense fallback={ <>
        <Box sx={ {
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
        } }>
          <Box sx={ {
            // Stack children vertically
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            // Vertical spacing between children
            gap: 2,
            width: '75%'
          } }>
            <Collapse in={ isTakingLongerThanExpected }>
              <Body>
                This is taking longer than expected
              </Body>
            </Collapse>
            <LinearProgress sx={ {
              width: '100%',
              maxWidth: 400,
              borderRadius: 4,
              marginBottom: 2
            } } />
          </Box>
        </Box>
      </> }>
        { props.children }
      </Suspense>
    </ErrorBoundary>
  );
}

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
  // typography: {
  //   fontFamily: [ 'Major Mono Display', 'monospace' ].join(','),
  // },
});

const lightTheme = createTheme({ palette: { mode: 'light' } });

function App()
{
  return (
    <ThemeProvider theme={ darkTheme }>
      <CssBaseline />
      <SnackbarProvider maxSnack={ 3 }>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={ <EncaseSuspense><HomePage /></EncaseSuspense> } />
            <Route path="/login" element={ <EncaseSuspense><LoginPage /></EncaseSuspense> } />
            <Route path="/portfolio" element={ <EncaseSuspense><PortfolioPage /></EncaseSuspense> } />
          </Routes>
        </BrowserRouter>
      </SnackbarProvider>
    </ThemeProvider>
  );
}

export default App;

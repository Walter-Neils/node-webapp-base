import React, { Suspense } from 'react';
import './App.css';
import './server/microservices';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SnackbarProvider, enqueueSnackbar } from 'notistack';
import { Alert, Box, Button, Card, CircularProgress, Collapse, Fade, LinearProgress, Typography } from '@mui/material';
import { useTimeout } from './components/hooks/ClockEvents';
import { ErrorBoundary } from './components/buildingblocks/conditionals/errorboundaries/ErrorBoundary';

const HomePage = React.lazy(() => import('./components/pages/HomePage'));
const LoginPage = React.lazy(async () =>
{
  await new Promise((resolve) => setTimeout(resolve, 5000));
  return import('./components/pages/LoginPage');
});


function EncaseSuspense(props: { children: React.ReactNode; })
{
  const [ isTakingLongerThanExpected, setIsTakingLongerThanExpected ] = React.useState(false);

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
          height: '100vh'
        } }>
          <Box sx={ {
            // Stack children vertically
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
          } }>
            <Collapse in={ isTakingLongerThanExpected }>
              <Typography variant='body1' color='GrayText' gutterBottom>
                Something's taking longer than expected...
              </Typography>
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

function App()
{
  return (
    <SnackbarProvider maxSnack={ 3 }>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={ <EncaseSuspense><HomePage /></EncaseSuspense> } />
          <Route path="/login" element={ <EncaseSuspense><LoginPage /></EncaseSuspense> } />
        </Routes>
      </BrowserRouter>
    </SnackbarProvider>
  );
}

export default App;

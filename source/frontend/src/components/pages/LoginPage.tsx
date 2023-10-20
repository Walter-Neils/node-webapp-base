import { Avatar, Badge, Box, Button, Card, CircularProgress, Collapse, Fade, LinearProgress, TextField, Typography } from "@mui/material";
import React, { useEffect } from "react";
import { TransitionGroup } from "react-transition-group";
import "../../logo.svg";
import { enqueueSnackbar } from "notistack";
import CheckIcon from '@mui/icons-material/Check';
import { useMicroservice } from "../../server/microservices/Microservice";

export default function LoginPage(props: Record<string, never>)
{
    const [ avatarSource, setAvatarSource ] = React.useState<string>('/logo.svg');
    const [ isAvatarLoading, setIsAvatarLoading ] = React.useState(false);
    const [ username, setUsername ] = React.useState("");
    const [ password, setPassword ] = React.useState("");

    const [ userService ] = useMicroservice('userService');
    const [ state, setState ] = React.useState<'initializing' | 'username' | 'password' | 'logged_in'>('initializing');
    const [ isWorking, setIsWorking ] = React.useState(false);

    const [ isLoggedIn, setIsLoggedIn ] = React.useState(false);

    useEffect(() =>
    {
        (async () =>
        {
            if (state === 'initializing' && userService.state === 'fulfilled')
            {
                if (userService.value === undefined)
                {
                    enqueueSnackbar('User service is not available', { variant: 'error' });
                    return;
                }
                try
                {
                    const currentUser = await userService.value.getCurrentUser();
                    if (currentUser !== null)
                    {
                        setUsername(currentUser.displayName);
                        setAvatarSource(currentUser.profilePictureURL);
                        setState('logged_in');
                        setIsLoggedIn(true);
                    }
                    else
                    {
                        setState('username');
                    }
                }
                catch (e: unknown)
                {
                    enqueueSnackbar((e as Error).message, { variant: 'error' });
                }
            }
        })();
    }, [ (userService as unknown as { value: unknown; }).value, state ]);

    const setUserAvatar = React.useCallback(async () =>
    {
        // setIsAvatarLoading(true);

        // await new Promise((resolve) => setTimeout(resolve, 1000));
        // setIsAvatarLoading(false);
    }, [ userService, username ]);

    React.useEffect(() =>
    {
        if (state === 'password')
        {
            setUserAvatar();
        }
    }, [ state, userService ]);

    const lockInUser = React.useCallback(async () =>
    {
        setIsWorking(true);
        if (userService.state !== 'fulfilled')
        {
            enqueueSnackbar(`User service not loaded: ${userService.state}`, { variant: 'error' });
            return;
        }

        const service = userService.value;
        if (service === undefined)
        {
            enqueueSnackbar('User service is not available', { variant: 'error' });
            return;
        }

        try
        {
            setIsAvatarLoading(true);
            const profile = await service.getUserProfile({
                by: 'username',
                username: username,
            });

            if (profile === undefined)
            {
                enqueueSnackbar('User not found', { variant: 'error' });
                return;
            }
            await new Promise((resolve) => setTimeout(resolve, 1000));
            setAvatarSource(profile.profilePictureURL);
            setState('password');
        }
        catch (e: unknown)
        {
            enqueueSnackbar((e as Error).message, { variant: 'error' });
        }
        finally
        {
            setIsWorking(false);
            setIsAvatarLoading(false);
        }

    }, [ username, userService ]);

    const tryLogin = React.useCallback(async () =>
    {
        try
        {
            setIsWorking(true);
            if (userService.state !== 'fulfilled')
            {
                enqueueSnackbar(`User service not loaded: ${userService.state}`, { variant: 'error' });
                return;
            }
            const service = userService.value;
            if (service === undefined)
            {
                enqueueSnackbar('User service is not available', { variant: 'error' });
                return;
            }
            try
            {
                await service.authenticate(username, password);
                enqueueSnackbar('Logged in', { variant: 'success' });
                setIsLoggedIn(true);
                setState('logged_in');
            }
            catch (e: any)
            {
                setIsLoggedIn(false);
                enqueueSnackbar(e.message, { variant: 'error' });
            }
        }
        finally
        {
            setIsWorking(false);
        }
    }, [ username, password, userService ]);

    const logout = React.useCallback(async () =>
    {
        if (userService.state !== 'fulfilled')
        {
            enqueueSnackbar(`User service not loaded: ${userService.state}`, { variant: 'error' });
            return;
        }
        if (userService.value === undefined)
        {
            enqueueSnackbar(`User service not available`, { variant: 'error' });
            return;
        }
        await userService.value.logOut();
        setUsername("");
        setPassword("");
        setAvatarSource('/logo.svg');
        setIsLoggedIn(false);
        setState('username');
    }, [ userService ]);

    if (userService.state === 'pending')
    {
        return (
            <>
                <Box sx={ {
                    // Center the box horizontally and vertically
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                } }>
                    <CircularProgress />
                </Box>
            </>
        );
    }

    return (
        <>
            <Box sx={ {
                // Center the box horizontally and vertically
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            } }>
                <Card sx={ {
                    padding: '1em',
                    // Stack the children vertically
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1em',
                    width: '20em',
                } }>
                    <Collapse in={ isWorking }>
                        <LinearProgress />
                    </Collapse>
                    <Fade in={ !isAvatarLoading }>
                        <Badge
                            sx={ {
                                alignSelf: 'center',
                            } }
                            anchorOrigin={ {
                                vertical: 'bottom',
                                horizontal: 'right',
                            } }
                            badgeContent={
                                isLoggedIn ? <CheckIcon /> : undefined
                            }
                            color='success'
                        >
                            <Avatar sx={ {
                                width: '5em',
                                height: '5em',
                            } } src={ avatarSource } />
                        </Badge>
                    </Fade>
                    <TransitionGroup>
                        {
                            state === 'username' && <Collapse key="username">
                                <Box sx={ {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1em',

                                } }>
                                    <TextField disabled={ isWorking } label="Username" value={ username } onChange={ (e) => setUsername(e.target.value) } />
                                    <Collapse in={ username.length > 0 }>
                                        <Button disabled={ isWorking } sx={ {
                                            width: '100%',
                                        } } variant="contained" onClick={ lockInUser }>Next</Button>
                                    </Collapse>
                                </Box>
                            </Collapse>
                        }
                        {
                            state === 'password' && <Collapse key="password">
                                <Box sx={ {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1em',
                                } }>
                                    <TextField disabled={ isWorking } type='password' label="Password" value={ password } onChange={ (e) => setPassword(e.target.value) } />
                                    <Collapse in={ password.length > 0 }>
                                        <Button disabled={ isWorking } sx={ {
                                            width: '100%',
                                        } } variant="contained" onClick={ tryLogin }>Log in</Button>
                                    </Collapse>
                                </Box>
                            </Collapse>
                        }
                        {
                            state === 'logged_in' && <Collapse key="logged_in">
                                <Box sx={ {
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '1em',
                                    textAlign: 'center',
                                } }>
                                    <Typography variant='body1' color={
                                        'GrayText'
                                    }>
                                        Welcome back, { username }!
                                    </Typography>
                                    <Button disabled={ isWorking } sx={ {
                                        width: '100%',
                                    } } variant="contained" onClick={ logout }>Log out</Button>
                                </Box>
                            </Collapse>
                        }
                    </TransitionGroup>
                </Card>
            </Box>
        </>
    );
}
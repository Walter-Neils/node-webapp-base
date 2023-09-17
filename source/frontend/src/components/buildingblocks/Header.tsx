import { Box, AppBar, Toolbar, IconButton, Typography, Badge } from "@mui/material";
import MenuIcon from '@mui/icons-material/Menu';
import React from "react";

export type HeaderProps = {
    title: string;
    leftElements?: JSX.Element[];
    rightElements?: JSX.Element[];
    drawerBadge?: {
        value: string | number;
        color: 'default' | 'error' | 'info' | 'primary' | 'secondary' | 'success' | undefined;
    };
};

export default function Header(props: HeaderProps)
{
    return (
        <Box sx={ { flexGrow: 1 } }>
            <AppBar position="static">
                <Toolbar>
                    <IconButton
                        size="large"
                        edge="start"
                        color="inherit"
                        aria-label="open drawer"
                        sx={ { mr: 2 } }
                    >
                        <Badge badgeContent={ props.drawerBadge?.value } color={
                            props.drawerBadge?.color ?? 'default'
                        }>
                            <MenuIcon />
                        </Badge>
                    </IconButton>
                    <Typography
                        variant="h6"
                        noWrap
                        component="div"
                        sx={ {
                            display: {
                                xs: 'none',
                                sm: 'block'
                            },
                            marginRight: 2
                        } }
                    >
                        { props.title }
                    </Typography>
                    {
                        props.leftElements?.map((element, index) => (<React.Fragment key={ index }>{ element }</React.Fragment>))
                    }
                    <Box sx={ { flexGrow: 1 } } />
                    <Box sx={ { display: { xs: 'none', md: 'flex' } } }>
                        {/* <IconButton size="large" color="inherit">
                            <Badge badgeContent={ '!' } color="error">
                                <MailIcon />
                            </Badge>
                        </IconButton>
                        <IconButton
                            size="large"
                            color="inherit"
                        >
                            <Badge badgeContent={ 17 } color="error">
                                <NotificationsIcon />
                            </Badge>
                        </IconButton> */}
                        {
                            props.rightElements?.map((element, index) => (<React.Fragment key={ index }>{ element }</React.Fragment>))
                        }
                    </Box>
                </Toolbar>
            </AppBar>
        </Box>

    );
}
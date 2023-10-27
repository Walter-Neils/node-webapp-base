import EventEmitter from 'events';
import TypedEventEmitter from '../clientShared/TypedEventListener';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import React from 'react';

export const themes = {
	dark: createTheme({
		palette: {
			mode: 'dark',
		},
	}),
	light: createTheme({
		palette: {
			mode: 'light',
		},
	}),
};

export const themeEvents = new TypedEventEmitter<{
	requestThemeChange: [ theme: keyof typeof themes ];
}>(new EventEmitter());


export function Themed(props: {
	theme: keyof typeof themes;
	children: React.ReactNode | React.ReactNode[] | JSX.Element | JSX.Element[];
})
{
	return (
		<ThemeProvider theme={ themes[ props.theme ] }>
			<CssBaseline />
			{ props.children }
		</ThemeProvider>
	);
}
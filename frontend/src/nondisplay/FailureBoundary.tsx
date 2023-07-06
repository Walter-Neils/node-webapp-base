import { Alert, AlertTitle, Typography } from "@mui/material";
import React from "react";

function DefaultFailureDisplay(props: { componentName?: string; })
{
    return (
        <>
            <Alert severity="error">
                <AlertTitle>Critical Component Failure
                    {
                        props.componentName !== undefined && <> in component '{ props.componentName }'</>
                    }</AlertTitle>
                <Typography variant="body1">
                    This component encountered an unhandled error and could not recover.
                </Typography>
            </Alert>
        </>
    );
}

export interface FailureBoundaryBaseProps
{
    children: React.ReactNode;
}

export type FailureBoundaryProps = FailureBoundaryBaseProps & (
    { fallback: JSX.Element; } |
    { failureHandler: (error: Error, errorInfo: React.ErrorInfo, reset: () => void) => React.ReactNode; } |
    { componentName: string; }
);

/**
 * A component that catches errors in its children and displays a fallback UI.
 */
export default class FailureBoundary extends React.Component<FailureBoundaryProps, { hasError: boolean; error: any, errorInfo: any; }>
{
    constructor(props: any)
    {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: any)
    {
        // Update state so the next render will show the fallback UI.
        return { hasError: true, error: error };
    }

    componentDidCatch(error: any, errorInfo: any)
    {
        this.setState({ hasError: true, error: error, errorInfo: errorInfo });
    }

    render()
    {
        if (this.state.hasError)
        {
            if ('failureHandler' in this.props)
            {
                const reset = () =>
                {
                    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
                };
                return this.props.failureHandler(this.state.error, this.state.errorInfo, reset);
            }
            else if ('fallback' in this.props)
            {
                return this.props.fallback;
            }
            else
            {
                return <DefaultFailureDisplay componentName={ this.props.componentName } />;
            }
        }
        return this.props.children;
    }
}
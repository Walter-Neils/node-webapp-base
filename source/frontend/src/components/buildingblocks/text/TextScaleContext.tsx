import { Typography, TypographyProps } from "@mui/material";

type TextType = 'title' | 'heading' | 'subheading' | 'body' | 'caption' | 'button' | 'overline' | 'emphasis';

type TextScaleContext = {
    typographyOverrideProps: (type: TextType) => Partial<TypographyProps>;
};

const contexts = {
    'Roboto': {
        typographyOverrideProps: (type: TextType) =>
        {
            const props: Partial<TypographyProps> = {};
            switch (type)
            {
                case 'title':
                    props.variant = 'h3';
                    props.color = 'primary';
                    break;
                case 'heading':
                    props.variant = 'h4';
                    props.color = 'primary';
                    break;
                case 'subheading':
                    props.variant = 'h5';
                    props.color = 'secondary';
                    break;
                case 'body':
                    props.variant = 'body1';
                    break;
                case 'caption':
                    props.variant = 'caption';
                    props.color = 'GrayText';
                    break;
                case 'button':
                    props.variant = 'button';
                    break;
                case 'overline':
                    props.variant = 'overline';
                    break;
                case 'emphasis':
                    props.variant = 'body1';
                    props.fontWeight = 'bold';
                    break;
            }
            return props;
        }
    },
    "Major Mono Display": {
        typographyOverrideProps: (type: TextType) =>
        {
            const props: Partial<TypographyProps> = {
                fontFamily: 'Major Mono Display, monospace',
            };
            switch (type)
            {
                case 'title':
                    props.variant = 'h3';
                    props.color = 'primary';
                    break;
                case 'heading':
                    props.variant = 'h4';
                    props.color = 'primary';
                    // Underline
                    props.sx = {
                        borderBottom: '3px solid',
                        borderColor: 'primary.main',
                        paddingBottom: '0.1em',
                        padding: '0.2em',
                        textAlign: 'center',
                    };
                    break;
                case 'subheading':
                    props.variant = 'h5';
                    props.color = 'secondary';
                    break;
                case 'body':
                    props.variant = 'body1';
                    break;
                case 'caption':
                    props.variant = 'caption';
                    //props.color = 'GrayText';
                    break;
                case 'button':
                    props.variant = 'button';
                    break;
                case 'overline':
                    props.variant = 'overline';
                    break;
                case 'emphasis':
                    props.variant = 'body1';
                    props.fontWeight = 'bold';
                    break;
            }
            return props;
        }
    }
};

type Capitalize<S extends string> = S extends `${infer First}${infer Rest}` ? `${Uppercase<First>}${Rest}` : S;

export function useTextElements<KTextType extends TextType>(family: keyof typeof contexts, ...type: KTextType[]): Record<Capitalize<KTextType>, (props: TypographyProps) => JSX.Element>
{
    const context = contexts[ family ];
    // return (props: TypographyProps) => (<Typography { ...props } { ...context.typographyOverrideProps(type) } />);
    const result = {} as Record<Capitalize<KTextType>, (props: TypographyProps) => JSX.Element>;
    for (const t of type)
    {
        (result as {
            [ key: string ]: (props: TypographyProps) => JSX.Element;
        })[ t[ 0 ].toUpperCase() + t.slice(1) ] = (props: TypographyProps) => (<Typography { ...props } { ...context.typographyOverrideProps(t) } />);
    }
    return result;
}
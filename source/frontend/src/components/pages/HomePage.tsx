import { useURLMappedStateValue } from "../hooks/URLMappedStateValue";

export type HomePageProps = {};

export default function HomePage(props: HomePageProps)
{
    const [ name, setName ] = useURLMappedStateValue<string>('name');


    return (
        <>
            { name }
        </>
    );
}
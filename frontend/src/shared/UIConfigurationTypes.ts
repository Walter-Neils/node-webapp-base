export interface IUIModule
{
    path: string;
    enabled: boolean;
}

export interface IUIConfiguration
{
    modules: IUIModule[];
}
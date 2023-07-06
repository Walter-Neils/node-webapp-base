export interface IPathRestrictor
{
    enabled: boolean;
    message: string;
}

export interface IRawPathRestrictor extends IPathRestrictor
{
    rawPattern: string;
}

export interface IRefinedPathRestrictor extends IPathRestrictor
{
    pattern: RegExp;
}
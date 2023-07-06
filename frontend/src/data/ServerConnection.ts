import { IUIConfiguration, IUIModule } from "../shared/UIConfigurationTypes";

export class ServerConnection
{
    private baseURL: string;

    public constructor(urlBase: string)
    {
        this.baseURL = urlBase;
    }

    private async requestJSON<T>(urlExtension: string)
    {
        const fullURL = `${this.baseURL}${urlExtension}`;
        const clientResult = await fetch(fullURL);
        const clientResultJSON = await clientResult.json();
        return clientResultJSON as T;
    }

    public async getClientConfiguration()
    {
        const urlExtension = '/client/config';
        return this.requestJSON<IUIConfiguration>(urlExtension);
    }

    public async notifyMissingClientConfigurationModule(module: IUIModule)
    {
        const urlExtension = '/client/config-missing-module';
        const fullURL = `${this.baseURL}${urlExtension}`;
        const body = JSON.stringify(module);
        await fetch(fullURL, { method: 'POST', body: body });
    }
}

export const localCoreDataServer = new ServerConnection(`http://${window.location.hostname}:${window.location.port}/api`);
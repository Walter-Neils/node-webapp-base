import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import { HTTPInternalRedirect, HTTPRequestFallthroughError, route } from "./server.ts";
import fs from 'fs';
import { getContentType } from "./fileContentTypeResolver.ts";
import { ServerPersistentStorage } from "./serverPersistentStorage.ts";

class StaticSiteServer
{
    // Match any path that doesn't start with '/api'
    @route({ pathRegex: /^(?!\/api).+$/, priority: -999 })
    public async SiteServer(req: IncomingMessage, res: ServerResponse)
    {
        // If the path begins with '/api', then we don't want to serve the react site
        if (req.url?.startsWith('/api'))
        {
            throw new HTTPRequestFallthroughError('Request should be handled by the API server');
        }

        // If we didn't find anything, send the site back
        // The react site is located at ../../react/build
        const siteRoot = path.join(await ServerPersistentStorage.getConfigurationValue<string>("site-build-root", '../frontend/build'));
        const isReactValid = fs.existsSync(siteRoot + '/index.html');
        if (isReactValid)
        {
            let requestedPath = path.join(siteRoot, req.url ?? 'index.html');
            if (req.url?.endsWith('/'))
            {
                requestedPath = path.join(requestedPath, 'index.html');
            }
            if (fs.existsSync(requestedPath))
            {
                // If the file exists, send it
                await this.sendFile(res, requestedPath);
            }
            else
            {
                // If the file doesn't exist, send the index.html
                await this.sendFile(res, siteRoot + '/index.html');
            }

            res.end();
            return;
        }
        // Dev server runs on port 3001
        // Attempt to proxy to the dev server
        const devServer = await ServerPersistentStorage.getConfigurationValue<string>("site-dev-server", "http://127.0.0.1:3000");
        try
        {
            const targetUrl = devServer + req.url ?? '';
            const request = await fetch(targetUrl);
            const contentType = request.headers.get('content-type');
            if (contentType)
            {
                res.setHeader('Content-Type', contentType);
            }
            const content = await request.blob();
            const buffer = await content.arrayBuffer();
            res.write(Buffer.from(buffer));
        }
        catch (e: any)
        {
            res.write(`No react site found at ${siteRoot}\n`);
            res.write(`Unable to proxy to dev server at ${devServer}\n`);
            res.write(`Failed to serve ${req.url}\n`);
            res.statusCode = 500;
        }

        res.end();
    }

    // Match any path that ends with marker-icon.png or marker-shadow.png
    @route({ pathRegex: /marker-icon.png|marker-shadow.png/ })
    public async MarkerIcon(req: IncomingMessage, res: ServerResponse)
    {
        const isRequestingShadow = req.url?.includes('marker-shadow.png');
        let requestedPath = path.join('../react/build', isRequestingShadow ? 'marker-shadow.png' : 'marker-icon.png');
        if (!fs.existsSync(requestedPath))
        {
            requestedPath = path.join('../react/public', isRequestingShadow ? 'marker-shadow.png' : 'marker-icon.png');
        }
        try
        {
            await this.sendFile(res, requestedPath);
        }
        catch (e: any)
        {
            res.statusCode = 500;
            res.end(e.message);
        }
    }

    public async sendFile(res: ServerResponse, requestedPath: string)
    {
        const content = fs.readFileSync(requestedPath);
        const typeOfContent = getContentType(requestedPath);
        res.setHeader('Content-Type', typeOfContent);
        res.write(content);
    }
}
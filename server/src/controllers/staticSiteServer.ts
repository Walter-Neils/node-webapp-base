import { IncomingMessage, ServerResponse } from "http";
import path from "path";
import fs from 'fs';
import { ServerPersistentStorage } from "../core/database/serverPersistentStorage.js";
import { getContentType } from "../core/request-response-helpers/fileContentTypeResolver.js";
import { HTTPRequestFallthrough, HTTPInternalRedirect } from "../core/server/requestPathOperators.js";
import { route } from "../core/server/server.js";
import { Controller } from "../core/server/controller.js";

class StaticSiteServer extends Controller
{
    // Match any path that doesn't start with '/api'
    @route({ pathRegex: /^(?!\/api).+$/, priority: -999 })
    public async SiteServer(req: IncomingMessage, res: ServerResponse)
    {
        // If the path begins with '/api', then we don't want to serve the react site
        if (req.url?.startsWith('/api'))
        {
            throw new HTTPRequestFallthrough('Request should be handled by the API server');
        }


        // If the request has a header X-Request-Source = 'grafana', redirect the url to '/api/grafana/...'
        if (req.headers[ 'x-request-source' ] === 'grafana')
        {
            let newURL = '/api/grafana' + req.url;
            if (newURL.endsWith('/'))
            {
                newURL = newURL.substr(0, newURL.length - 1);
            }
            throw new HTTPInternalRedirect(newURL);
        }

        // If the path ends with .gltf or .bin, set the cache control to 1 year
        if (req.url?.endsWith('.gltf') || req.url?.endsWith('.bin'))
        {
            res.setHeader('Cache-Control', 'max-age=31536000');
        }

        // If we didn't find anything, send the site back
        // The react site is located at ../../react/build
        const react_root = path.join(await ServerPersistentStorage.getConfigurationValue<string>("react-build-root",
            '../react/build'));
        const isReactValid = fs.existsSync(react_root + '/index.html');
        if (isReactValid)
        {
            let requestedPath = path.join(react_root, req.url ?? 'index.html');
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
                await this.sendFile(res, react_root + '/index.html');
            }

            res.end();
            return;
        }
        // Dev server runs on port 3001
        // Attempt to proxy to the dev server
        const devServer = await ServerPersistentStorage.getConfigurationValue<string>("react-dev-server", "http://127.0.0.1:3001");
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
            res.write(`No react site found at ${react_root}\n`);
            res.write(`Unable to proxy to dev server at ${devServer}\n`);
            res.write(`Failed to serve ${req.url}\n`);
            // Write the current working directory
            res.write(`Current working directory: ${process.cwd()}\n`);
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
            res.end();
        }
        catch (e: any)
        {
            res.statusCode = 500;
            res.end(e.message);
        }
    }

    public async sendFile(res: ServerResponse, requestedPath: string)
    {
        const lastModified = fs.statSync(requestedPath).mtime;
        res.setHeader('Last-Modified', lastModified.toUTCString());
        // Set cache control to the number of seconds since the last modified date
        const cacheControl = Math.floor((new Date().getTime() - lastModified.getTime()) / 1000);
        res.setHeader('Cache-Control', `max-age=${cacheControl}`);
        const content = fs.readFileSync(requestedPath);
        const typeOfContent = getContentType(requestedPath);
        res.setHeader('Content-Type', typeOfContent);
        res.write(content);
    }
}
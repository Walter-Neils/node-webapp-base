import { IncomingMessage, ServerResponse } from "http";
import { contextProvider, route } from "../core/server/server.js";
import { Controller } from "../core/server/controller.js";
import { ServerPersistentStorage } from "../core/database/serverPersistentStorage.js";
import { readBodyAsJSON } from "../core/request-response-helpers/bodyReaders.js";
import { getMongoDatabase } from "../core/database/databaseConnectors.js";
import hash from "../shared/hash.js";
import Cookies from 'cookies';

const log = await ServerPersistentStorage.useLogger("Authentication Controller");

const authenticationCollection = (await getMongoDatabase('Server')).collection<IUserAccount>('authentication');

interface LoginRequest
{
    username: string;
    password: string;
}

interface IUserAccount
{
    username: string;
    password: string;
    sessionID: string;
    scopes: string[];
    profilePictureURL?: string;
}

class AuthenticationController extends Controller
{
    // Route: /api/auth/login
    @route({ pathRegex: /^\/api\/auth\/login/, methods: "POST" })
    public async Login(req: IncomingMessage, res: ServerResponse)
    {
        const body = await readBodyAsJSON<LoginRequest>(req);
        if (!body)
        {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.write(JSON.stringify({ message: 'Bad Request' }));
            res.end();
            return;
        }

        const userAccount = await authenticationCollection.findOne({ username: body.username });
        if (!userAccount)
        {
            res.write(JSON.stringify({ success: false }));
            res.end();
            return;
        }

        if (userAccount.password !== body.password)
        {
            res.write(JSON.stringify({ success: false }));
            res.end();
            return;
        }

        const cookieManager = new Cookies(req, res);
        const newSessionID = hash(userAccount.username + Date.now().toString());

        // update sessionID
        userAccount.sessionID = newSessionID.toString();

        // update database
        authenticationCollection.updateOne({
            _id: userAccount._id
        }, {
            $set: { sessionID: newSessionID.toString() }
        });

        const cookieOptions = {
            expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7), // 1 week
        };

        cookieManager.set("sessionID", newSessionID.toString(), cookieOptions);
        cookieManager.set("username", userAccount.username, cookieOptions);
        cookieManager.set("scopes", userAccount.scopes.join(","), cookieOptions);

        res.statusCode = 200;
        res.write(JSON.stringify({ success: true }));
        res.end();


    }

    // Route: /api/auth/scopes
    @route({ pathRegex: /^\/api\/auth\/scopes/, methods: "GET" })
    public async GetScopes(req: IncomingMessage, res: ServerResponse)
    {
        return this.getControllerContextValue<string[]>('scopes');
    }

    // Route: /api/auth/isAuthenticated
    @route({ pathRegex: /^\/api\/auth\/isAuthenticated/, methods: "GET" })
    public async IsAuthenticated(req: IncomingMessage, res: ServerResponse)
    {
        res.end(JSON.stringify(this.getControllerContextValue<boolean>('isAuthenticated')));
        return;
    }

    // Route: /api/auth/profilePictureURL
    @route({ pathRegex: /^\/api\/auth\/profilePictureURL/, methods: "GET" })
    public async GetProfilePictureURL(req: IncomingMessage, res: ServerResponse)
    {
        const queryParameters = new URLSearchParams(req.url!.split("?")[ 1 ]);
        let username = "";
        if (queryParameters.has("username"))
        {
            username = queryParameters.get("username")!;
        }
        else if (this.getControllerContextValue<boolean>('isAuthenticated'))
        {
            username = this.getControllerContextValue<string>('username')!;
        }
        else
        {
            res.statusCode = 400;
            res.end();
            return;
        }

        const userAccount = await authenticationCollection.findOne({ username: username });
        if (!userAccount)
        {
            res.statusCode = 404;
            res.end();
            return;
        }

        if (!userAccount.profilePictureURL)
        {
            res.statusCode = 404;
            res.end();
            return;
        }

        res.end(JSON.stringify(userAccount.profilePictureURL));
    }

    // Route: /api/auth/test
    @route({ pathRegex: /^\/api\/auth\/test/, methods: "GET" })
    public async Test(req: IncomingMessage, res: ServerResponse)
    {
        const username = this.getControllerContextValue<string>('username');
        const scopes = this.getControllerContextValue<string[]>('scopes');
        const isAuthenticated = this.getControllerContextValue<boolean>('isAuthenticated');
        res.write(JSON.stringify({
            username,
            scopes,
            isAuthenticated
        }));
        res.end();
    }




    @contextProvider({ name: 'Authentication Context' })
    public async AuthenticationContext(req: IncomingMessage, res: ServerResponse, target: Controller)
    {
        const cookieManager = new Cookies(req, res);
        const sessionID = cookieManager.get("sessionID");
        if (!sessionID)
        {
            target.setControllerContextValue('isAuthenticated', false);
            return;
        }

        const user = await authenticationCollection.findOne({ sessionID: sessionID });
        if (!user)
        {
            target.setControllerContextValue('isAuthenticated', false);
            return;
        }

        target.setControllerContextValue('isAuthenticated', true);
        target.setControllerContextValue('username', user.username);
        target.setControllerContextValue('scopes', user.scopes);
    }
}
import webpush from "web-push";
import { route } from "./server.ts";
import { IncomingMessage, ServerResponse } from "http";
import { readBodyAsJSON } from "./bodyReaders.ts";

// Disable formatting for this line (batch script relies on it being a single line)
// prettier-ignore
const vapidKeys = { publicKey: "BBYTQzpXh5GeTd-Z-wFL86u6k2Xp0YZCJ0aixaKU_I7IqABtQE588DyxoqWy4Cmvg0S3s017dGUH1UhM4tb0gUc", privateKey: "5EtasBNJwn0Mx0xr4wcEFV93Fv18zxa3DGKHaEMm1ug" };


webpush.setVapidDetails(
    'mailto:test@localhost',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const subscriptions = new Set<any>();

export interface IPushNotificationPayload
{
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: any;
}

export async function sendPushNotification(subscription: any, payload: IPushNotificationPayload)
{
    try
    {
        await webpush.sendNotification(subscription, JSON.stringify(payload));
        return true;
    }
    catch (err)
    {
        return false;
    }
}

export async function notifyAll(payload: IPushNotificationPayload)
{
    for (const subscription of subscriptions)
    {
        await sendPushNotification(subscription, payload);
    }
}

class PushNotificationController
{
    // Subscribe route
    @route({ pathRegex: /^\/api\/subscribe/ })
    public async Subscribe(req: IncomingMessage, res: ServerResponse) 
    {
        notifyAll({
            title: "New Subscriber",
            body: `A new subscriber has been added to the list (${subscriptions.size} total)`,
        });
        // Get pushSubscription object
        const subscription = await readBodyAsJSON<any>(req);
        subscriptions.add(subscription);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({}));
    }

    // Route: /api/notification/test
    @route({ pathRegex: /^\/api\/notification\/test/ })
    public async Test(req: IncomingMessage, res: ServerResponse)
    {
        for (const subscription of subscriptions)
        {
            sendPushNotification(subscription, {
                title: "Sensor Outage Detected",
                body: "Sensor WR3 has been offline for 5 minutes",
                icon: "images/icon.png",
                badge: "images/badge.png"
            }).catch((err) => 
            {
                // Remove the subscription if it's no longer valid
                if (err.statusCode === 410)
                {
                    subscriptions.delete(subscription);
                    console.log(`Subscription ${subscription.endpoint} has expired and has been removed`);
                }
            });
        }
        res.statusCode = 200;
        res.end();
        return;
    }
}
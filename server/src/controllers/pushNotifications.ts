import { IncomingMessage, ServerResponse } from "http";
import webpush, { PushSubscription } from "web-push";
import { getMongoDatabase } from "../core/database/databaseConnectors.js";
import { ServerPersistentStorage } from "../core/database/serverPersistentStorage.js";
import { readBodyAsJSON } from "../core/request-response-helpers/bodyReaders.js";
import { route } from "../core/server/server.js";

const vapidKeys = {
    publicKey: await ServerPersistentStorage.getConfigurationValue("vapid-public-key", "enter-vapid-keys-here"),
    privateKey: await ServerPersistentStorage.getConfigurationValue("vapid-private-key", "enter-vapid-keys-here")
};


webpush.setVapidDetails(
    await ServerPersistentStorage.getConfigurationValue("vapid-subject", 'mailto:test@localhost'),
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

const subscriptionsCollection = (await getMongoDatabase('Server')).collection<PushSubscription>('push-notification-subscriptions');

const addSubscription = async (subscription: any) =>
{
    await subscriptionsCollection.insertOne(subscription);
};

const removeSubscription = async (subscription: any) =>
{
    await subscriptionsCollection.deleteOne(subscription);
};

const log = await ServerPersistentStorage.useLogger("Push Notification Controller");

export interface IPushNotificationPayload
{
    title: string;
    body?: string;
    icon?: string;
    badge?: string;
    data?: any;
}

export async function sendPushNotification(subscription: PushSubscription, payload: IPushNotificationPayload)
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
    for (const subscription of await subscriptionsCollection.find({}).toArray())
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
            body: `A new subscriber has been added to the list`,
        });
        // Get pushSubscription object
        const subscription = await readBodyAsJSON<any>(req);
        addSubscription(subscription);
        res.statusCode = 201;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.end(JSON.stringify({}));
    }

    // Route: /api/notification/test
    @route({ pathRegex: /^\/api\/notification\/test/ })
    public async Test(req: IncomingMessage, res: ServerResponse)
    {
        for (const subscription of await subscriptionsCollection.find({}).toArray())
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
                    removeSubscription(subscription);
                    log('warn', `Subscription ${subscription.endpoint} has expired and has been removed from the list`);
                }
            });
        }
        res.statusCode = 200;
        res.end();
        return;
    }
}
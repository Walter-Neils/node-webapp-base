import { enqueueSnackbar } from "notistack";
import delay from "../shared/delay";

const VAPIDPublicKey = "BKSqE-CjdRYXLccoOP-ORLtg40zF4FDPgmPptrINFkcYqslFxj3mtNzRTYDujUd51LK-pAR4oWannoyAZdh8ZCc";

export async function subscribeToPushNotifications() 
{
    const serviceWorkerURL = "/notificationServiceWorker.js";

    if (!("serviceWorker" in navigator))
    {
        console.error("Service workers are not supported by this browser");
        return;
    }

    // Check if the service worker is already registered
    const existingRegistration = await navigator.serviceWorker.getRegistration(serviceWorkerURL);
    if (existingRegistration) 
    {
        console.log("Service worker already registered");
        return;
    }

    const registration = await navigator.serviceWorker.register(serviceWorkerURL);
    const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: VAPIDPublicKey
    });
    const subscriptionJSON = JSON.stringify(subscription);
    const response = await fetch("/api/subscribe", {
        method: "POST",
        body: subscriptionJSON,
        headers: {
            "Content-Type": "application/json"
        }
    });
    if (response.status === 201)
    {
        console.log("Subscribed to push notifications");
    }
}
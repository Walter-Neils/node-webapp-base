const VAPIDPublicKey = 'BC4SlFNAvXbsEc36lDbRkWK3wGXHB084PTb2FupK_wnOKCf0IdrvGoiscUgABXe_gYxavpnq4O5sFPVoAPy0-C4';

self.addEventListener('push',
    function (event) {
        const incoming = event.data.json();
        const title = incoming.title;
        const options = incoming;
        event.waitUntil(self.registration.showNotification(title, options));
    }
);

self.addEventListener('notificationclick',
    function (event) {
        event.notification.close();
        event.waitUntil(
            clients.openWindow('http://localhost:5000/')
        );
    }
);

self.addEventListener('install', function (event) {
    console.log('[Service Worker] Installing Service Worker ...', event);
}
);
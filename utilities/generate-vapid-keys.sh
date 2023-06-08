#!/bin/bash

function echoerr() { echo "$@" 1>&2; }
function silent_exec() { "$@" >/dev/null 2>&1; }

KEYGEN_RESULT=$(../server/node_modules/.bin/web-push generate-vapid-keys)

if [ $? -ne 0 ]; then
    echoerr "Failed to generate VAPID keys"
    exit 1
fi

#
#=======================================
#
#Public Key:
#BGyos-ixSfeDquYXQwf5vcTS750alJmSb2eQBIFL6cT8-b35r_-VtM768esUAGq5DtRzroCvBNmzDZDUwHRp9aw
#
#Private Key:
#1367rUrWoKV_yTJ8FCg76r6sdQf70JKMIPo-YTSJdz8
#
#=======================================
#
#

# Public key is on line 5, private key is on line 8
PUBLIC_KEY=$(echo "$KEYGEN_RESULT" | head -n 5 | tail -n 1 | cut -d ':' -f 2 | sed 's/ //g')
PRIVATE_KEY=$(echo "$KEYGEN_RESULT" | head -n 8 | tail -n 1 | cut -d ':' -f 2 | sed 's/ //g')

NOTIFICATION_SERVICE_WORKER_PATH="../frontend/public/notificationServiceWorker.js"

# Replace the first line of the notification service worker with 'const VAPIDPublicKey = <PUBLIC_KEY>'
sed -i "1s/.*/const VAPIDPublicKey = '$PUBLIC_KEY';/" $NOTIFICATION_SERVICE_WORKER_PATH

# If this failed, stop here
if [ $? -ne 0 ]; then
    echoerr "Failed to update notification service worker"
    exit 1
fi

# Now for the server

# Format:
# const vapidKeys = { publicKey: "BKSqE-CjdRYXLccoOP-ORLtg40zF4FDPgmPptrINFkcYqslFxj3mtNzRTYDujUd51LK-pAR4oWannoyAZdh8ZCc", privateKey: "CVyiaTxheM83m1ywSdwmgeEDO8cAbaoqWIbbWHC6kec" };

SERVER_VAPID_KEYS_PATH="../server/src/pushNotifications.ts"

# Replace the entire line starting with 'const vapidKeys' with the new keys
sed -i "s/const vapidKeys.*/const vapidKeys = { publicKey: \"$PUBLIC_KEY\", privateKey: \"$PRIVATE_KEY\" };/" $SERVER_VAPID_KEYS_PATH

# If this failed, stop here
if [ $? -ne 0 ]; then
    echoerr "Failed to update server VAPID keys"
    exit 1
fi

echo "Successfully generated VAPID keys and updated the notification service worker and server files"
echo "Public key: $PUBLIC_KEY"
echo "Private key: $PRIVATE_KEY"

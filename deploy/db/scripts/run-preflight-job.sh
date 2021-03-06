#!/bin/bash
set -e

# Step 1 - Set the lock file on the shared volume
echo "Adding $UPGRADE_LOCK_FILENAME file to the shared upgrade volume $UPGRADE_VOLUME."
touch /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME
chmod 440 /$UPGRADE_VOLUME/$UPGRADE_LOCK_FILENAME

echo "Created the upgrade lock file."

# Step 2 - Create an AES-256 compliant encryption key
# in a file on a shared volume.
echo "Checking to see if we need to generate the encryption key $ENCRYPTION_KEY_FILENAME file:"
if [ ! -e /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME ]; then
  echo "-- Adding $ENCRYPTION_KEY_FILENAME file to the shared volume $ENCRYPTION_KEY_VOLUME."
  keyfile=$(openssl enc -aes-256-cbc -k secret -P -md sha1 | grep key | cut -d '=' -f2)
  printf "%s" "$keyfile" > /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME
  chmod 440 /$ENCRYPTION_KEY_VOLUME/$ENCRYPTION_KEY_FILENAME
  echo "-- Done."
fi

# Step 3 - Write out or generate SSL certificate data
if [ "${CONSOLE_CERT:-not-set}" = "not-set" -a "${CONSOLE_CERT_KEY:-not-set}" = "not-set" ]; then
  echo "CONSOLE_CERT and CONSOLE_CERT_KEY not set, generating..."
  export CERTS_PATH=/$ENCRYPTION_KEY_VOLUME
  export DEV_CERTS_DOMAIN=console
  /generate_cert.sh
  echo "Certificates generated."
else
  echo "CONSOLE_CERT and CONSOLE_CERT_KEY have been provided, writing them to the Encryption volume"
  echo "$CONSOLE_CERT" > /$ENCRYPTION_KEY_VOLUME/console.crt 
  echo "$CONSOLE_CERT_KEY" > /$ENCRYPTION_KEY_VOLUME/console.key 
  echo "Wrote out certificates."
fi

exit 0

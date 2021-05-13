openssl req \
 -newkey rsa:2048 \
 -nodes \
 -keyout private_key.pem \
 -x509 \
 -days 365 \
 -out certificate.pem \
 -subj "/CN=Delegated Authentication Demo/O=SFDC/C=DK"

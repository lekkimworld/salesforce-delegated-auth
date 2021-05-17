# salesforce-delegated-auth

Proof-of-concept Heroku app for a Salesforce Delegated Authentication webservice endpoint that verifies a username / password set by Salesforce. Once verified it also supports setting the received password back on the user in Salesforce and removing a Permission Set assignment for the user. This effectively allows you to migrate credentials from an external password store into Salesforce Identity.

A process could be as follows:

1. Migrate usernames from external credential store into Salesforce Identity as User records and associate Permission Set enabling Delegated Authentication for the user.
2. When user attempts a login the credential verification is delegated to this web service.
3. If successful the password is set back on the user in Salesforce and the Permission Set assignment removed.
4. On subsequent login the user credentials is verified by Salesforce.

## Salesforce

The project contains an example Permission Set (see `force-app/main/default/permissionsets`) enabling Delegated Authentication for a user in Salesforce.

## Heroku app Configuration

The below environment variables are used for the Heroku app.

-   `JWT_ISSUER` Client ID from Salesforce Connected App
-   `JWT_PRIVATE_KEY` PEM version of private key matching public key on the Salesforce Connected App
-   `JWT_SUBJECT` Username for the JWT
-   `JWT_AUDIENCE` (optional) URL for audience (aud) key of JWT. If omitted defaults to https://login.salesforce.com
-   `LOG_LEVEL` TRACE,DEBUG,INFO,WARN,ERROR (if omitted defaults to INFO)
-   `REMOVE_SALESFORCE_PERMSET` Developer Name of the Permission Set to remove from the user logging in
-   `SET_SALESFORCE_PASSWORD` Set password on user in Salesforce (true if set)
-   `USERNAME_<base64>` (i.e. `USERNAME_Rk9PQEVYQU1QTEUuQ09N` for john.doe@example.com)

## Generate private / public key pair for Salesforce Connected App

```
openssl req \
 -newkey rsa:2048 \
 -nodes \
 -keyout private_key.pem \
 -x509 \
 -days 365 \
 -out certificate.pem \
 -subj "/CN=Delegated Authentication Demo/O=SFDC/C=DK"
```

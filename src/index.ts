import express from "express";
import { listen as soapListen, IService, IServicePort, IServices, ISoapServiceMethod } from "soap";
import { readFileSync } from "fs";
import { join as joinPath } from "path";

// express app
const app = express();

// read wsdl
const wsdl = readFileSync(joinPath(__dirname, "..", "AuthenticationService.wsdl"), "utf-8").toString();

// define types
interface AuthenticateRequest {
    username: string;
    password: string;
    sourceIp: string;
}
interface AuthenticateResult {
    Authenticated: boolean;
}
type AuthenticationCallback = (value: AuthenticateResult) => void;

// define service
const services = {
    // service
    SforceAuthenticationService: {
        // portType
        AuthenticationService: {
            // operation
            Authenticate: (args: AuthenticateRequest, callback: AuthenticationCallback) => {
                console.log(
                    `Received authentication request - username <${args.username}> password <${args.password}> sourceIp <${args.sourceIp}>`
                );
                const pwd = process.env[`USERNAME_${args.username.toUpperCase()}`] as string | undefined;
                const result = pwd && args.password === pwd ? true : false;
                callback({
                    Authenticated: result,
                });
            },
        },
    },
} as IServices;
app.listen(process.env.PORT || 8080, () => {
    soapListen(app, "/wsdl", services, wsdl, () => {
        console.log("SOAP server initialized");
    });
});

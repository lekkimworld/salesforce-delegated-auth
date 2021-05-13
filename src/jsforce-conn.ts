import jsforce from "jsforce";
import logger from "./logger";
import jwt, { SignOptions } from "jsonwebtoken";
import fetch from "node-fetch";

export interface AccessInformation {
    accessToken: string;
    instanceUrl: string;
}
export const getAccessInformation = async (): Promise<AccessInformation> => {
    // create JWT
    logger.trace("Creating JWT");
    const payload = {
        scopes: ["refresh_token", "api"].join(" "),
    };
    const audience = process.env.JWT_AUDIENCE || "https://login.salesforce.com";
    const options = {
        algorithm: "RS256",
        issuer: process.env.JWT_ISSUER,
        audience,
        subject: process.env.JWT_SUBJECT,
        expiresIn: 3 * 60,
    } as SignOptions;
    const token = jwt.sign(payload, process.env.JWT_PRIVATE_KEY as string, options);
    logger.trace(`Created JWT (${token.substring(0, 10)}...)`);

    // exchange JWT for access token
    const res = await fetch(`${audience}/services/oauth2/token`, {
        method: "POST",
        headers: {
            "content-type": "application/x-www-form-urlencoded",
        },
        body: `grant_type= urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${token}`,
    });
    const body = await res.json();
    logger.debug(`Retrieved access_token (${body.access_token.substring(0, 10)}...)`);

    // return
    return {
        accessToken: body.access_token,
        instanceUrl: body.instance_url,
    } as AccessInformation;
};
export const setUserPassword = async (userId: string, password: string): Promise<boolean> => {
    // get access info
    const info = await getAccessInformation();

    // compose password url and post password
    const passwordUrl = `${info.instanceUrl}/services/data/${
        process.env.API_VERSION || "v51.0"
    }/sobjects/User/${userId}/password`;
    logger.trace(`setPassword URL <${passwordUrl}>`);

    const resp = await fetch(passwordUrl, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${info.accessToken}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ NewPassword: password }, undefined, 2),
    });
    if (resp.status === 204) {
        logger.info("Response code is 204 - returning true");
        return true;
    }
    logger.debug(`Response code <${resp.status}> parsing response`);
    const respBody = await resp.json();

    logger.error(`Response body: ${JSON.stringify(respBody)}`);
    throw Error(`Error code <${respBody.errorCode}> - message: ${respBody.message}`);
};

export default async (): Promise<jsforce.Connection> => {
    // get access info
    const info = await getAccessInformation();

    // create connection and return
    const conn = new jsforce.Connection(info);
    return conn;
};

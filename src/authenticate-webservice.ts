import { IServices } from "soap";
import getConnection from "./jsforce-conn";
import { setUserPassword } from "./jsforce-conn";
import { QueryResult } from "jsforce";
import logger from "./logger";

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
interface ObjectWithId {
    Id: string;
}

/**
 *
 * @param args
 * @returns
 */
const verifyCredentials = async (args: AuthenticateRequest): Promise<boolean> => {
    const env_key = `USERNAME_${Buffer.from(args.username.toUpperCase()).toString("base64").replace(/=/g, "_")}`;
    logger.debug(`Environment key: ${env_key}`);
    const pwd = process.env[env_key] as string | undefined;
    logger.debug(`Looked up password: ${pwd}`);
    const result = pwd && args.password === pwd ? true : false;
    logger.debug(`Authentication result is: ${result}`);
    return result;
};

// define service
export default {
    // service
    SforceAuthenticationService: {
        // portType
        AuthenticationService: {
            // operation
            Authenticate: async (args: AuthenticateRequest, callback: AuthenticationCallback, headers: any) => {
                logger.debug(
                    `Received authentication request - username <${args.username}> password <${args.password.substring(
                        0,
                        3
                    )}...> sourceIp <${args.sourceIp}>`
                );
                if (headers) {
                    logger.trace(`Headers <${headers}>`);
                }

                // verify the user, callback and abort if not successful
                const result = await verifyCredentials(args);
                callback({
                    Authenticated: result,
                });
                if (!result) return;

                if (!process.env.SET_SALESFORCE_PASSWORD && !process.env.REMOVE_SALESFORCE_PERMSET) {
                    logger.debug("Do not set password or remove permission set - done");
                    return;
                }

                // get userid
                let userId;
                logger.debug("Getting Salesforce connection");
                const conn = await getConnection();
                logger.debug("Got Salesforce connection");
                const users: QueryResult<ObjectWithId> = await conn.query(
                    `SELECT Id FROM User WHERE Username='${args.username.toLowerCase()}'`
                );
                if (users.totalSize !== 1) {
                    return logger.error(`Unable to find user with usernname (${args.username.toLowerCase()})`);
                }
                userId = users.records[0].Id;
                logger.debug(`Retrieved userId <${userId}> for username <${args.username}>`);

                // remove permset
                if (process.env.REMOVE_SALESFORCE_PERMSET) {
                    logger.debug(`Querying for permission set <${process.env.REMOVE_SALESFORCE_PERMSET}>`);
                    const permsets: QueryResult<ObjectWithId> = await conn.query(
                        `SELECT Id FROM PermissionSet where Name='${process.env.REMOVE_SALESFORCE_PERMSET}'`
                    );
                    if (permsets.totalSize !== 1)
                        return logger.debug(
                            `Unable to find permission set in Salesforce (API name <${process.env.REMOVE_SALESFORCE_PERMSET}>)`
                        );
                    const permsetId = permsets.records[0].Id;
                    logger.debug(`Retrieved permsetId <${permsetId}>`);
                    logger.debug(
                        `Retrieving permission set assignments for permsetId <${permsetId}> and userId <${userId}>`
                    );
                    const permsetAssignments: QueryResult<ObjectWithId> = await conn.query(
                        `SELECT Id from PermissionSetAssignment WHERE AssigneeId='${userId}' AND PermissionSetId='${permsetId}'`
                    );
                    if (permsetAssignments.totalSize !== 1)
                        return logger.debug(`No PermissionSet assignment for user found`);
                    const permsetAssignmentId = permsetAssignments.records[0].Id;
                    logger.debug(`Deleting permset assignment <${permsetAssignmentId}>  for userId <${userId}>`);
                    await conn.del("PermissionSetAssignment", permsetAssignmentId);
                }

                // set password
                if (process.env.REMOVE_SALESFORCE_PERMSET && process.env.SET_SALESFORCE_PASSWORD) {
                    // set password
                    logger.debug(`Setting password for username <${args.username}>  with userId <${userId}>`);
                    await setUserPassword(userId, args.password);
                    logger.debug(`Done setting password for userId <${userId}>: ${result}`);
                }
            },
        },
    },
} as IServices;

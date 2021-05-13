import express, { NextFunction, Response, Request } from "express";
import { listen as soapListen } from "soap";
import { readFileSync } from "fs";
import { join as joinPath } from "path";
import services from "./authenticate-webservice";
import logger from "./logger";
import { config as dotenv_config } from "dotenv";
dotenv_config();

// read in WSDL
const wsdl = readFileSync(joinPath(__dirname, "..", "AuthenticationService.wsdl"), "utf-8").toString();

// express app
const app = express();

// listen and setup SOAP endpoint as well
app.listen(process.env.PORT || 8080, () => {
    soapListen(app, "/wsdl", services, wsdl, () => {
        console.log("SOAP server initialized");
    });
    app.use((err: Error, _req: Request, _res: Response, _next: NextFunction) => {
        logger.error(`Uncaught error caught - message: ${err.message}`);
    });
});

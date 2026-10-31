import serverless from "serverless-http";
import app from "../server.lambda.js";

export const handler = serverless(app);
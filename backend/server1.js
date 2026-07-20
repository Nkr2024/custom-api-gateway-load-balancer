import "dotenv/config";
import { createBackendServer } from "./createServer.js";

const port = process.env.SERVER_1_PORT || 5001;

createBackendServer("Server 1", port);
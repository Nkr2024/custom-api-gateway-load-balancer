import "dotenv/config";
import { createBackendServer } from "./createServer.js";

const port = process.env.SERVER_2_PORT || 5002;

createBackendServer("Server 2", port);
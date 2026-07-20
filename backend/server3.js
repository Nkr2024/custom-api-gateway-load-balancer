import "dotenv/config";
import { createBackendServer } from "./createServer.js";

const port = process.env.SERVER_3_PORT || 5003;

createBackendServer("Server 3", port);
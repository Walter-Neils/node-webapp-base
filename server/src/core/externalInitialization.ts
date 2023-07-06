import { ServerPersistentStorage } from "./database/serverPersistentStorage.js";

const log = await ServerPersistentStorage.useLogger("External Initialization");

// Add literally any code you want to run on server startup here
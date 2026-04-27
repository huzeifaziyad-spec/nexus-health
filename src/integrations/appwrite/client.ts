import { Client, Account, Databases, Storage } from 'appwrite';

const endpoint = import.meta.env.VITE_APPWRITE_ENDPOINT;
const projectId = import.meta.env.VITE_APPWRITE_PROJECT_ID;

const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId);

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);

export const APPWRITE_CONFIG = {
    databaseId: import.meta.env.VITE_APPWRITE_DATABASE_ID,
    collections: {
        profiles: import.meta.env.VITE_APPWRITE_PROFILES_COLLECTION,
        appointments: import.meta.env.VITE_APPWRITE_APPOINTMENTS_COLLECTION,
        records: import.meta.env.VITE_APPWRITE_RECORDS_COLLECTION,
        prescriptions: import.meta.env.VITE_APPWRITE_PRESCRIPTIONS_COLLECTION,
        roles: import.meta.env.VITE_APPWRITE_ROLES_COLLECTION,
        notifications: import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION || "notifications",
    }
};

export default client;

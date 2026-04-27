
import { Client, Databases } from 'appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

async function listCollections() {
    try {
        // databases.listCollections is not available in the Web SDK?
        // Actually, it might be in the Server SDK but not Web SDK unless you have permissions.
        // Let's try to just check if 'notifications' exists by trying to list documents.
        const res = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID || '',
            'notifications',
            []
        );
        console.log("Notifications collection exists!");
    } catch (error) {
        console.log("Notifications collection likely doesn't exist or no access:", error.message);
    }
}

listCollections();

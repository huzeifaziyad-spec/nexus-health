
import { Client, Databases } from 'appwrite';

declare var process: { env: { [key: string]: string | undefined } };
const getEnv = (key: string) => (process.env[key] || '');

const client = new Client()
    .setEndpoint(getEnv('VITE_APPWRITE_ENDPOINT'))
    .setProject(getEnv('VITE_APPWRITE_PROJECT_ID'));

const databases = new Databases(client);

async function listCollections() {
    try {
        // Appwrite Web SDK doesn't have listCollections (it's a server-side API)
        // But we can try to get the database info if possible? No.
        console.log("Checking database ID:", getEnv('VITE_APPWRITE_DATABASE_ID'));
        
        // We'll try to list one document from each collection in our config
        const collections = [
            'profiles',
            'user_roles',
            'appointments',
            'medical_records',
            'prescriptions'
        ];

        for (const col of collections) {
            try {
                const res = await databases.listDocuments({
                    databaseId: getEnv('VITE_APPWRITE_DATABASE_ID'),
                    collectionId: col,
                    queries: []
                });
                console.log(`Collection ${col} found. Attributes:`, Object.keys(res.documents[0] || {}).filter(k => !k.startsWith('$')));
            } catch (e: any) {
                console.log(`Collection ${col} error:`, e.message);
            }
        }
    } catch (error) {
        console.error("Error listing collections:", error);
    }
}

listCollections();

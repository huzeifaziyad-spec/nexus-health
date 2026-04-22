
import { Client, Databases } from 'appwrite';

// Fix for "red lines" when running in non-Node environments or without global types
declare var process: {
  env: {
    [key: string]: string | undefined;
  }
};

// Use a simple helper for env variables to avoid red lines in some IDEs
const getEnv = (key: string) => (process.env[key] || '');

const client = new Client()
    .setEndpoint(getEnv('VITE_APPWRITE_ENDPOINT'))
    .setProject(getEnv('VITE_APPWRITE_PROJECT_ID'));

const databases = new Databases(client);

async function checkSchema() {
    try {
        const res = await databases.listDocuments({
            databaseId: getEnv('VITE_APPWRITE_DATABASE_ID'),
            collectionId: getEnv('VITE_APPWRITE_ROLES_COLLECTION'),
            queries: []
        });
        
        if (res.documents.length > 0) {
            console.log("Found document:", JSON.stringify(res.documents[0], null, 2));
        } else {
            console.log("No documents found in roles collection.");
        }
    } catch (error) {
        console.error("Error checking schema:", error);
    }
}

checkSchema();

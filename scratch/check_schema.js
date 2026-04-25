
import { Client, Databases } from 'appwrite';
import * as dotenv from 'dotenv';
dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

async function checkSchema() {
    try {
        const databaseId = process.env.VITE_APPWRITE_DATABASE_ID || '';
        const collections = {
            profiles: process.env.VITE_APPWRITE_PROFILES_COLLECTION || '',
            appointments: process.env.VITE_APPWRITE_APPOINTMENTS_COLLECTION || '',
            records: process.env.VITE_APPWRITE_RECORDS_COLLECTION || '',
            prescriptions: process.env.VITE_APPWRITE_PRESCRIPTIONS_COLLECTION || '',
        };

        for (const [name, id] of Object.entries(collections)) {
            console.log(`--- Collection: ${name} (${id}) ---`);
            try {
                const res = await databases.listDocuments(databaseId, id, []);
                if (res.documents.length > 0) {
                    console.log('Attributes:', Object.keys(res.documents[0]).filter(k => !k.startsWith('$')));
                } else {
                    console.log('No documents found to check schema.');
                }
            } catch (e) {
                console.log(`Error: ${e.message}`);
            }
        }
    } catch (error) {
        console.error(error);
    }
}

checkSchema();

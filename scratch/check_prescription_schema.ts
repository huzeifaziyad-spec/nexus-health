
import { Client, Databases } from 'appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

async function checkPrescriptionSchema() {
    try {
        const res = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID || '',
            process.env.VITE_APPWRITE_PRESCRIPTIONS_COLLECTION || '',
            []
        );
        
        if (res.documents.length > 0) {
            console.log("Found prescription document:", JSON.stringify(res.documents[0], null, 2));
        } else {
            console.log("No prescriptions found.");
        }
    } catch (error) {
        console.error("Error checking prescription schema:", error);
    }
}

checkPrescriptionSchema();

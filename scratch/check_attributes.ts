
import { Client, Databases } from 'appwrite';
import dotenv from 'dotenv';

dotenv.config();

const client = new Client()
    .setEndpoint(process.env.VITE_APPWRITE_ENDPOINT || '')
    .setProject(process.env.VITE_APPWRITE_PROJECT_ID || '');

const databases = new Databases(client);

async function checkAttributes() {
    try {
        // We can't directly list attributes via the Web SDK easily without being an admin/server
        // But we can check multiple documents to see if any have doctorId
        const res = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID || '',
            process.env.VITE_APPWRITE_PRESCRIPTIONS_COLLECTION || '',
            []
        );
        
        console.log("Attributes in first document:", Object.keys(res.documents[0] || {}));
        
        // Also check medical records
        const resRecords = await databases.listDocuments(
            process.env.VITE_APPWRITE_DATABASE_ID || '',
            process.env.VITE_APPWRITE_RECORDS_COLLECTION || '',
            []
        );
        console.log("Attributes in first medical record:", Object.keys(resRecords.documents[0] || {}));

    } catch (error) {
        console.error("Error checking attributes:", error);
    }
}

checkAttributes();

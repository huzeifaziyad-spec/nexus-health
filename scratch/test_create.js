import { Client, Databases, ID } from "appwrite";

const client = new Client()
    .setEndpoint('https://fra.cloud.appwrite.io/v1')
    .setProject('69e8daf80018487f37c8');

const databases = new Databases(client);

async function test() {
    try {
        console.log("Attempting positional...");
        const res1 = await databases.createDocument(
            '69e8dbe2000ab0d0fc0e',
            'appointments',
            ID.unique(),
            {
                profileId: "test-patient",
                doctorId: "test-doctor",
                appointmentId: ID.unique(),
                appointmentDate: new Date().toISOString(),
                notes: "test note",
                status: "scheduled",
                appointmentType: "general"
            }
        );
        console.log("Positional worked!", res1);
    } catch(err) {
        console.error("Positional failed:", err.message);
        try {
            console.log("Attempting object...");
            const res2 = await databases.createDocument({
                databaseId: '69e8dbe2000ab0d0fc0e',
                collectionId: 'appointments',
                documentId: ID.unique(),
                data: {
                    profileId: "test-patient",
                    doctorId: "test-doctor",
                    appointmentId: ID.unique(),
                    appointmentDate: new Date().toISOString(),
                    notes: "test note",
                    status: "scheduled",
                    appointmentType: "general"
                }
            });
            console.log("Object worked!", res2);
        } catch(err2) {
            console.error("Object failed:", err2.message);
        }
    }
}
test();

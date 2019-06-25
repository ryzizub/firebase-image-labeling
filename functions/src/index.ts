import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as path from 'path';
import * as os from 'os'

const vision = require('@google-cloud/vision');
admin.initializeApp(functions.config().firebase);

export const newImage = functions.storage
    .object()
    .onFinalize((object) => {

        const fileBucket = object.bucket;
        const filePath = object.name;

        return getLabelsForImage(fileBucket, filePath)
            .then((tags) => {
                return admin.firestore().collection('images').add({
                    fileName: filePath,
                    tags: tags
                });
            });
    });

/**
 * Download image from bucket and upload it to Google Cloud Vision, from that API gets labels for that image
 * @param fileBucket name of the bucket on firebase
 * @param fileName name of the file
 */
async function getLabelsForImage(fileBucket: string, fileName: string = 'something'): Promise<string[]> {
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(fileName).download({destination: tempFilePath});

    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.labelDetection(tempFilePath);
    const labels = result.labelAnnotations;
    return labels.map((label: { description: string|null; }) => label.description);
}
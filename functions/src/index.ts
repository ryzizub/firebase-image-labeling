import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp(functions.config().firebase);

// tslint:disable-next-line: no-implicit-dependencies
import path = require('path');
import os = require('os');

const vision = require('@google-cloud/vision');


export const newCity = functions.storage
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

async function getLabelsForImage(fileBucket: string, fileName: string = 'something'): Promise<string[]> {
    const bucket = admin.storage().bucket(fileBucket);
    const tempFilePath = path.join(os.tmpdir(), fileName);
    await bucket.file(fileName).download({destination: tempFilePath});

    const client = new vision.ImageAnnotatorClient();
    const [result] = await client.labelDetection(tempFilePath);
    const labels = result.labelAnnotations;
    return labels.map((label: { description: null; }) => label.description);
}
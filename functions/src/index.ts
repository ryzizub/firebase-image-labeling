import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
admin.initializeApp(functions.config().firebase);

export const newCity = functions.storage
    .object()
    .onFinalize((object) => {
        return admin.firestore().collection('images').add({
            fileName: object.name,
            tags: []
        })
    });
    
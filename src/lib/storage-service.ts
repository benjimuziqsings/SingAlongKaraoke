
'use client';

import { FirebaseStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

/**
 * Uploads an image for an artist and returns the public URL.
 * @param storage The Firebase Storage instance.
 * @param artistId The ID of the artist.
 * @param file The image file to upload.
 * @returns A promise that resolves with the public download URL of the uploaded image.
 */
export async function uploadArtistImage(storage: FirebaseStorage, artistId: string, file: File): Promise<string> {
  if (!artistId) {
    throw new Error('Artist ID is required to upload an image.');
  }
  if (!file) {
    throw new Error('A file must be provided to upload.');
  }

  // Create a storage reference
  const imageRef = ref(storage, `artists/${artistId}/profile_image.${file.name.split('.').pop()}`);

  // 'file' comes from the Blob or File API
  const snapshot = await uploadBytes(imageRef, file);
  
  // Get the public URL
  const downloadURL = await getDownloadURL(snapshot.ref);

  return downloadURL;
}

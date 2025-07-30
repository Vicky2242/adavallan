
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, storage, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

const FileUploadSchema = z.object({
  fileTitle: z.string().min(1, 'File title is required.'),
  sortOrder: z.coerce.number(),
  imageFile: z.instanceof(File).refine(file => file.size > 0, "Image file is required."),
});

const UpdateFileUploadSchema = z.object({
  itemId: z.string(),
  fileTitle: z.string().min(1, 'File title is required.'),
  sortOrder: z.coerce.number(),
  currentImageUrl: z.string().url(),
  imageFile: z.instanceof(File).optional(),
});

async function uploadImage(file: File): Promise<string> {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    
    const storageRef = ref(storage, `file-uploads/${Date.now()}-${file.name}`);
    
    const buffer = await file.arrayBuffer();
    await uploadBytes(storageRef, buffer, { contentType: file.type });
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

export async function addFileUploadItem(formData: FormData) {
  if (firebaseInitializationError || !db) {
    return { success: false, message: "Firebase is not configured correctly." };
  }

  const validatedFields = FileUploadSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed: " + (validatedFields.error.flatten().fieldErrors.imageFile?.[0] || 'Unknown validation error') };
  }
  
  const { fileTitle, sortOrder, imageFile } = validatedFields.data;

  try {
    const imageUrl = await uploadImage(imageFile);

    await addDoc(collection(db, "fileUploads"), {
      fileTitle,
      sortOrder,
      imageUrl,
      createdAt: serverTimestamp()
    });
    
    revalidatePath('/admin/manage/file-upload');
    return { success: true, message: "File item added successfully." };
  } catch (error: any) {
    console.error("Error adding file item:", error);
    return { success: false, message: `Failed to add file item: ${error.message}` };
  }
}

export async function updateFileUploadItem(formData: FormData) {
  if (firebaseInitializationError || !db) {
    return { success: false, message: "Firebase is not configured correctly." };
  }
  
  const validatedFields = UpdateFileUploadSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return { success: false, message: "Validation failed: " + (validatedFields.error.flatten().fieldErrors.fileTitle?.[0] || 'Unknown validation error') };
  }

  const { itemId, fileTitle, sortOrder, imageFile, currentImageUrl } = validatedFields.data;

  try {
    let imageUrl = currentImageUrl;
    if (imageFile && imageFile.size > 0) {
      imageUrl = await uploadImage(imageFile);
      
      try {
        if(currentImageUrl.includes('firebasestorage.googleapis.com')) {
          const oldImageRef = ref(storage!, currentImageUrl);
          await deleteObject(oldImageRef);
        }
      } catch (deleteError: any) {
         if (deleteError.code !== 'storage/object-not-found') {
            console.warn("Could not delete old file from storage:", deleteError);
         }
      }
    }
    
    const docRef = doc(db, 'fileUploads', itemId);
    await updateDoc(docRef, {
      fileTitle,
      sortOrder,
      imageUrl,
    });

    revalidatePath('/admin/manage/file-upload');
    return { success: true, message: 'File item updated successfully.' };
  } catch (error: any) {
    console.error("Error updating file item:", error);
    return { success: false, message: `Failed to update file item: ${error.message}` };
  }
}

export async function deleteFileUploadItem(itemId: string, imageUrl: string) {
    if (firebaseInitializationError || !db || !storage) {
        return { success: false, message: "Firebase not configured." };
    }
    try {
        await deleteDoc(doc(db, 'fileUploads', itemId));

        if (imageUrl.includes('firebasestorage.googleapis.com')) {
            const fileRef = ref(storage, imageUrl);
            await deleteObject(fileRef);
        }

        revalidatePath('/admin/manage/file-upload');
        return { success: true, message: "File item and image deleted." };

    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            await deleteDoc(doc(db, 'fileUploads', itemId)).catch(e => console.error("Firestore doc delete failed after image not found", e));
            revalidatePath('/admin/manage/file-upload');
            return { success: true, message: "File item deleted (image not found in storage)." };
        }
        console.error("Error deleting file item:", error);
        return { success: false, message: `Failed to delete: ${error.message}` };
    }
}

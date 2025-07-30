
'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { db, storage, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Schema for adding a new slider item, expecting a File object from FormData
const SliderSchema = z.object({
  sliderTitle: z.string().min(1, 'Slider title is required.'),
  sortOrder: z.coerce.number(),
  imageFile: z.instanceof(File).refine(file => file.size > 0, "An image file is required."),
});

// Schema for updating an existing slider item from FormData
const UpdateSliderSchema = z.object({
  itemId: z.string(),
  sliderTitle: z.string().min(1, 'Slider title is required.'),
  sortOrder: z.coerce.number(),
  currentImageUrl: z.string().url("A valid current image URL is required."),
  imageFile: z.instanceof(File).optional(),
});

// Helper function to upload the file buffer to Firebase Storage
async function uploadImage(file: File): Promise<string> {
    if (!storage) {
        throw new Error("Firebase Storage is not initialized.");
    }
    
    // Create a unique file name for the image
    const storageRef = ref(storage, `sliders/${Date.now()}-${file.name}`);
    
    // Get the file content as an ArrayBuffer
    const buffer = await file.arrayBuffer();
    
    // Upload the buffer
    await uploadBytes(storageRef, buffer, { contentType: file.type });
    
    // Get the public download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
}

// Server Action to add a new slider item
export async function addSliderItem(formData: FormData) {
  if (firebaseInitializationError || !db) {
    return { success: false, message: "Server Error: Firebase is not configured correctly." };
  }

  const validatedFields = SliderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const errorMessages = validatedFields.error.flatten().fieldErrors;
    const message = errorMessages.imageFile?.[0] || errorMessages.sliderTitle?.[0] || 'Unknown validation error';
    return { success: false, message: `Validation failed: ${message}` };
  }
  
  const { sliderTitle, sortOrder, imageFile } = validatedFields.data;

  try {
    const imageUrl = await uploadImage(imageFile);

    await addDoc(collection(db, "sliders"), {
      sliderTitle,
      sortOrder,
      imageUrl,
      createdAt: serverTimestamp()
    });
    
    revalidatePath('/admin/manage/slider');
    revalidatePath('/ssc/home');
    return { success: true, message: "Slider item added successfully." };
  } catch (error: any) {
    console.error("Error adding slider item:", error);
    return { success: false, message: `Failed to add slider item: ${error.message}` };
  }
}

// Server Action to update an existing slider item
export async function updateSliderItem(formData: FormData) {
  if (firebaseInitializationError || !db || !storage) {
    return { success: false, message: "Server Error: Firebase is not configured correctly." };
  }
  
  const validatedFields = UpdateSliderSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    const message = validatedFields.error.flatten().fieldErrors.sliderTitle?.[0] || 'Unknown validation error';
    return { success: false, message: `Validation failed: ${message}` };
  }

  const { itemId, sliderTitle, sortOrder, imageFile, currentImageUrl } = validatedFields.data;
  let newImageUrl = currentImageUrl;
  
  try {
    // Check if a new file was uploaded
    if (imageFile && imageFile.size > 0) {
      newImageUrl = await uploadImage(imageFile);
      
      // If the new URL is different, delete the old image from storage
      if (newImageUrl !== currentImageUrl && currentImageUrl.includes('firebasestorage.googleapis.com')) {
        try {
          const oldImageRef = ref(storage, currentImageUrl);
          await deleteObject(oldImageRef);
        } catch (deleteError: any) {
           if (deleteError.code !== 'storage/object-not-found') {
              console.warn("Could not delete old file from storage, it may have been already deleted.", deleteError);
           }
        }
      }
    }
    
    const docRef = doc(db, 'sliders', itemId);
    await updateDoc(docRef, {
      sliderTitle,
      sortOrder,
      imageUrl: newImageUrl,
    });

    revalidatePath('/admin/manage/slider');
    revalidatePath('/ssc/home');
    return { success: true, message: 'Slider item updated successfully.' };
  } catch (error: any) {
    console.error("Error updating slider item:", error);
    return { success: false, message: `Failed to update slider item: ${error.message}` };
  }
}


// Server Action to delete a slider item
export async function deleteSliderItem(itemId: string, imageUrl: string) {
    if (firebaseInitializationError || !db || !storage) {
        return { success: false, message: "Server Error: Firebase not configured." };
    }
    try {
        await deleteDoc(doc(db, 'sliders', itemId));

        if (imageUrl.includes('firebasestorage.googleapis.com')) {
          const fileRef = ref(storage, imageUrl);
          await deleteObject(fileRef);
        }

        revalidatePath('/admin/manage/slider');
        revalidatePath('/ssc/home');
        return { success: true, message: "Slider item and image deleted." };

    } catch (error: any) {
        if (error.code === 'storage/object-not-found') {
            await deleteDoc(doc(db, 'sliders', itemId)).catch(e => console.error("Firestore doc delete failed after image not found", e));
            revalidatePath('/admin/manage/slider');
            revalidatePath('/ssc/home');
            return { success: true, message: "Slider item deleted (image was not found in storage)." };
        }
        console.error("Error deleting slider item:", error);
        return { success: false, message: `Failed to delete: ${error.message}` };
    }
}

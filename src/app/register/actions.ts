
'use server';

import { z } from 'zod';
import { db, firebaseInitializationError, storage } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const RegistrationFormSchema = z.object({
  participantName: z.string().min(1, { message: "Participant name is required." }),
  fatherName: z.string().optional(),
  dateOfBirth: z.string().min(1, { message: "Date of birth is required." }),
  gender: z.enum(["male", "female", "other"], { message: "Gender is required." }),
  phoneNumber: z.string().min(10, { message: "Phone number must be at least 10 digits." }),
  email: z.string().email({ message: "Invalid email address." }),
  danceSchoolName: z.string().min(1, { message: "Dance school name is required." }),
  danceTeacher: z.string().min(1, { message: "Dance teacher name is required." }),
  address: z.string().min(1, { message: "Address is required." }),
  district: z.string().min(1, { message: "City/District is required." }),
  state: z.string().min(1, { message: "State is required." }),
  postalCode: z.string().optional(),
  country: z.string().min(1, { message: "Country is required." }),
  eventId: z.string().min(1, { message: "An event must be selected."}),
  registrationTypeId: z.string().optional(),
  participationMode: z.enum(['Online', 'Offline']).optional(),
});

export type RegistrationFormState = {
  message: string;
  success: boolean;
  issues?: string[];
  fields?: Record<string, string | undefined>;
  registrationId?: string;
};

async function uploadFile(file: File, path: string): Promise<string> {
  if (!storage) {
    throw new Error("Firebase Storage is not initialized.");
  }
  const fileRef = ref(storage, path);
  await uploadBytes(fileRef, file, { contentType: file.type });
  return getDownloadURL(fileRef);
}


export async function submitIndividualRegistration(
  prevState: RegistrationFormState,
  formData: FormData
): Promise<RegistrationFormState> {

  if (firebaseInitializationError || !db || !storage) {
    return { success: false, message: "Server Error: Firebase is not configured." };
  }

  const rawData = Object.fromEntries(formData.entries());
  
  const validatedFields = RegistrationFormSchema.safeParse(rawData);

  if (!validatedFields.success) {
    console.error("Server validation failed:", validatedFields.error.flatten());
    return {
      message: "Invalid form data. Please ensure all required fields are provided.",
      success: false,
      issues: Object.values(validatedFields.error.flatten().fieldErrors).flat(),
      fields: Object.fromEntries(formData.entries()) as Record<string, string>,
    };
  }
  
  const participantId = `SSC-IND-${Date.now()}`;
  
  try {
    const photoFile = formData.get("photo") as File | null;
    const idProofFile = formData.get("idProof") as File | null;

    if (!photoFile || photoFile.size === 0) {
      return { success: false, message: "Participant photo is mandatory.", issues: ["Please upload a photo."] };
    }
    if (!idProofFile || idProofFile.size === 0) {
      return { success: false, message: "ID Proof is mandatory.", issues: ["Please upload an ID proof document."] };
    }


    let photoUrl: string | null = null;
    let idProofUrl: string | null = null;
    
    const uploadPromises: Promise<void>[] = [];

    const photoPath = `registrations/${participantId}/photo_${photoFile.name}`;
    uploadPromises.push(uploadFile(photoFile, photoPath).then(url => { photoUrl = url; }));
    
    const idProofPath = `registrations/${participantId}/idproof_${idProofFile.name}`;
    uploadPromises.push(uploadFile(idProofFile, idProofPath).then(url => { idProofUrl = url; }));
    
    await Promise.all(uploadPromises);

    const registrationDataForFirestore = {
        ...validatedFields.data,
        photoLink: photoUrl,
        idProofLink: idProofUrl,
        participantId,
        paymentStatus: 'pending',
        createdAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(collection(db, "registrations"), registrationDataForFirestore);
    
    return { 
        success: true, 
        message: "Registration submitted successfully.",
        registrationId: docRef.id
    };

  } catch (error: any) {
    console.error("Error during registration submission:", error);
    const errorMessage = error.code === 'storage/unknown' 
        ? "There was a problem with the file you tried to upload. Please ensure it is a valid file type and try again."
        : error.message || "An unexpected server error occurred while processing your registration.";

    return { 
        success: false, 
        message: errorMessage,
        issues: [errorMessage] 
    };
  }
}

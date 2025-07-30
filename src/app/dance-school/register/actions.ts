
'use server';

import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, addDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';
import { DanceSchoolSchema } from './validation';
import { redirect } from 'next/navigation';

export type FormState = {
  message: string;
  success: boolean;
  issues?: string[];
  fields?: Record<string, string>;
};

export async function submitDanceSchoolRegistration(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  if (firebaseInitializationError || !db) {
    return {
      message: "Server Error: Firebase is not configured. Cannot proceed with registration.",
      success: false,
    };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  
  // Need to handle confirmPassword separately as it's not in the base schema
  const confirmPassword = rawFormData.confirmPassword;
  if (rawFormData.password !== confirmPassword) {
      return {
          message: "Passwords do not match.",
          success: false,
          issues: ["Passwords do not match."],
          fields: rawFormData as Record<string, string>,
      }
  }

  const validatedFields = DanceSchoolSchema.safeParse(rawFormData);
  if (!validatedFields.success) {
    return {
      message: "Invalid form data provided.",
      success: false,
      issues: validatedFields.error.flatten().fieldErrors.password,
      fields: rawFormData as Record<string, string>,
    };
  }
  
  const { email } = validatedFields.data;

  try {
    const schoolsCollection = collection(db, "dance-schools");
    const q = query(schoolsCollection, where("email", "==", email));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      return {
        message: "This email address is already registered.",
        success: false,
        fields: rawFormData as Record<string, string>,
      };
    }

    // IMPORTANT: Storing password in plaintext for demo. Use a secure hashing
    // library like bcrypt in production.
    await addDoc(schoolsCollection, {
        ...validatedFields.data,
        createdAt: serverTimestamp(),
    });
    
  } catch (error) {
    console.error("Error during dance school registration:", error);
    return {
      message: "An unexpected server error occurred. Please try again later.",
      success: false,
    };
  }

  redirect('/dance-school/registration-success');
}

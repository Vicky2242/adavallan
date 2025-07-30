
'use server';

import * as z from 'zod';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const DanceSchoolLoginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type DanceSchoolLoginState = {
  message: string;
  issues?: string[];
  fields?: {
    email?: string;
  };
  success: boolean;
  sessionData?: {
    schoolId: string;
    schoolName: string;
    email: string;
  };
};

export async function loginDanceSchool(
  prevState: DanceSchoolLoginState,
  formData: FormData
): Promise<DanceSchoolLoginState> {
  const email = formData.get('email');
  const password = formData.get('password');

  const validatedFields = DanceSchoolLoginSchema.safeParse({ email, password });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      issues: validatedFields.error.flatten().fieldErrors.email,
      fields: { email: typeof email === 'string' ? email : '' },
      success: false,
    };
  }

  if (firebaseInitializationError || !db) {
    return { success: false, message: "Firebase is not configured correctly. Cannot log in." };
  }

  const { email: validatedEmail, password: validatedPassword } = validatedFields.data;

  try {
    const schoolsCollection = collection(db, "dance-schools");
    const q = query(schoolsCollection, where("email", "==", validatedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid email or password." };
    }

    const schoolDoc = querySnapshot.docs[0];
    const schoolData = schoolDoc.data();

    // IMPORTANT: This is a plain text password check for demo purposes.
    // In a production app, you would use a secure hashing library (e.g., bcrypt)
    if (schoolData.password === validatedPassword) {
      return {
        message: 'Login successful!',
        success: true,
        sessionData: {
          schoolId: schoolDoc.id,
          schoolName: schoolData.danceSchoolName,
          email: schoolData.email,
        }
      };
    } else {
      return { success: false, message: "Invalid email or password." };
    }

  } catch (error) {
    console.error("Error logging in dance school:", error);
    return { success: false, message: "An unexpected error occurred during login." };
  }
}

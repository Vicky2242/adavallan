
'use server';

import * as z from 'zod';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

const AdminLoginFormSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

export type AdminLoginState = {
  message: string;
  issues?: string[];
  fields?: Record<string, string>;
  success: boolean;
};

export async function loginAdmin(
  prevState: AdminLoginState,
  formData: FormData
): Promise<AdminLoginState> {
  const email = formData.get('email');
  const password = formData.get('password');

  const validatedFields = AdminLoginFormSchema.safeParse({
    email: email,
    password: password,
  });

  if (!validatedFields.success) {
    return {
      message: 'Invalid form data.',
      issues: validatedFields.error.issues.map((issue) => issue.message),
      fields: {
        email: typeof email === 'string' ? email : '',
        password: '',
      },
      success: false,
    };
  }
  
  if (firebaseInitializationError || !db) {
    return { success: false, message: "Firebase is not configured correctly. Cannot log in." };
  }

  const { email: validatedEmail, password: validatedPassword } = validatedFields.data;

  try {
    const usersCollection = collection(db, "users");
    const q = query(usersCollection, where("email", "==", validatedEmail));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      return { success: false, message: "Invalid email or password." };
    }

    const userDoc = querySnapshot.docs[0];
    const userData = userDoc.data();

    // IMPORTANT: This is a plain text password check for demo purposes.
    // In a production app, you would use a secure hashing library (e.g., bcrypt)
    // to compare a hashed version of the password.
    if (userData.password === validatedPassword) {
      if (userData.status !== 'Active') {
        return { success: false, message: "Your account is inactive. Please contact an administrator." };
      }
      return {
        message: 'Login successful!',
        success: true,
      };
    } else {
      return { success: false, message: "Invalid email or password." };
    }

  } catch (error) {
    console.error("Error logging in admin:", error);
    return { success: false, message: "An unexpected error occurred during login." };
  }
}

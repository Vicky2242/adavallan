
'use server';

import * as z from 'zod';
import { db, firebaseInitializationError, storage } from '@/lib/firebase';
import { collection, addDoc, writeBatch, doc } from 'firebase/firestore';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';

const StudentClientSchema = z.object({
  participantName: z.string().min(1, "Participant name is required."),
  dateOfBirth: z.string().refine((val) => val && !isNaN(Date.parse(val)), { message: "Valid date of birth is required." }),
  gender: z.enum(["male", "female", "other"], { message: "Gender is required." }),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format."),
  email: z.string().email("Invalid email address."),
});

const GroupRegistrationRequestSchema = z.object({
  groupName: z.string().min(1, "Group name is required."),
  danceSchoolId: z.string().min(1, "Dance School ID is required."),
  eventId: z.string().min(1, "Event ID is required."),
  studentsDataString: z.string().min(1, "Student data is missing."),
});


export type GroupRegistrationFormState = {
  message: string;
  issues?: string[];
  success: boolean;
  groupId?: string;
};

// Helper to upload a file to Firebase Storage
async function uploadFile(file: File, path: string): Promise<string> {
    if (!storage) throw new Error("Firebase Storage is not initialized.");
    const fileRef = ref(storage, path);
    await uploadBytes(fileRef, await file.arrayBuffer(), { contentType: file.type });
    return getDownloadURL(fileRef);
}

export async function submitGroupAndStudentRegistration(
  prevState: GroupRegistrationFormState,
  formData: FormData
): Promise<GroupRegistrationFormState> {
  if (firebaseInitializationError || !db) {
    return { success: false, message: "Server Error: Firebase is not configured correctly." };
  }

  const validatedFields = GroupRegistrationRequestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
      return { success: false, message: "Server validation failed on basic fields.", issues: validatedFields.error.flatten().formErrors };
  }
  
  const { groupName, danceSchoolId, eventId, studentsDataString } = validatedFields.data;
  let students: any[];
  try {
    students = JSON.parse(studentsDataString);
  } catch (e) {
    return { success: false, message: "Failed to parse student data." };
  }

  const validatedStudents = z.array(StudentClientSchema).safeParse(students);
  if (!validatedStudents.success) {
      return { success: false, message: "Validation failed for one or more students.", issues: validatedStudents.error.flatten().formErrors };
  }

  const batch = writeBatch(db);

  try {
    const groupDocRef = doc(collection(db, "groups"));
    const groupId = groupDocRef.id;

    const groupData = {
      groupName,
      danceSchoolId,
      eventId,
      studentCount: validatedStudents.data.length,
      createdAt: new Date().toISOString(),
      paymentStatus: 'pending'
    };
    batch.set(groupDocRef, groupData);

    for (let i = 0; i < validatedStudents.data.length; i++) {
        const student = validatedStudents.data[i];
        const studentDocRef = doc(collection(db, "group_participants"));
        const participantId = `GRP-${groupId.slice(-6)}-${studentDocRef.id.slice(-4)}`;

        let photoLink: string | null = null;
        let idProofLink: string | null = null;

        const photoFile = formData.get(`student_${i}_photoFile`) as File | null;
        if (photoFile && photoFile.size > 0) {
            photoLink = await uploadFile(photoFile, `groups/${groupId}/student-${participantId}-photo`);
        }

        const idProofFile = formData.get(`student_${i}_idProofFile`) as File | null;
        if (idProofFile && idProofFile.size > 0) {
            idProofLink = await uploadFile(idProofFile, `groups/${groupId}/student-${participantId}-id`);
        }

        const studentData = {
            ...student,
            photoLink,
            idProofLink,
            groupId: groupId,
            participantId: participantId,
            addedAt: new Date().toISOString(),
            registrationStatus: 'pending_payment'
        };
        batch.set(studentDocRef, studentData);
    }

    await batch.commit();

    return {
      success: true,
      message: "Group and students registered successfully in Firestore.",
      groupId: groupId
    };

  } catch (error) {
    console.error("Error saving group registration to Firestore:", error);
    return { success: false, message: "An unexpected server error occurred while saving the registration." };
  }
}

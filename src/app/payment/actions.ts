
'use server';

import { redirect } from 'next/navigation';
import * as z from 'zod';
import { db, firebaseInitializationError } from '@/lib/firebase';
import { doc, updateDoc } from "firebase/firestore"; 
import Razorpay from 'razorpay';
import crypto from 'crypto';

const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || "rzp_test_ZpC8XAf1H4HE8q";
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || "C0LWuwVnTXsd6MMMoyVstI6W";

console.log(`Razorpay SDK Initializing with Key ID: ${RAZORPAY_KEY_ID ? RAZORPAY_KEY_ID.substring(0,12) + '...' : 'UNDEFINED'}, Key Secret: ${RAZORPAY_KEY_SECRET ? '******' : 'UNDEFINED'}`);

if (RAZORPAY_KEY_ID === "YOUR_RAZORPAY_KEY_ID" || RAZORPAY_KEY_SECRET === "YOUR_RAZORPAY_KEY_SECRET" || RAZORPAY_KEY_ID === "rzp_test_ZpC8XAf1H4HE8q") {
  console.warn("********************************************************************************************************************");
  console.warn("WARNING: Razorpay Key ID and Key Secret are using default test values or placeholder values from the code.");
  console.warn("These keys are functional for testing but should be replaced with your own live keys or specific test keys via environment variables for production or different testing environments.");
  console.warn(`Using values: Key ID starts with '${RAZORPAY_KEY_ID.substring(0,12)}...', Secret starts with '${RAZORPAY_KEY_SECRET.substring(0,8)}...'.`);
  console.warn("To use your own keys, set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET environment variables.");
  console.warn("********************************************************************************************************************");
}


let razorpay: Razorpay;
try {
  if (typeof RAZORPAY_KEY_ID !== 'string' || typeof RAZORPAY_KEY_SECRET !== 'string' || !RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    throw new Error("Razorpay Key ID or Key Secret is not a valid string or is empty. Cannot initialize Razorpay SDK.");
  }
  razorpay = new Razorpay({
    key_id: RAZORPAY_KEY_ID,
    key_secret: RAZORPAY_KEY_SECRET,
  });
  console.log("Razorpay SDK instance created successfully.");
} catch (sdkError: any) {
  console.error("CRITICAL: Failed to initialize Razorpay SDK instance:", sdkError);
  // If SDK fails to init, razorpay will be undefined, and actions will return error.
}


const PaymentInitiationSchema = z.object({
  totalAmount: z.preprocess((val) => parseInt(String(val), 10), z.number().positive("Total amount must be positive.")), 
  currency: z.string().default("INR").optional(),
  participantId: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
  groupId: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
  danceSchoolId: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
  studentCount: z.preprocess((val) => val ? parseInt(String(val), 10) : undefined, z.number().optional()),
});

export type PaymentInitiationState = {
  message?: string;
  orderId?: string;
  amount?: number; // in paise
  currency?: string;
  keyId?: string;
  error?: string;
  issues?: string[];
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string | number | boolean | undefined>;
};

export async function initiatePaymentTransaction(
  formData: FormData
): Promise<PaymentInitiationState> {
  console.log("initiatePaymentTransaction server action called.");

  if (!razorpay) {
    const errMsg = "Razorpay SDK is not initialized. Payment cannot proceed.";
    console.error(errMsg);
    return { error: errMsg };
  }
  
  if (RAZORPAY_KEY_ID === "YOUR_RAZORPAY_KEY_ID" || RAZORPAY_KEY_SECRET === "YOUR_RAZORPAY_KEY_SECRET") {
    const errMsg = "Razorpay API keys appear to be generic placeholders. Please update them or set environment variables. Payment cannot proceed.";
    console.error(errMsg);
    return { error: errMsg };
  }

  const rawFormData = Object.fromEntries(formData.entries());
  console.log("initiatePaymentTransaction: Raw form data:", rawFormData);

  const validatedFields = PaymentInitiationSchema.safeParse(rawFormData);

  if (!validatedFields.success) {
    console.error("initiatePaymentTransaction: Validation failed.", validatedFields.error.flatten());
    return {
      error: "Invalid input for payment initiation.",
      issues: validatedFields.error.issues.map((issue) => issue.message),
    };
  }

  const { 
    totalAmount, 
    participantId, 
    groupId, 
    danceSchoolId, 
    studentCount 
  } = validatedFields.data;
  
  let paymentNotes: Record<string, string | number | boolean | undefined> = {};
  let receiptIdSuffix: string;

  if (groupId) { 
    paymentNotes = { type: "group_registration", groupId, danceSchoolId, studentCount };
    receiptIdSuffix = groupId.length > 10 ? groupId.slice(-10) : groupId;
  } else if (participantId) { 
    paymentNotes = { type: "individual_registration", participantId };
    receiptIdSuffix = participantId.length > 10 ? participantId.slice(-10) : participantId;
  } else {
    return { error: "Insufficient data: Missing participantId for individual or groupId for group." };
  }
  
  const shortTimestamp = Date.now().toString().slice(-6); 
  const receiptId = `rcpt_${receiptIdSuffix}_${shortTimestamp}`;

  console.log(`initiatePaymentTransaction: Receipt ID: ${receiptId}`);
  console.log(`initiatePaymentTransaction: Final Amount (paise): ${totalAmount}`);
  console.log(`initiatePaymentTransaction: Payment Notes:`, paymentNotes);

  const options = {
    amount: totalAmount, 
    currency: "INR", 
    receipt: receiptId, 
    notes: paymentNotes
  };

  try {
    console.log("initiatePaymentTransaction: Attempting to create Razorpay order with options:", JSON.stringify(options, null, 2));
    const order = await razorpay.orders.create(options);
    console.log("initiatePaymentTransaction: Razorpay order creation API response:", JSON.stringify(order, null, 2));

    if (!order || !order.id) { 
      console.error("initiatePaymentTransaction: Razorpay order creation failed. Received null, undefined, or incomplete order object:", order);
      return { error: "Razorpay order creation failed. Received incomplete order object." };
    }

    console.log("initiatePaymentTransaction: Razorpay order created successfully:", order.id);
    return {
      orderId: order.id,
      amount: order.amount, 
      currency: order.currency,
      keyId: RAZORPAY_KEY_ID,
      message: "Order created successfully",
      notes: options.notes, 
    };
  } catch (error: any) {
    console.error("!!! initiatePaymentTransaction: Razorpay order.create EXCEPTION !!!");
    console.error("Raw error object from Razorpay SDK:", error);
    let errorMessage = "Failed to create Razorpay order.";
    if (error && error.error && error.error.description) {
      errorMessage = `Razorpay Error: ${error.error.description} (Code: ${error.error.code || 'N/A'}, Reason: ${error.error.reason || 'N/A'})`;
    } else if (error && error.message) {
      errorMessage = error.message;
    }
    return { error: errorMessage };
  }
}


const PaymentVerificationSchema = z.object({
  razorpay_payment_id: z.string(),
  razorpay_order_id: z.string(),
  razorpay_signature: z.string(),
  coupon: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
  acceptTerms: z.preprocess((val) => String(val).toLowerCase() === 'true' || String(val).toLowerCase() === 'on', z.boolean())
    .refine(val => val === true, { message: "You must accept the terms and conditions." }),
  participantId: z.string().min(1, "Associated ID (Participant or Group) is required."),
  paidAmount: z.preprocess((val) => {
    const strVal = String(val);
    if (val === null || val === undefined || strVal.trim() === "" || isNaN(parseFloat(strVal))) {
      return NaN; 
    }
    return parseFloat(strVal);
  } , z.number().positive("Paid amount must be a positive number.")),
  currency: z.string().default('INR'),
  groupId: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
  danceSchoolId: z.preprocess(val => (val === null || String(val).trim() === "" ? undefined : String(val)), z.string().optional()),
});

export type PaymentVerificationFormState = {
  message?: string;
  fields?: Record<string, string>;
  issues?: string[];
  success?: boolean;
  paymentData?: any; 
} | undefined;


export async function verifyAndSubmitPayment(
  prevState: PaymentVerificationFormState,
  formData: FormData
): Promise<PaymentVerificationFormState> {
  console.log("verifyAndSubmitPayment server action called.");

   if (!razorpay) {
    const errMsg = "Razorpay SDK is not initialized. Payment verification cannot proceed.";
    console.error(errMsg);
    return { message: errMsg, success: false };
  }
  
  if (firebaseInitializationError || !db) {
    const errMsg = "Firebase is not initialized. Payment verification cannot proceed.";
    console.error(errMsg);
    return { message: errMsg, success: false };
  }
  
  const dataToValidate = {
    razorpay_payment_id: formData.get('razorpay_payment_id'),
    razorpay_order_id: formData.get('razorpay_order_id'),
    razorpay_signature: formData.get('razorpay_signature'),
    coupon: formData.get('coupon'),
    acceptTerms: formData.get('acceptTerms'),
    participantId: formData.get('participantId'),
    paidAmount: formData.get('paidAmount'),
    currency: formData.get('currency'),
    groupId: formData.get('groupId'), 
    danceSchoolId: formData.get('danceSchoolId'),
  };
  console.log("verifyAndSubmitPayment: Data for Zod validation:", JSON.stringify(dataToValidate, null, 2));

  const validatedFields = PaymentVerificationSchema.safeParse(dataToValidate);

  if (!validatedFields.success) {
    console.error("verifyAndSubmitPayment: Zod validation failed:", validatedFields.error.flatten());
    const issues = validatedFields.error.issues.map((issue) => `${issue.path.join('.') || 'form'}: ${issue.message}`);
    return {
      message: "Payment verification data invalid. Please check the errors below.",
      issues: issues,
      fields: Object.fromEntries(formData.entries()) as Record<string, string>,
      success: false,
    };
  }
  
  const { 
    razorpay_payment_id, 
    razorpay_order_id, 
    razorpay_signature, 
    paidAmount,
    participantId: registrationDocId, // This is now the Firestore Document ID
    ...paymentFormRestData 
  } = validatedFields.data;

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', RAZORPAY_KEY_SECRET!) 
    .update(body.toString())
    .digest('hex');
  
  console.log(`verifyAndSubmitPayment: Expected Signature: ${expectedSignature}, Received Signature: ${razorpay_signature}`);

  if (expectedSignature !== razorpay_signature) {
    console.error("verifyAndSubmitPayment: Signature verification failed.");
    return {
      success: false,
      message: "Payment verification failed. Invalid signature.",
      issues: ["The payment signature is not valid. Transaction cannot be trusted."],
      fields: Object.fromEntries(formData.entries()) as Record<string, string>,
    };
  }
  
  console.log("verifyAndSubmitPayment: Signature verified successfully.");
  
  const paymentUpdateData = {
    paymentStatus: 'successful',
    orderId: razorpay_order_id,
    paymentId: razorpay_payment_id,
    paidAmount: String(paidAmount),
    paidOn: new Date().toISOString(),
    couponCode: validatedFields.data.coupon || null,
  };
  
  try {
      const registrationDocRef = doc(db, 'registrations', registrationDocId);
      await updateDoc(registrationDocRef, paymentUpdateData);
      console.log(`Successfully updated registration document ${registrationDocId} in Firestore.`);

      return {
        success: true,
        message: "Payment verified and registration updated successfully.",
        paymentData: { ...paymentUpdateData, razorpay_order_id, razorpay_payment_id } // Return full data for client if needed
      };

  } catch (error) {
      console.error(`Error updating registration document ${registrationDocId} in Firestore:`, error);
      return {
          success: false,
          message: "Payment verified, but failed to update registration status in the database.",
          issues: ["A server error occurred while finalizing your registration."],
      }
  }
}


import * as z from 'zod';

export const DanceSchoolSchema = z.object({
  danceSchoolName: z.string().min(1, "Dance school name is required."),
  danceTeacherName: z.string().min(1, "Dance teacher name is required."),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits.").regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format."),
  email: z.string().email("Invalid email address."),
  address: z.string().min(1, "Street address is required."),
  district: z.string().min(1, "District is required."),
  state: z.string().min(1, "State is required."),
  country: z.string().min(1, "Country is required."),
  postalCode: z.string().optional(),
  password: z.string().min(8, "Password must be at least 8 characters long."),
}).refine(data => data.password.length > 0, {
  message: "Password cannot be empty.",
  path: ["password"],
});

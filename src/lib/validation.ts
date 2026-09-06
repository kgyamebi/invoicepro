import { z } from "zod";
import { DOCUMENT_TYPES } from "./documents/types";

export const registerSchema = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(72),
  countryCode: z.string().min(2).max(2).optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const businessSchema = z.object({
  name: z.string().min(2).max(160),
  countryCode: z.string().min(2).max(2),
  currencyCode: z.string().min(3).max(3),
  businessType: z.string().min(2),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  website: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  postalCode: z.string().optional(),
  taxId: z.string().optional(),
  preferredTemplate: z.string().optional(),
  invoicePrefix: z.string().optional(),
  quotationPrefix: z.string().optional(),
  receiptPrefix: z.string().optional(),
  defaultNotes: z.string().optional(),
  defaultTerms: z.string().optional(),
  paymentInstructions: z.string().optional(),
  reduceStockOn: z.string().optional(),
});

export const customerSchema = z.object({
  name: z.string().min(1).max(160),
  company: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
  addressLine1: z.string().optional(),
  city: z.string().optional(),
  countryCode: z.string().optional(),
  taxId: z.string().optional(),
  notes: z.string().optional(),
});

export const productSchema = z.object({
  name: z.string().min(1).max(160),
  sku: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  kind: z.enum(["PRODUCT", "SERVICE"]).optional(),
  unit: z.string().optional(),
  sellingPrice: z.string(),
  costPrice: z.string().optional(),
  trackStock: z.boolean().optional(),
  stockQuantity: z.string().optional(),
  lowStockThreshold: z.string().optional(),
  constructionCategory: z.string().optional(),
});

export const itemSchema = z.object({
  productId: z.string().optional(),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().optional(),
  quantity: z.union([z.string(), z.number()]),
  unit: z.string().optional(),
  unitPrice: z.union([z.string(), z.number()]),
  discountType: z.enum(["NONE", "PERCENT", "FIXED"]).optional(),
  discountValue: z.union([z.string(), z.number()]).optional(),
  taxName: z.string().optional(),
  taxRate: z.union([z.string(), z.number()]).optional(),
  taxInclusive: z.boolean().optional(),
});

export const documentSchema = z.object({
  type: z.enum(DOCUMENT_TYPES),
  customerId: z.string().optional(),
  issueDate: z.string().optional(),
  dueDate: z.string().optional(),
  expiryDate: z.string().optional(),
  number: z.string().optional(),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentTerms: z.string().optional(),
  templateKey: z.string().optional(),
  documentDiscountType: z.enum(["NONE", "PERCENT", "FIXED"]).optional(),
  documentDiscountValue: z.union([z.string(), z.number()]).optional(),
  shippingAmount: z.union([z.string(), z.number()]).optional(),
  otherChargesAmount: z.union([z.string(), z.number()]).optional(),
  items: z.array(itemSchema).min(1),
});

export const paymentSchema = z.object({
  amount: z.string(),
  paidAt: z.string().optional(),
  method: z.enum(["CASH", "BANK_TRANSFER", "MOBILE_MONEY", "CARD", "CHEQUE", "OTHER"]),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

/** HTML form field order expected by SePay checkout/init. */
export const SEPAY_FORM_FIELD_ORDER = [
  'merchant',
  'currency',
  'order_amount',
  'operation',
  'order_description',
  'order_invoice_number',
  'customer_id',
  'payment_method',
  'success_url',
  'error_url',
  'cancel_url',
  'signature',
] as const;

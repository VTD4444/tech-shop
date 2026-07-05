import { SEPAY_FORM_FIELD_ORDER } from '~/utils/sepay-fields';

export function useSePayCheckout() {
  const { $api } = useNuxtApp();

  async function redirectToSePay(orderId: string) {
    const res: any = await $api(`/payments/sepay/init?orderId=${orderId}`, {
      method: 'POST',
    });
    const actionUrl = res.data?.actionUrl as string | undefined;
    const fields = res.data?.fields as Record<string, string> | undefined;
    const invoiceNumber = res.data?.invoiceNumber as string | undefined;

    if (!actionUrl || !fields) {
      throw new Error('Không có dữ liệu thanh toán SePay');
    }

    if (invoiceNumber) {
      sessionStorage.setItem('sepay_pending_invoice', invoiceNumber);
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;
    form.style.display = 'none';

    for (const name of SEPAY_FORM_FIELD_ORDER) {
      const value = fields[name];
      if (value == null) continue;
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value;
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  return { redirectToSePay };
}

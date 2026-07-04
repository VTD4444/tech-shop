export function useSePayCheckout() {
  const { $api } = useNuxtApp();

  async function redirectToSePay(orderId: string) {
    const res: any = await $api(`/payments/sepay/init?orderId=${orderId}`, {
      method: 'POST',
    });
    const actionUrl = res.data?.actionUrl as string | undefined;
    const fields = res.data?.fields as Record<string, string> | undefined;

    if (!actionUrl || !fields) {
      throw new Error('Không có dữ liệu thanh toán SePay');
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = actionUrl;
    form.style.display = 'none';

    for (const [name, value] of Object.entries(fields)) {
      const input = document.createElement('input');
      input.type = 'hidden';
      input.name = name;
      input.value = value ?? '';
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }

  return { redirectToSePay };
}

export function useCloudinaryUpload() {
  const uploading = ref(false);
  const error = ref<string | null>(null);

  async function uploadFile(file: File): Promise<string> {
    uploading.value = true;
    error.value = null;
    try {
      const { $api } = useNuxtApp();
      const sign: any = await $api('/admin/uploads/sign', { method: 'POST' });
      const data = sign.data || sign;
      const form = new FormData();
      form.append('file', file);
      form.append('api_key', data.apiKey);
      form.append('timestamp', String(data.timestamp));
      form.append('signature', data.signature);
      form.append('folder', data.folder);

      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${data.cloudName}/image/upload`,
        { method: 'POST', body: form },
      );
      if (!res.ok) throw new Error('Cloudinary upload failed');
      const json = await res.json();
      return json.secure_url as string;
    } catch (e: any) {
      error.value = e.message || 'Upload failed';
      throw e;
    } finally {
      uploading.value = false;
    }
  }

  return { uploading, error, uploadFile };
}

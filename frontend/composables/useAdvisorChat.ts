export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const STORAGE_KEY = 'techshop-advisor-chat';

const AI_OFFLINE_MSG =
  'AI service is not running. Start it with: cd ai-service && uvicorn app.main:app --reload --port 8000';

function parseSseEvents(buffer: string): { events: string[]; rest: string } {
  const events: string[] = [];
  let rest = buffer;
  let idx = rest.indexOf('\n\n');
  while (idx !== -1) {
    events.push(rest.slice(0, idx));
    rest = rest.slice(idx + 2);
    idx = rest.indexOf('\n\n');
  }
  return { events, rest };
}

function applySseEvent(
  block: string,
  assistantIndex: number,
  messages: Ref<ChatMessage[]>,
): string | null {
  for (const line of block.split('\n')) {
    if (!line.startsWith('data: ')) continue;
    const payload = JSON.parse(line.slice(6));
    if (payload.error) return payload.error as string;
    if (payload.token) {
      messages.value[assistantIndex].content += payload.token;
    }
  }
  return null;
}

function resolveAiBaseUrl(config: ReturnType<typeof useRuntimeConfig>) {
  const raw = config.public.aiApiUrl || '/api/ai';
  if (raw.startsWith('/')) {
    if (import.meta.client) return `${window.location.origin}${raw}`.replace(/\/$/, '');
    return raw.replace(/\/$/, '');
  }
  return raw.replace(/\/$/, '');
}

export function useAdvisorChat() {
  const config = useRuntimeConfig();
  const messages = ref<ChatMessage[]>([]);
  const loading = ref(false);
  const error = ref('');

  function loadHistory() {
    if (!import.meta.client) return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) messages.value = JSON.parse(raw);
    } catch {
      messages.value = [];
    }
  }

  function saveHistory() {
    if (!import.meta.client) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages.value.slice(-50)));
  }

  function clearHistory() {
    messages.value = [];
    if (import.meta.client) localStorage.removeItem(STORAGE_KEY);
  }

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading.value) return;

    error.value = '';
    loading.value = true;
    messages.value.push({ role: 'user', content: trimmed });
    saveHistory();

    const assistantIndex = messages.value.length;
    messages.value.push({ role: 'assistant', content: '' });

    const history = messages.value
      .slice(0, -1)
      .filter((m) => m.content)
      .map((m) => ({ role: m.role, content: m.content }));

    try {
      let ok = false;
      try {
        ok = await tryStreamChat(trimmed, history, assistantIndex);
      } catch {
        ok = false;
      }
      if (!ok) {
        await fallbackChat(trimmed, history, assistantIndex);
      }
    } catch (e: any) {
      const msg = e?.message || '';
      if (msg.includes('Failed to fetch') || msg.includes('fetch')) {
        error.value = AI_OFFLINE_MSG;
      } else {
        error.value = msg || 'Chat failed';
      }
      messages.value.splice(assistantIndex, 1);
    } finally {
      loading.value = false;
      saveHistory();
    }
  }

  async function tryStreamChat(
    message: string,
    history: { role: string; content: string }[],
    assistantIndex: number,
  ): Promise<boolean> {
    const baseUrl = resolveAiBaseUrl(config);

    let res: Response;
    try {
      res = await fetch(`${baseUrl}/advisor/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, history }),
      });
    } catch {
      return false;
    }

    if (!res.ok || !res.body) return false;

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    let streamError: string | null = null;

    const processEvents = (events: string[]) => {
      for (const block of events) {
        try {
          const err = applySseEvent(block, assistantIndex, messages);
          if (err) {
            streamError = err;
            return;
          }
        } catch {
          /* wait for complete SSE block */
        }
      }
    };

    while (true) {
      const { done, value } = await reader.read();
      if (value) {
        buffer += decoder.decode(value, { stream: true });
        const parsed = parseSseEvents(buffer);
        buffer = parsed.rest;
        processEvents(parsed.events);
        if (streamError) break;
      }
      if (done) {
        buffer += decoder.decode();
        const parsed = parseSseEvents(buffer);
        processEvents(parsed.events);
        if (parsed.rest.trim()) {
          try {
            const err = applySseEvent(parsed.rest, assistantIndex, messages);
            if (err) streamError = err;
          } catch {
            /* ignore trailing partial */
          }
        }
        break;
      }
    }

    if (streamError) throw new Error(streamError);

    const content = messages.value[assistantIndex].content;
    if (!content) return false;

    // If stream ended mid-sentence, fetch full reply and replace
    if (looksTruncated(content)) {
      await fallbackChat(message, history, assistantIndex);
    }

    return true;
  }

  function looksTruncated(text: string): boolean {
    const trimmed = text.trimEnd();
    if (trimmed.length < 80) return false;
    const boldMarkers = (trimmed.match(/\*\*/g) || []).length;
    if (boldMarkers % 2 !== 0) return true;
    return !/[.!?…)"'\]]$/.test(trimmed) && !trimmed.endsWith('```');
  }

  async function fallbackChat(
    message: string,
    history: { role: string; content: string }[],
    assistantIndex: number,
  ) {
    try {
      const { $aiApi } = useNuxtApp();
      const res: any = await $aiApi('/advisor/chat', {
        method: 'POST',
        body: { message, history },
      });
      messages.value[assistantIndex].content = res.data?.reply || 'No response';
    } catch (e: any) {
      const status = e?.status || e?.statusCode;
      if (status === 502 || status === 503 || e?.message?.includes('fetch')) {
        throw new Error(AI_OFFLINE_MSG);
      }
      throw e;
    }
  }

  onMounted(loadHistory);

  return {
    messages,
    loading,
    error,
    sendMessage,
    clearHistory,
    loadHistory,
  };
}

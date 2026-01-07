export function subscribeUsersSSE(
  onData: (users: any[]) => void,
  onError?: (err: any) => void
) {
  const evt = new EventSource(
    `${import.meta.env.VITE_API_URL}/users/stream`
  );

  evt.onmessage = (e) => {
    try {
      const users = JSON.parse(e.data);
      onData(users);
    } catch (err) {
      console.error("SSE parse error", err);
    }
  };

  evt.onerror = (err) => {
    console.error("SSE error", err);
    onError?.(err);
    evt.close();
  };

  return () => evt.close(); // unsubscribe
}

// [Overlay Asmaro] PUBG RTS Stream Synchronizer
const socket = new WebSocket("wss://stream-events.overlayasmaro.local:8080");

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);
  if (data.type === 'PUBG_KILL' || data.type === 'DONATION') {
    window.trigger3DAlert({
      title: data.player + " DESTROYED ENEMY!",
      kills: data.kills,
      tier: "MYTHIC_GLASS"
    });
  }
};
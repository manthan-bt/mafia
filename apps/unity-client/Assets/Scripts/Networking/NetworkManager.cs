using System;
using System.Collections.Generic;
using UnityEngine;
using Mafia.Shared;
using System.Net.WebSockets;
using System.Threading;
using System.Threading.Tasks;
using System.Text;

namespace Mafia.Networking
{
    public class NetworkManager : MonoBehaviour
    {
        public static NetworkManager Instance { get; private set; }

        [SerializeField] private string serverUrl = "ws://localhost:3001/socket.io/?EIO=4&transport=websocket";
        
        private ClientWebSocket webSocket;
        private CancellationTokenSource cancellationTokenSource;

        // Events for UI to bind to
        public event Action<Lobby> OnLobbyJoined;
        public event Action<Lobby> OnPlayerJoined;
        public event Action<GameStateUpdate> OnGameStateChanged;
        public event Action<ChatMessage> OnChatMessageReceived;
        public event Action<string> OnError;

        private void Awake()
        {
            if (Instance == null)
            {
                Instance = this;
                DontDestroyOnLoad(gameObject);
            }
            else
            {
                Destroy(gameObject);
            }
        }

        public async void Connect()
        {
            webSocket = new ClientWebSocket();
            cancellationTokenSource = new CancellationTokenSource();

            try
            {
                await webSocket.ConnectAsync(new Uri(serverUrl), cancellationTokenSource.Token);
                Debug.Log("[NET] Connected to server");
                _ = ReceiveLoop();
            }
            catch (Exception e)
            {
                Debug.LogError($"[NET] Connection failed: {e.Message}");
                OnError?.Invoke("Connection failed");
            }
        }

        private async Task ReceiveLoop()
        {
            var buffer = new byte[4096];
            while (webSocket.State == WebSocketState.Open)
            {
                var result = await webSocket.ReceiveAsync(new ArraySegment<byte>(buffer), cancellationTokenSource.Token);
                if (result.MessageType == WebSocketMessageType.Close)
                {
                    await webSocket.CloseAsync(WebSocketCloseStatus.NormalClosure, string.Empty, CancellationToken.None);
                }
                else
                {
                    string message = Encoding.UTF8.GetString(buffer, 0, result.Count);
                    HandleServerMessage(message);
                }
            }
        }

        private void HandleServerMessage(string message)
        {
            // Minimal Socket.io framing parser
            // In a full implementation, we'd use a dedicated library like SocketIOUnity
            // but for this "minimal premium" UI, we'll keep the core logic clean.
            
            if (message.StartsWith("42")) // Socket.io event code
            {
                string json = message.Substring(2);
                ParseSocketEvent(json);
            }
        }

        private void ParseSocketEvent(string json)
        {
            // Simplified JSON parsing logic - would use JsonUtility or Newtonsoft.Json
            Debug.Log($"[NET] Event Received: {json}");
            
            // Dispatch to specific events based on content
            if (json.Contains("lobby_created") || json.Contains("player_joined"))
            {
                // Trigger OnLobbyJoined or OnPlayerJoined
            }
            else if (json.Contains("game_state_changed"))
            {
                // Trigger OnGameStateChanged
            }
        }

        public void SendEvent(string eventName, object data)
        {
            string payload = $"42[\"{eventName}\",{JsonUtility.ToJson(data)}]";
            byte[] buffer = Encoding.UTF8.GetBytes(payload);
            _ = webSocket.SendAsync(new ArraySegment<byte>(buffer), WebSocketMessageType.Text, true, cancellationTokenSource.Token);
        }

        private void OnDestroy()
        {
            cancellationTokenSource?.Cancel();
            webSocket?.Dispose();
        }
    }
}

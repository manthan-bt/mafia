using UnityEngine;
using UnityEngine.UIElements;
using Mafia.Networking;
using Mafia.Shared;
using System.Collections.Generic;

namespace Mafia.UI
{
    public class LobbyController : MonoBehaviour
    {
        private VisualElement root;
        private Label lobbyCodeLabel;
        private Label playerCountLabel;
        private ScrollView playerList;
        private Button startMissionBtn;
        private Button leaveLobbyBtn;

        private void OnEnable()
        {
            root = GetComponent<UIDocument>().rootVisualElement;

            lobbyCodeLabel = root.Q<Label>("lobbyCodeLabel");
            playerCountLabel = root.Q<Label>("playerCountLabel");
            playerList = root.Q<ScrollView>("playerList");
            startMissionBtn = root.Q<Button>("startMissionBtn");
            leaveLobbyBtn = root.Q<Button>("leaveLobbyBtn");

            startMissionBtn.clicked += OnStartMission;
            leaveLobbyBtn.clicked += OnLeaveLobby;

            NetworkManager.Instance.OnPlayerJoined += RefreshLobby;
            NetworkManager.Instance.OnLobbyJoined += RefreshLobby;
        }

        private void RefreshLobby(Lobby lobby)
        {
            lobbyCodeLabel.text = lobby.code;
            playerCountLabel.text = $"{lobby.players.Count}/12 OPERATIVES";
            
            playerList.Clear();
            foreach (var player in lobby.players)
            {
                var pElement = new VisualElement();
                pElement.style.flexDirection = FlexDirection.Row;
                pElement.style.justifyContent = Justify.SpaceBetween;
                pElement.style.paddingBottom = 8;
                pElement.style.marginBottom = 8;
                pElement.style.borderBottomWidth = 1;
                pElement.style.borderBottomColor = new Color(1, 1, 1, 0.05f);

                var nameLabel = new Label(player.name.ToUpper());
                nameLabel.style.color = player.isHost ? new Color(0, 0.82f, 1f) : Color.white;
                nameLabel.style.fontSize = 14;
                nameLabel.style.unityFontStyleAndWeight = FontStyle.Bold;

                var statusLabel = new Label(player.isHost ? "[COMMANDER]" : "[OPERATIVE]");
                statusLabel.style.fontSize = 10;
                statusLabel.style.color = new Color(1, 1, 1, 0.4f);

                pElement.Add(nameLabel);
                pElement.Add(statusLabel);
                playerList.Add(pElement);
            }

            // Show start button only for host and min players
            bool isHost = lobby.players.Exists(p => p.id == NetworkManager.Instance.LocalPlayerId && p.isHost);
            startMissionBtn.style.display = isHost && lobby.players.Count >= 6 ? DisplayStyle.Flex : DisplayStyle.None;
        }

        private void OnStartMission()
        {
            NetworkManager.Instance.SendEvent("start_game", new { code = lobbyCodeLabel.text });
        }

        private void OnLeaveLobby()
        {
            NetworkManager.Instance.SendEvent("leave_lobby", new { code = lobbyCodeLabel.text });
            // Logic to go back to login would go here
        }
    }
}

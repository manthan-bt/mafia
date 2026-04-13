using UnityEngine;
using UnityEngine.UIElements;
using Mafia.Networking;
using Mafia.Shared;
using System.Collections.Generic;

namespace Mafia.UI
{
    public class GameController : MonoBehaviour
    {
        private VisualElement root;
        private Label phaseLabel;
        private Label timerLabel;
        private Label roleLabel;
        private Label statusLabel;
        private ScrollView gamePlayerList;
        private ScrollView missionLog;
        private ScrollView chatContainer;
        private TextField chatInput;
        private VisualElement actionContainer;

        private GameState currentState;
        private Role myRole;

        private void OnEnable()
        {
            root = GetComponent<UIDocument>().rootVisualElement;

            phaseLabel = root.Q<Label>("phaseLabel");
            timerLabel = root.Q<Label>("timerLabel");
            roleLabel = root.Q<Label>("roleLabel");
            statusLabel = root.Q<Label>("statusLabel");
            gamePlayerList = root.Q<ScrollView>("gamePlayerList");
            missionLog = root.Q<ScrollView>("missionLog");
            chatContainer = root.Q<ScrollView>("chatContainer");
            chatInput = root.Q<TextField>("chatInput");
            actionContainer = root.Q<VisualElement>("actionContainer");

            chatInput.RegisterCallback<KeyDownEvent>(OnChatKeyDown);
            
            NetworkManager.Instance.OnGameStateChanged += HandleGameStateUpdate;
            NetworkManager.Instance.OnChatMessageReceived += HandleChatMessage;
        }

        private void OnChatKeyDown(KeyDownEvent evt)
        {
            if (evt.keyCode == KeyCode.Return && !string.IsNullOrEmpty(chatInput.value))
            {
                NetworkManager.Instance.SendEvent("send_message", new { 
                    content = chatInput.value,
                    sender = "USER" // Server will assign actual name
                });
                chatInput.value = "";
            }
        }

        private void HandleGameStateUpdate(GameStateUpdate update)
        {
            currentState = update.gameState;
            phaseLabel.text = $"STATUS: {update.gameState.ToString().Replace("_", " ")}";
            
            if (update.yourRole != myRole) {
                myRole = update.yourRole;
                roleLabel.text = $"ROLE: {myRole.ToString()}";
            }

            UpdatePlayerList(update.players);
            UpdateActionUI(update.players);
            LogMissionMessage($"Phase shifted to {update.gameState}");
        }

        private void UpdatePlayerList(List<Player> players)
        {
            gamePlayerList.Clear();
            foreach (var p in players)
            {
                var row = new VisualElement();
                row.style.flexDirection = FlexDirection.Row;
                row.style.paddingBottom = 4;
                row.style.marginBottom = 4;
                row.style.borderBottomWidth = 1;
                row.style.borderBottomColor = new Color(1,1,1,0.05f);

                var dot = new VisualElement();
                dot.style.width = 10;
                dot.style.height = 10;
                dot.style.borderRadius = 5;
                dot.style.backgroundColor = p.isAlive ? new Color(0, 1, 0.5f) : Color.red;
                dot.style.marginRight = 10;
                dot.style.marginTop = 4;

                var nameLabel = new Label(p.name.ToUpper());
                nameLabel.style.color = p.isAlive ? Color.white : new Color(1,1,1,0.3f);
                if (!p.isAlive) nameLabel.style.unityFontStyleAndWeight = FontStyle.Italic;

                row.Add(dot);
                row.Add(nameLabel);
                gamePlayerList.Add(row);
            }
        }

        private void UpdateActionUI(List<Player> players)
        {
            actionContainer.Clear();
            actionContainer.style.display = DisplayStyle.None;

            if (currentState == GameState.NIGHT_PHASE && myRole != Role.VILLAGER)
            {
                actionContainer.style.display = DisplayStyle.Flex;
                foreach (var p in players)
                {
                    if (p.isAlive && p.id != NetworkManager.Instance.LocalPlayerId)
                    {
                        var btn = new Button(() => SubmitNightAction(p.id));
                        btn.text = GetActionVerb() + " " + p.name.ToUpper();
                        btn.AddToClassList("premium-button");
                        btn.style.fontSize = 10;
                        actionContainer.Add(btn);
                    }
                }
            }
            else if (currentState == GameState.VOTING_PHASE)
            {
                actionContainer.style.display = DisplayStyle.Flex;
                // Voting buttons logic...
            }
        }

        private string GetActionVerb()
        {
            return myRole switch {
                Role.MAFIA => "ELIMINATE",
                Role.DOCTOR => "PROTECT",
                Role.POLICE => "INVESTIGATE",
                _ => "SELECT"
            };
        }

        private void SubmitNightAction(string targetId)
        {
            string type = myRole switch {
                Role.MAFIA => "KILL",
                Role.DOCTOR => "SAVE",
                Role.POLICE => "INVESTIGATE",
                _ => "VOTE"
            };
            
            NetworkManager.Instance.SendEvent("submit_action", new { 
                action = new PlayerAction { targetId = targetId, actionType = type }
            });
            actionContainer.style.display = DisplayStyle.None;
            LogMissionMessage($"Action transmitted: {type} targeted at {targetId}");
        }

        private void HandleChatMessage(ChatMessage msg)
        {
            var msgLabel = new Label();
            if (msg.isSystem) {
                msgLabel.text = $"[SYS] {msg.content}";
                msgLabel.style.color = new Color(0, 0.82f, 1f);
            } else {
                msgLabel.text = $"{msg.sender}: {msg.content}";
                msgLabel.style.color = Color.white;
            }
            msgLabel.style.marginBottom = 5;
            msgLabel.style.whiteSpace = WhiteSpace.Normal;
            chatContainer.Add(msgLabel);
            // Auto-scroll logic...
        }

        private void LogMissionMessage(string message)
        {
            var log = new Label($"[{System.DateTime.Now:HH:mm:ss}] {message.ToUpper()}");
            log.style.color = new Color(1,1,1,0.5f);
            log.style.fontSize = 11;
            missionLog.Add(log);
        }
    }
}

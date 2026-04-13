using UnityEngine;
using UnityEngine.UIElements;
using Mafia.Networking;

namespace Mafia.UI
{
    public class LoginController : MonoBehaviour
    {
        private VisualElement root;
        private TextField playerNameInput;
        private TextField lobbyCodeInput;
        private Button createLobbyBtn;
        private Button joinLobbyBtn;
        private Label errorLabel;

        private void OnEnable()
        {
            root = GetComponent<UIDocument>().rootVisualElement;

            playerNameInput = root.Q<TextField>("playerNameInput");
            lobbyCodeInput = root.Q<TextField>("lobbyCodeInput");
            createLobbyBtn = root.Q<Button>("createLobbyBtn");
            joinLobbyBtn = root.Q<Button>("joinLobbyBtn");
            errorLabel = root.Q<Label>("errorLabel");

            createLobbyBtn.clicked += OnCreateLobby;
            joinLobbyBtn.clicked += OnJoinLobby;

            NetworkManager.Instance.OnError += (msg) => errorLabel.text = msg;
        }

        private void OnCreateLobby()
        {
            if (string.IsNullOrEmpty(playerNameInput.value)) return;

            NetworkManager.Instance.SendEvent("create_lobby", new {
                playerName = playerNameInput.value,
                code = lobbyCodeInput.value
            });
        }

        private void OnJoinLobby()
        {
            if (string.IsNullOrEmpty(playerNameInput.value) || string.IsNullOrEmpty(lobbyCodeInput.value)) return;

            NetworkManager.Instance.SendEvent("join_lobby", new {
                playerName = playerNameInput.value,
                code = lobbyCodeInput.value
            });
        }
    }
}

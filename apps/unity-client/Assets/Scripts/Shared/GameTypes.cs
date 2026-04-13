using System;
using System.Collections.Generic;

namespace Mafia.Shared
{
    [Serializable]
    public enum GameState
    {
        LOBBY,
        ROLE_REVEAL,
        NIGHT_PHASE,
        NIGHT_RESOLUTION,
        DISCUSSION_PHASE,
        VOTING_PHASE,
        ELIMINATION,
        WIN_CHECK,
        END_GAME
    }

    [Serializable]
    public enum Role
    {
        MAFIA,
        POLICE,
        DOCTOR,
        VILLAGER
    }

    [Serializable]
    public class Player
    {
        public string id;
        public string name;
        public Role role;
        public bool isAlive;
        public bool isHost;
        public string personality;
    }

    [Serializable]
    public class Lobby
    {
        public string code;
        public List<Player> players;
        public string hostId;
    }

    [Serializable]
    public class PlayerAction
    {
        public string playerId;
        public string targetId;
        public string actionType; // "KILL", "SAVE", "INVESTIGATE", "VOTE"
    }

    [Serializable]
    public class GameStateUpdate
    {
        public GameState gameState;
        public List<Player> players;
        public Role yourRole;
        public string encryptionKey;
    }

    [Serializable]
    public class ChatMessage
    {
        public string sender;
        public string senderId;
        public string content;
        public bool isSystem;
        public bool isBot;
    }
}

using Microsoft.AspNetCore.SignalR;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace WebChatServer.Hubs
{
    public class ChatHub : Hub
    {
        private static Dictionary<string, string> connectedClients = new Dictionary<string, string>();
        private static List<(string user, string message, DateTime timestamp)> messages = new List<(string, string, DateTime)>();

        // This method will send notification to all clients
        public async Task SendMessage(string user, string message)
        {
            messages.Add((user, message, DateTime.Now));  // Store the message
            await Clients.All.SendAsync("ReceiveMessage", user, message);
        }

        public async Task JoinChat(string user, string message)
        {
            connectedClients[Context.ConnectionId] = user;
            await Clients.Others.SendAsync("ReceiveMessage", user, message);
        }

        private async Task LeaveChat()
        {
            if (connectedClients.TryGetValue(Context.ConnectionId, out string user))
            {
                var message = $"{user} left the chat";
                await Clients.Others.SendAsync("ReceiveMessage", user, message);
            }
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            await LeaveChat();
            await base.OnDisconnectedAsync(exception);
        }

        // Search messages by user
        public Task<IEnumerable<string>> SearchMessagesByUser(string searchUser)
        {
            var userMessages = messages
                .Where(m => m.user.Equals(searchUser, StringComparison.OrdinalIgnoreCase))
                .Select(m => $"{m.timestamp}: {m.user}: {m.message}")
                .ToList();

            return Task.FromResult<IEnumerable<string>>(userMessages);
        }
    }
}

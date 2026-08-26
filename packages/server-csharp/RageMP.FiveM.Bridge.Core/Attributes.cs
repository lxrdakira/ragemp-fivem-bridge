using System;

namespace GTANetworkAPI
{
    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class RemoteEventAttribute : Attribute
    {
        public RemoteEventAttribute() { }
        public RemoteEventAttribute(string remoteEvent) => RemoteEventString = remoteEvent;
        public RemoteEventAttribute(string remoteEvent, Type castToType)
        {
            RemoteEventString = remoteEvent;
            CastToType = castToType;
        }

        public string? RemoteEventString;
        public Type? CastToType;
        public ulong NameHash;
    }

    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class ServerEventAttribute : Attribute
    {
        public ServerEventAttribute(Event eventId) => EventId = eventId;
        public Event EventId;
    }

    [AttributeUsage(AttributeTargets.Method, AllowMultiple = false)]
    public sealed class CommandAttribute : Attribute
    {
        public CommandAttribute() { }
        public CommandAttribute(string command) => CommandString = command;
        public CommandAttribute(string command, string description)
        {
            CommandString = command;
            CommandHelpText = description;
            Description = description;
        }

        public string? CommandString;
        public string? CommandHelpText;
        public bool GreedyArg { get; set; }
        public bool SensitiveInfo { get; set; }
        public bool ACLRequired { get; set; }
        public string? Alias { get; set; }
        public string? ArgumentConverter { get; set; }
        public bool Hide { get; set; }
        public string? Description { get; set; }
        public string? Group { get; set; }
    }
}

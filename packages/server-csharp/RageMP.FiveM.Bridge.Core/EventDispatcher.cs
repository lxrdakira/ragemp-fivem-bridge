using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using GTANetworkAPI;
using Newtonsoft.Json.Linq;

namespace RageMP.FiveM.Bridge
{
    public sealed class EventDispatcher
    {
        private readonly Dictionary<string, List<Handler>> _remoteEvents = new Dictionary<string, List<Handler>>(StringComparer.Ordinal);
        private readonly Dictionary<Event, List<Handler>> _serverEvents = new Dictionary<Event, List<Handler>>();
        private readonly Dictionary<string, CommandHandler> _commands = new Dictionary<string, CommandHandler>(StringComparer.OrdinalIgnoreCase);

        public Action<string>? ErrorSink { get; set; }

        public int RemoteEventCount => _remoteEvents.Count;
        public int ServerEventCount => _serverEvents.Sum(pair => pair.Value.Count);
        public int CommandCount => _commands.Count;
        public IEnumerable<string> VariadicRemoteEvents => _remoteEvents
            .Where(pair => pair.Value.Any(handler => handler.IsVariadic))
            .Select(pair => pair.Key);
        public IEnumerable<RemoteEventDescriptor> RemoteEvents => _remoteEvents.Select(pair =>
            new RemoteEventDescriptor(
                pair.Key,
                pair.Value[0].PayloadArgumentCount,
                pair.Value[0].RequiredPayloadArgumentCount,
                pair.Value[0].PayloadDefaults));

        public void Register(Script script)
        {
            if (script == null) throw new ArgumentNullException(nameof(script));
            var methods = script.GetType().GetMethods(BindingFlags.Instance | BindingFlags.Static | BindingFlags.Public | BindingFlags.NonPublic);
            foreach (var method in methods)
            {
                var remote = method.GetCustomAttribute<RemoteEventAttribute>();
                if (remote != null)
                {
                    var name = remote.RemoteEventString ?? method.Name;
                    var handler = new Handler(method.IsStatic ? null : script, method);
                    if (!_remoteEvents.TryGetValue(name, out var handlers))
                    {
                        handlers = new List<Handler>();
                        _remoteEvents.Add(name, handlers);
                    }
                    RegisterRemoteHandler(name, handlers, handler);
                }

                var server = method.GetCustomAttribute<ServerEventAttribute>();
                if (server != null)
                {
                    if (!_serverEvents.TryGetValue(server.EventId, out var handlers))
                    {
                        handlers = new List<Handler>();
                        _serverEvents.Add(server.EventId, handlers);
                    }
                    handlers.Add(new Handler(method.IsStatic ? null : script, method));
                }

                var command = method.GetCustomAttribute<CommandAttribute>();
                if (command != null)
                {
                    var name = string.IsNullOrWhiteSpace(command.CommandString) ? method.Name : command.CommandString!;
                    if (_commands.ContainsKey(name)) throw new InvalidOperationException("Duplicate command: " + name);
                    _commands.Add(name, new CommandHandler(method.IsStatic ? null : script, method, command));
                }
            }
        }

        public Task<bool> DispatchCommandAsync(Player player, string commandText)
        {
            if (player == null) throw new ArgumentNullException(nameof(player));
            var raw = (commandText ?? string.Empty).Trim();
            if (raw.StartsWith("/", StringComparison.Ordinal)) raw = raw.Substring(1);
            if (raw.Length == 0) return Task.FromResult(false);

            var separator = raw.IndexOf(' ');
            var name = separator < 0 ? raw : raw.Substring(0, separator);
            var arguments = separator < 0 ? string.Empty : raw.Substring(separator + 1).Trim();
            if (!_commands.TryGetValue(name, out var command)) return Task.FromResult(false);
            return command.InvokeAsync(player, arguments);
        }

        public Task<object?> DispatchRemoteAsync(string eventName, Player player, params object?[] arguments)
        {
            if (!_remoteEvents.TryGetValue(eventName, out var handlers))
                throw new KeyNotFoundException("Remote event is not registered: " + eventName);
            return DispatchRemoteHandlersAsync(eventName, handlers, player, arguments);
        }

        private async Task<object?> DispatchRemoteHandlersAsync(string eventName, IEnumerable<Handler> handlers, Player player, object?[] arguments)
        {
            object? result = null;
            foreach (var handler in handlers)
            {
                try
                {
                    var value = await handler.InvokeAsync(PrependPlayerIfRequired(handler.Method, player, arguments));
                    if (value != null) result = value;
                }
                catch (Exception error) { ReportHandlerError("remote " + eventName, handler.Method, error); }
            }
            return result;
        }

        private static void RegisterRemoteHandler(string name, List<Handler> handlers, Handler candidate)
        {
            if (handlers.Count == 0) { handlers.Add(candidate); return; }
            if (handlers[0].PayloadArgumentCount != candidate.PayloadArgumentCount)
                throw new InvalidOperationException("Duplicate remote event has incompatible arguments: " + name);

            // NeptuneEvo contains a few legacy *EventHandler wrappers next to
            // the actual handler. Calling both would apply the same action
            // twice, so prefer the direct implementation. Other duplicates
            // (for example context-sensitive minigame listeners) remain multicast.
            if (candidate.Method.Name.EndsWith("EventHandler", StringComparison.Ordinal)) return;
            var wrappers = handlers.Where(item => item.Method.Name.EndsWith("EventHandler", StringComparison.Ordinal)).ToArray();
            foreach (var wrapper in wrappers) handlers.Remove(wrapper);
            handlers.Add(candidate);
        }

        public async Task DispatchServerAsync(Event eventId, params object?[] arguments)
        {
            if (!_serverEvents.TryGetValue(eventId, out var handlers)) return;
            foreach (var handler in handlers)
            {
                try { await handler.InvokeAsync(arguments); }
                catch (Exception error) { ReportHandlerError("server " + eventId, handler.Method, error); }
            }
        }

        private void ReportHandlerError(string eventName, MethodInfo method, Exception error)
        {
            var actual = error is TargetInvocationException && error.InnerException != null ? error.InnerException : error;
            ErrorSink?.Invoke($"{eventName} handler {method.DeclaringType?.FullName}.{method.Name} failed: {actual}");
        }

        private static object?[] PrependPlayerIfRequired(MethodInfo method, Player player, object?[] arguments)
        {
            var parameters = method.GetParameters();
            if (parameters.Length == 0 || !typeof(Player).IsAssignableFrom(parameters[0].ParameterType)) return arguments;
            var result = new object?[arguments.Length + 1];
            result[0] = player;
            Array.Copy(arguments, 0, result, 1, arguments.Length);
            return result;
        }

        private sealed class Handler
        {
            private readonly object? _target;
            public Handler(object? target, MethodInfo method) { _target = target; Method = method; }
            public MethodInfo Method { get; }
            public bool IsVariadic
            {
                get
                {
                    var parameters = Method.GetParameters();
                    return parameters.Length > 0 && parameters[parameters.Length - 1].GetCustomAttribute<ParamArrayAttribute>() != null;
                }
            }
            public int PayloadArgumentCount
            {
                get
                {
                    var parameters = Method.GetParameters();
                    return parameters.Length > 0 && typeof(Player).IsAssignableFrom(parameters[0].ParameterType)
                        ? parameters.Length - 1
                        : parameters.Length;
                }
            }
            public int RequiredPayloadArgumentCount
            {
                get
                {
                    var parameters = PayloadParameters;
                    return parameters.Count(parameter => !parameter.HasDefaultValue);
                }
            }
            public object?[] PayloadDefaults => PayloadParameters
                .Select(parameter => parameter.HasDefaultValue && parameter.DefaultValue != DBNull.Value && parameter.DefaultValue != Missing.Value
                    ? parameter.DefaultValue
                    : null)
                .ToArray();
            private ParameterInfo[] PayloadParameters
            {
                get
                {
                    var parameters = Method.GetParameters();
                    return parameters.Length > 0 && typeof(Player).IsAssignableFrom(parameters[0].ParameterType)
                        ? parameters.Skip(1).ToArray()
                        : parameters;
                }
            }

            public async Task<object?> InvokeAsync(object?[] supplied)
            {
                var parameters = Method.GetParameters();
                if (parameters.Length != supplied.Length)
                    throw new TargetParameterCountException(Method.Name + " expects " + parameters.Length + " arguments, received " + supplied.Length);
                var converted = new object?[supplied.Length];
                for (var index = 0; index < supplied.Length; index++)
                    converted[index] = ConvertArgument(supplied[index], parameters[index].ParameterType);
                var result = Method.Invoke(_target, converted);
                if (!(result is Task task)) return result;
                await task;
                var resultProperty = task.GetType().GetProperty("Result", BindingFlags.Instance | BindingFlags.Public);
                return resultProperty?.GetValue(task);
            }

            private static object? ConvertArgument(object? value, Type targetType)
            {
                if (value == null) return null;
                var concreteType = Nullable.GetUnderlyingType(targetType) ?? targetType;
                if (concreteType.IsInstanceOfType(value)) return value;
                if (typeof(Entity).IsAssignableFrom(concreteType) || concreteType == typeof(NetHandle))
                {
                    var entity = ResolveEntityReference(value);
                    if (entity != null)
                    {
                        if (concreteType == typeof(NetHandle)) return entity.Handle;
                        if (concreteType.IsInstanceOfType(entity)) return entity;
                    }
                }
                if (concreteType.IsEnum)
                {
                    if (value is string name) return Enum.Parse(concreteType, name, true);
                    return Enum.ToObject(concreteType, value);
                }
                if (value is IConvertible && typeof(IConvertible).IsAssignableFrom(concreteType))
                    return Convert.ChangeType(value, concreteType, CultureInfo.InvariantCulture);
                return JToken.FromObject(value).ToObject(concreteType);
            }

            private static Entity? ResolveEntityReference(object value)
            {
                JToken token;
                try { token = value as JToken ?? JToken.FromObject(value); }
                catch { return null; }
                var type = token["__mpRef"]?.Value<string>();
                if (string.IsNullOrWhiteSpace(type)) return null;
                var id = token["id"]?.Value<int>() ?? -1;
                var networkId = token["netId"]?.Value<int>() ?? 0;
                if (id < 0 && networkId <= 0) return null;

                switch (type!.ToLowerInvariant())
                {
                    case "player": return RAGE.Entities.Players.Get(checked((ushort)(networkId > 0 ? networkId : id)));
                    case "vehicle": return (networkId > 0 ? RAGE.Entities.Vehicles.GetByNetworkId(networkId) : null) ?? GetById(RAGE.Entities.Vehicles, id);
                    case "object": return (networkId > 0 ? RAGE.Entities.Objects.GetByNetworkId(networkId) : null) ?? GetById(RAGE.Entities.Objects, id);
                    case "ped": return (networkId > 0 ? RAGE.Entities.Peds.GetByNetworkId(networkId) : null) ?? GetById(RAGE.Entities.Peds, id);
                    case "colshape": return GetById(RAGE.Entities.Colshapes, id);
                    case "checkpoint": return GetById(RAGE.Entities.Checkpoints, id);
                    case "blip": return GetById(RAGE.Entities.Blips, id);
                    case "marker": return GetById(RAGE.Entities.Markers, id);
                    case "textlabel":
                    case "label": return GetById(RAGE.Entities.TextLabels, id);
                    case "pickup": return GetById(RAGE.Entities.Pickups, id);
                    case "dummy": return GetById(RAGE.Entities.DummyEntities, id);
                    default: return null;
                }
            }

            private static T? GetById<T>(RAGE.EntityPool<T> pool, int id) where T : Entity =>
                id >= 0 && id <= ushort.MaxValue ? pool.Get((ushort)id) : null;
        }

        private sealed class CommandHandler
        {
            private readonly object? _target;
            private readonly MethodInfo _method;
            private readonly CommandAttribute _attribute;

            public CommandHandler(object? target, MethodInfo method, CommandAttribute attribute)
            {
                _target = target;
                _method = method;
                _attribute = attribute;
            }

            public async Task<bool> InvokeAsync(Player player, string rawArguments)
            {
                var parameters = _method.GetParameters();
                var supplied = new object?[parameters.Length];
                var parameterOffset = parameters.Length > 0 && typeof(Player).IsAssignableFrom(parameters[0].ParameterType) ? 1 : 0;
                if (parameterOffset == 1) supplied[0] = player;

                var tokens = Tokenize(rawArguments);
                var tokenIndex = 0;
                for (var parameterIndex = parameterOffset; parameterIndex < parameters.Length; parameterIndex++)
                {
                    var parameter = parameters[parameterIndex];
                    var isLast = parameterIndex == parameters.Length - 1;
                    string? rawValue = null;

                    if (_attribute.GreedyArg && isLast && tokenIndex < tokens.Count)
                    {
                        rawValue = string.Join(" ", tokens.Skip(tokenIndex));
                        tokenIndex = tokens.Count;
                    }
                    else if (tokenIndex < tokens.Count)
                    {
                        rawValue = tokens[tokenIndex++];
                    }

                    if (rawValue == null)
                    {
                        if (parameter.HasDefaultValue)
                        {
                            supplied[parameterIndex] = parameter.DefaultValue;
                            continue;
                        }
                        throw new ArgumentException("Missing command argument: " + parameter.Name);
                    }

                    supplied[parameterIndex] = ConvertCommandArgument(rawValue, parameter.ParameterType);
                }

                if (tokenIndex < tokens.Count)
                    throw new ArgumentException("Too many command arguments");

                var result = _method.Invoke(_target, supplied);
                if (result is Task task) await task;
                return true;
            }

            private static object? ConvertCommandArgument(string value, Type targetType)
            {
                var concreteType = Nullable.GetUnderlyingType(targetType) ?? targetType;
                if (concreteType == typeof(string)) return value;
                if (concreteType == typeof(bool))
                {
                    if (value == "1") return true;
                    if (value == "0") return false;
                }
                if (concreteType.IsEnum) return Enum.Parse(concreteType, value, true);
                return Convert.ChangeType(value, concreteType, CultureInfo.InvariantCulture);
            }

            private static List<string> Tokenize(string value)
            {
                var tokens = new List<string>();
                if (string.IsNullOrWhiteSpace(value)) return tokens;
                var current = new System.Text.StringBuilder();
                var quoted = false;
                char quote = '\0';

                for (var index = 0; index < value.Length; index++)
                {
                    var character = value[index];
                    if (quoted)
                    {
                        if (character == quote) quoted = false;
                        else if (character == '\\' && index + 1 < value.Length && value[index + 1] == quote) current.Append(value[++index]);
                        else current.Append(character);
                        continue;
                    }

                    if (character == '\"' || character == '\'')
                    {
                        quoted = true;
                        quote = character;
                    }
                    else if (char.IsWhiteSpace(character))
                    {
                        if (current.Length > 0) { tokens.Add(current.ToString()); current.Clear(); }
                    }
                    else current.Append(character);
                }

                if (quoted) throw new ArgumentException("Unterminated quoted command argument");
                if (current.Length > 0) tokens.Add(current.ToString());
                return tokens;
            }
        }
    }

    public sealed class RemoteEventDescriptor
    {
        public RemoteEventDescriptor(string name, int argumentCount, int requiredArgumentCount, object?[] defaultArguments)
        {
            Name = name;
            ArgumentCount = argumentCount;
            RequiredArgumentCount = requiredArgumentCount;
            DefaultArguments = defaultArguments;
        }
        public string Name { get; }
        public int ArgumentCount { get; }
        public int RequiredArgumentCount { get; }
        public object?[] DefaultArguments { get; }
    }
}

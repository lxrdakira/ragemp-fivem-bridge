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
        private readonly Dictionary<string, Handler> _remoteEvents = new Dictionary<string, Handler>(StringComparer.Ordinal);
        private readonly Dictionary<Event, List<Handler>> _serverEvents = new Dictionary<Event, List<Handler>>();

        public int RemoteEventCount => _remoteEvents.Count;
        public int ServerEventCount => _serverEvents.Sum(pair => pair.Value.Count);
        public IEnumerable<RemoteEventDescriptor> RemoteEvents => _remoteEvents.Select(pair =>
            new RemoteEventDescriptor(pair.Key, pair.Value.PayloadArgumentCount));

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
                    if (_remoteEvents.ContainsKey(name)) throw new InvalidOperationException("Duplicate remote event: " + name);
                    _remoteEvents.Add(name, new Handler(method.IsStatic ? null : script, method));
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
            }
        }

        public Task DispatchRemoteAsync(string eventName, Player player, params object?[] arguments)
        {
            if (!_remoteEvents.TryGetValue(eventName, out var handler))
                throw new KeyNotFoundException("Remote event is not registered: " + eventName);
            return handler.InvokeAsync(PrependPlayerIfRequired(handler.Method, player, arguments));
        }

        public async Task DispatchServerAsync(Event eventId, params object?[] arguments)
        {
            if (!_serverEvents.TryGetValue(eventId, out var handlers)) return;
            foreach (var handler in handlers) await handler.InvokeAsync(arguments).ConfigureAwait(false);
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

            public async Task InvokeAsync(object?[] supplied)
            {
                var parameters = Method.GetParameters();
                if (parameters.Length != supplied.Length)
                    throw new TargetParameterCountException(Method.Name + " expects " + parameters.Length + " arguments, received " + supplied.Length);
                var converted = new object?[supplied.Length];
                for (var index = 0; index < supplied.Length; index++)
                    converted[index] = ConvertArgument(supplied[index], parameters[index].ParameterType);
                var result = Method.Invoke(_target, converted);
                if (result is Task task) await task.ConfigureAwait(false);
            }

            private static object? ConvertArgument(object? value, Type targetType)
            {
                if (value == null) return null;
                var concreteType = Nullable.GetUnderlyingType(targetType) ?? targetType;
                if (concreteType.IsInstanceOfType(value)) return value;
                if (concreteType.IsEnum)
                {
                    if (value is string name) return Enum.Parse(concreteType, name, true);
                    return Enum.ToObject(concreteType, value);
                }
                if (value is IConvertible && typeof(IConvertible).IsAssignableFrom(concreteType))
                    return Convert.ChangeType(value, concreteType, CultureInfo.InvariantCulture);
                return JToken.FromObject(value).ToObject(concreteType);
            }
        }
    }

    public sealed class RemoteEventDescriptor
    {
        public RemoteEventDescriptor(string name, int argumentCount)
        {
            Name = name;
            ArgumentCount = argumentCount;
        }
        public string Name { get; }
        public int ArgumentCount { get; }
    }
}

using System;
using CitizenFX.Core;
using RageMP.FiveM.Bridge;
using CfxPlayer = CitizenFX.Core.Player;

namespace RageMP.FiveM.Bridge.Host
{
    internal sealed class RemoteEventAdapter
    {
        private readonly string _eventName;
        private readonly EventDispatcher _dispatcher;
        private readonly PlayerFactory _players;
        private readonly Action<Exception> _onError;

        public RemoteEventAdapter(string eventName, EventDispatcher dispatcher, PlayerFactory players, Action<Exception> onError)
        {
            _eventName = eventName;
            _dispatcher = dispatcher;
            _players = players;
            _onError = onError;
        }

        public Delegate CreateDelegate(int argumentCount)
        {
            switch (argumentCount)
            {
                case 0: return new Action<CfxPlayer>(Handle0);
                case 1: return new Action<CfxPlayer, object?>(Handle1);
                case 2: return new Action<CfxPlayer, object?, object?>(Handle2);
                case 3: return new Action<CfxPlayer, object?, object?, object?>(Handle3);
                case 4: return new Action<CfxPlayer, object?, object?, object?, object?>(Handle4);
                case 5: return new Action<CfxPlayer, object?, object?, object?, object?, object?>(Handle5);
                case 6: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?>(Handle6);
                case 7: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?>(Handle7);
                case 8: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?>(Handle8);
                case 9: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?, object?>(Handle9);
                case 10: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?>(Handle10);
                case 11: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?>(Handle11);
                case 12: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?>(Handle12);
                case 13: return new Action<CfxPlayer, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?, object?>(Handle13);
                default: throw new NotSupportedException("Remote event argument count is not supported: " + argumentCount);
            }
        }

        private void Dispatch(CfxPlayer source, params object?[] arguments)
        {
            _ = _dispatcher.DispatchRemoteAsync(_eventName, _players.GetOrCreate(source), arguments)
                .ContinueWith(task => _onError(task.Exception?.GetBaseException() ?? new Exception("Remote event failed")),
                    System.Threading.Tasks.TaskContinuationOptions.OnlyOnFaulted);
        }

        private void Handle0([FromSource] CfxPlayer source) => Dispatch(source);
        private void Handle1([FromSource] CfxPlayer source, object? a0) => Dispatch(source, a0);
        private void Handle2([FromSource] CfxPlayer source, object? a0, object? a1) => Dispatch(source, a0, a1);
        private void Handle3([FromSource] CfxPlayer source, object? a0, object? a1, object? a2) => Dispatch(source, a0, a1, a2);
        private void Handle4([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3) => Dispatch(source, a0, a1, a2, a3);
        private void Handle5([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4) => Dispatch(source, a0, a1, a2, a3, a4);
        private void Handle6([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5) => Dispatch(source, a0, a1, a2, a3, a4, a5);
        private void Handle7([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6);
        private void Handle8([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7);
        private void Handle9([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7, object? a8) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7, a8);
        private void Handle10([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7, object? a8, object? a9) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9);
        private void Handle11([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7, object? a8, object? a9, object? a10) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10);
        private void Handle12([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7, object? a8, object? a9, object? a10, object? a11) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11);
        private void Handle13([FromSource] CfxPlayer source, object? a0, object? a1, object? a2, object? a3, object? a4, object? a5, object? a6, object? a7, object? a8, object? a9, object? a10, object? a11, object? a12) => Dispatch(source, a0, a1, a2, a3, a4, a5, a6, a7, a8, a9, a10, a11, a12);
    }
}

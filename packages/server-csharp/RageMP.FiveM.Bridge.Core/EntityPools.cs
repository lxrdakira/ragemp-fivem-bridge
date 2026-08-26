using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.Linq;
using System.Threading;

namespace RAGE
{
    using GTANetworkAPI;

    public static class Entities
    {
        public static EntityPool<Player> Players { get; } = new EntityPool<Player>(EntityType.Player);
        public static EntityPool<Vehicle> Vehicles { get; } = new EntityPool<Vehicle>(EntityType.Vehicle);
        public static EntityPool<Ped> Peds { get; } = new EntityPool<Ped>(EntityType.Ped);
        public static EntityPool<GTANetworkAPI.Object> Objects { get; } = new EntityPool<GTANetworkAPI.Object>(EntityType.Object);
        public static EntityPool<ColShape> Colshapes { get; } = new EntityPool<ColShape>(EntityType.Colshape);
        public static EntityPool<Blip> Blips { get; } = new EntityPool<Blip>(EntityType.Blip);
        public static EntityPool<Checkpoint> Checkpoints { get; } = new EntityPool<Checkpoint>(EntityType.Checkpoint);
        public static EntityPool<DummyEntity> DummyEntities { get; } = new EntityPool<DummyEntity>(EntityType.DummyEntity);
        public static EntityPool<Marker> Markers { get; } = new EntityPool<Marker>(EntityType.Marker);
        public static EntityPool<Pickup> Pickups { get; } = new EntityPool<Pickup>(EntityType.Pickup);
        public static EntityPool<TextLabel> TextLabels { get; } = new EntityPool<TextLabel>(EntityType.TextLabel);

        public static Entity? Resolve(NetHandle handle)
        {
            switch (handle.Type)
            {
                case EntityType.Player: return Players.Get(handle.Value);
                case EntityType.Vehicle: return Vehicles.Get(handle.Value);
                case EntityType.Object: return Objects.Get(handle.Value);
                case EntityType.Ped: return Peds.Get(handle.Value);
                case EntityType.Colshape: return Colshapes.Get(handle.Value);
                case EntityType.Blip: return Blips.Get(handle.Value);
                case EntityType.Checkpoint: return Checkpoints.Get(handle.Value);
                case EntityType.DummyEntity: return DummyEntities.Get(handle.Value);
                case EntityType.Marker: return Markers.Get(handle.Value);
                case EntityType.Pickup: return Pickups.Get(handle.Value);
                case EntityType.TextLabel: return TextLabels.Get(handle.Value);
                default: return null;
            }
        }
    }

    public sealed class EntityPool<T> where T : Entity
    {
        private readonly ConcurrentDictionary<ushort, T> _entities = new ConcurrentDictionary<ushort, T>();
        private readonly EntityType _type;
        private int _lastId;

        internal EntityPool(EntityType type) => _type = type;

        public Func<NetHandle, T>? CreateEntity { get; set; }
        public IReadOnlyCollection<T> All => _entities.Values.ToArray();

        public T? Get(ushort id) => _entities.TryGetValue(id, out var entity) ? entity : null;

        public T GetOrCreate(ushort id)
        {
            return _entities.GetOrAdd(id, value =>
            {
                var handle = new NetHandle(value, _type);
                if (CreateEntity != null) return CreateEntity(handle);
                return (T)Activator.CreateInstance(typeof(T), handle)!;
            });
        }

        public T Create()
        {
            ushort id;
            do { id = checked((ushort)Interlocked.Increment(ref _lastId)); }
            while (_entities.ContainsKey(id));
            return GetOrCreate(id);
        }

        public void Register(T entity) => _entities[entity.Id] = entity;
        public bool Remove(ushort id) => _entities.TryRemove(id, out _);
    }
}

using System;
using System.Linq;
using System.Reflection;
using GTANetworkAPI;
using RageObject = GTANetworkAPI.Object;

namespace RageMP.FiveM.Bridge.Host
{
    internal static class DerivedEntityFactory
    {
        public static void Configure()
        {
            var types = AppDomain.CurrentDomain.GetAssemblies().SelectMany(SafeTypes).ToArray();
            var vehicle = Resolve<Vehicle>(types); RAGE.Entities.Vehicles.CreateEntity = handle => Create<Vehicle>(vehicle, handle);
            var ped = Resolve<Ped>(types); RAGE.Entities.Peds.CreateEntity = handle => Create<Ped>(ped, handle);
            var rageObject = Resolve<RageObject>(types); RAGE.Entities.Objects.CreateEntity = handle => Create<RageObject>(rageObject, handle);
            var colshape = Resolve<ColShape>(types); RAGE.Entities.Colshapes.CreateEntity = handle => Create<ColShape>(colshape, handle);
            var blip = Resolve<Blip>(types); RAGE.Entities.Blips.CreateEntity = handle => Create<Blip>(blip, handle);
            var checkpoint = Resolve<Checkpoint>(types); RAGE.Entities.Checkpoints.CreateEntity = handle => Create<Checkpoint>(checkpoint, handle);
            var dummy = Resolve<DummyEntity>(types); RAGE.Entities.DummyEntities.CreateEntity = handle => Create<DummyEntity>(dummy, handle);
            var marker = Resolve<Marker>(types); RAGE.Entities.Markers.CreateEntity = handle => Create<Marker>(marker, handle);
            var pickup = Resolve<Pickup>(types); RAGE.Entities.Pickups.CreateEntity = handle => Create<Pickup>(pickup, handle);
            var label = Resolve<TextLabel>(types); RAGE.Entities.TextLabels.CreateEntity = handle => Create<TextLabel>(label, handle);
        }

        private static Type Resolve<T>(Type[] types) where T : Entity
        {
            var baseType = typeof(T);
            return types
                .Where(type => !type.IsAbstract && baseType.IsAssignableFrom(type))
                .Where(type => type.GetConstructor(new[] { typeof(NetHandle) }) != null)
                .OrderByDescending(InheritanceDepth)
                .FirstOrDefault() ?? baseType;
        }

        private static T Create<T>(Type concrete, NetHandle handle) where T : Entity =>
            (T)Activator.CreateInstance(concrete, handle)!;

        private static Type[] SafeTypes(Assembly assembly)
        {
            try { return assembly.GetTypes(); }
            catch (ReflectionTypeLoadException error) { return error.Types.Where(type => type != null).Cast<Type>().ToArray(); }
        }

        private static int InheritanceDepth(Type type)
        {
            var depth = 0;
            for (var current = type; current != null; current = current.BaseType) depth++;
            return depth;
        }
    }
}

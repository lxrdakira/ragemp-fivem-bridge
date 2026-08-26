namespace GTANetworkAPI
{
    public enum Event
    {
        ResourceStart = 0,
        ResourceStop = 1,
        ResourceStartEx = 2,
        ResourceStopEx = 3,
        MapChange = 4,
        ChatMessage = 5,
        Update = 6,
        EntityCreated = 7,
        EntityDeleted = 8,
        EntityModelChange = 9,
        PlayerConnected = 10,
        IncomingConnection = 11,
        PlayerDisconnected = 12,
        PlayerSpawn = 13,
        PlayerDeath = 14,
        PlayerDamage = 15,
        PlayerPickup = 16,
        PlayerWeaponSwitch = 17,
        PlayerDetonateStickies = 18,
        PlayerEnterCheckpoint = 19,
        PlayerExitCheckpoint = 20,
        PlayerEnterColshape = 21,
        PlayerExitColshape = 22,
        PlayerEnterVehicleAttempt = 23,
        PlayerExitVehicleAttempt = 24,
        PlayerEnterVehicle = 25,
        PlayerExitVehicle = 26,
        VehicleDamage = 27,
        VehicleDeath = 28,
        VehicleHornToggle = 29,
        VehicleSirenToggle = 30,
        VehicleDoorBreak = 31,
        VehicleWindowSmash = 32,
        VehicleTyreBurst = 33,
        VehicleTrailerChange = 34,
        FirstChanceException = 35,
        UnhandledException = 36,
        Invalid = 37
    }

    public enum EntityType
    {
        Player = 0,
        Vehicle = 1,
        Object = 2,
        Pickup = 3,
        Blip = 4,
        Checkpoint = 5,
        Marker = 6,
        Colshape = 7,
        TextLabel = 8,
        DummyEntity = 9,
        Ped = 10
    }
}

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

    public enum DisconnectionType
    {
        Left = 1,
        Timeout = 2,
        Kicked = 3
    }

    public enum Weather
    {
        EXTRASUNNY, CLEAR, CLOUDS, SMOG, FOGGY, OVERCAST, RAIN, THUNDER,
        CLEARING, NEUTRAL, SNOW, BLIZZARD, SNOWLIGHT, XMAS
    }

    public enum VehicleSeat
    {
        Driver = 0, RightFront = 1, LeftRear = 2, RightRear = 3,
        ExtraSeat1 = 4, ExtraSeat2 = 5, ExtraSeat3 = 6, ExtraSeat4 = 7,
        ExtraSeat5 = 8, ExtraSeat6 = 9, ExtraSeat7 = 10, ExtraSeat8 = 11,
        ExtraSeat9 = 12, ExtraSeat10 = 13, ExtraSeat11 = 14, ExtraSeat12 = 15
    }

    public enum MarkerType
    {
        UpsideDownCone = 0, VerticalCylinder = 1, ThickChevronUp = 2, ThinChevronUp = 3,
        CheckeredFlagRect = 4, CheckeredFlagCircle = 5, VerticleCircle = 6, PlaneModel = 7,
        LostMCDark = 8, LostMCLight = 9, Number0 = 10, Number1 = 11, Number2 = 12,
        Number3 = 13, Number4 = 14, Number5 = 15, Number6 = 16, Number7 = 17,
        Number8 = 18, Number9 = 19, ChevronUpx1 = 20, ChevronUpx2 = 21,
        ChevronUpx3 = 22, HorizontalCircleFat = 23, ReplayIcon = 24,
        HorizontalCircleSkinny = 25, HorizontalCircleSkinnyArrow = 26,
        HorizontalSplitArrowCircle = 27, DebugSphere = 28
    }
}

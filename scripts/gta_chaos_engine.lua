-- [Overlay Asmaro] GTA V Chaos Mod Engine v5.2
local effects = {"SuperJump", "ExplodeVehicle", "LowGravity", "ZeroFriction", "TeleportToSky", "SpawnTank"}
local currentEffect = nil

Citizen.CreateThread(function()
    print("^2[Overlay Asmaro] Chaos Engine Initialized Successfully^7")
    while true do
        Citizen.Wait(30000) -- Trigger random effect every 30 seconds
        local randIndex = math.random(1, #effects)
        currentEffect = effects[randIndex]
        TriggerEvent("asmaro:chaos:trigger", currentEffect)
    end
end)
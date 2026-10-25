Complete `WindRelay` in `solution.sol`. The interface `IAnemometer`, the finished `Anemometer`
contract, and the relay's state, event and errors are declared for you: keep their names.

1. **`function install(uint256 startSpeed) external returns (Anemometer sensor)`** deploys a new
   `Anemometer` with `new`, owned by **the caller of `install`** and reading `startSpeed`. It
   appends the sensor to `sensors`, emits `SensorAdded(address(sensor))` and returns it.
   Remember who `msg.sender` is inside a constructor that your contract runs.
2. **`function connect(address sensor) external`** adds a sensor that another maker deployed. It
   reverts with `ZeroAddress()` for `address(0)` and with `NotAContract(sensor)` when no code lives
   at the address (`sensor.code.length == 0`). Otherwise it appends the address, converted to
   `IAnemometer`, to `sensors` and emits `SensorAdded(sensor)`.
3. **`function readingOf(uint256 index) external view returns (uint256)`** returns the reading of
   `sensors[index]` through the interface. Do not catch anything: a failing sensor's error, such
   as `Iced()`, must reach the caller unchanged.
4. **`function strongestGust() external view returns (uint256 top, uint256 working)`** reads every
   sensor with `try`/`catch`. A sensor that fails in **any** way (a custom error, a revert
   string, a panic, a revert without data) is skipped. `top` is the highest reading among the
   sensors that answered and `working` is how many answered. If none answered (or there are no
   sensors), revert with `NoReadings()`.

```solidity
WindRelay relay = new WindRelay();
Anemometer a = relay.install(40);   // a.owner() is you, not the relay
Anemometer b = relay.install(65);
relay.strongestGust();              // (65, 2)
b.set(65, true);                    // b's cups ice up: b.windSpeed() reverts with Iced()
relay.readingOf(1);                 // reverts with Iced()
relay.strongestGust();              // (40, 1)
relay.connect(address(0xBEEF));     // reverts with NotAContract(0xBEEF)
```

A sensor that returns no data at all would still break `strongestGust`: decoding the answer
happens in your contract, where `catch` does not reach. Medium 06 shows how to read such a sensor
with a low-level call; the tests here do not try it.

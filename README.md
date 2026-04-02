![Logo](admin/apsystem-ez1-solar.png)
# ioBroker.apsystem-ez1-solar

[![NPM version](https://img.shields.io/npm/v/iobroker.apsystem-ez1-solar.svg)](https://www.npmjs.com/package/iobroker.apsystem-ez1-solar)
[![Downloads](https://img.shields.io/npm/dm/iobroker.apsystem-ez1-solar.svg)](https://www.npmjs.com/package/iobroker.apsystem-ez1-solar)
![Number of Installations](https://iobroker.live/badges/apsystem-ez1-solar-installed.svg)
![Current version in stable repository](https://iobroker.live/badges/apsystem-ez1-solar-stable.svg)

[![NPM](https://nodei.co/npm/iobroker.apsystem-ez1-solar.png?downloads=true)](https://nodei.co/npm/iobroker.apsystem-ez1-solar/)

**Tests:** ![Test and Release](https://github.com/d3vc0-de/ioBroker.apsystem-ez1-solar/workflows/Test%20and%20Release/badge.svg)

## APsystems EZ1 adapter for ioBroker

This adapter integrates the **APsystems EZ1 microinverter** into ioBroker via its local HTTP API. It reads real-time power output, energy totals, alarm states and device status — and lets you control the inverter (on/off, max power limit) directly from ioBroker.

> **Disclaimer:** This adapter is not affiliated with or endorsed by Altenergy Power System Inc. (APsystems). All product names and trademarks belong to their respective owners.

---

## Requirements

- APsystems EZ1 microinverter with firmware that supports the local API
- Local Mode must be enabled in the **AP EasyPower** app:
  1. Connect to the EZ1 via Bluetooth in the app
  2. Go to Settings → Local Mode → Enable Local Mode
- The EZ1 device and ioBroker must be on the **same local network**
- The EZ1 runs its HTTP API on **port 8050**

---

## Configuration

| Setting | Description |
|---|---|
| **IP address** | Local IP address of the EZ1 device (e.g. `192.168.178.28`) |
| **Poll interval** | How often to query the device in seconds (minimum 5 s, default 30 s) |
| **Suppress network errors** | When checked, connection errors are logged as debug instead of warn — useful at night when the inverter is off and the API is unreachable |

---

## States

### `info`
| State | Type | R/W | Description |
|---|---|---|---|
| `info.deviceId` | string | R | Device serial number |
| `info.devVer` | string | R | Firmware version |
| `info.ssid` | string | R | Connected WiFi network |
| `info.ipAddr` | string | R | IP address reported by the device |
| `info.minPower` | number (W) | R | Minimum settable power limit |
| `info.maxPower` | number (W) | R/W | Current maximum power limit — write to change it |

### `output`
| State | Type | Description |
|---|---|---|
| `output.totalPower` | number (W) | Combined output power of both channels |
| `output.channel1.power` | number (W) | Current power on channel 1 |
| `output.channel1.energySinceStartup` | number (kWh) | Energy generated since last startup — channel 1 |
| `output.channel1.energyLifetime` | number (kWh) | Total lifetime energy — channel 1 |
| `output.channel2.power` | number (W) | Current power on channel 2 |
| `output.channel2.energySinceStartup` | number (kWh) | Energy generated since last startup — channel 2 |
| `output.channel2.energyLifetime` | number (kWh) | Total lifetime energy — channel 2 |

### `alarm`
| State | Type | Description |
|---|---|---|
| `alarm.offGrid` | boolean | `true` = AC connection problem |
| `alarm.outputFault` | boolean | `true` = Output fault detected |
| `alarm.dc1ShortCircuit` | boolean | `true` = DC short circuit on channel 1 |
| `alarm.dc2ShortCircuit` | boolean | `true` = DC short circuit on channel 2 |

### `device`
| State | Type | R/W | Description |
|---|---|---|---|
| `device.status` | boolean | R/W | `true` = inverter on, `false` = inverter off. Writing controls the device. |

---

## Notes

- When the inverter is off (e.g. at night), the local API becomes unreachable. Enable **"Suppress network errors"** in the adapter settings to keep the logs clean.
- Changing `info.maxPower` must be within the range reported by `info.minPower` and the hardware maximum (800 W for EZ1).
- Setting `device.status` to `false` stops power output but keeps the local API running.

---

## Changelog

<!--
    Placeholder for the next version (at the beginning of the line):
    ### **WORK IN PROGRESS**
-->

### 0.0.1 (2026-04-02)
* (alex) Initial release

---

## License
MIT License

Copyright (c) 2026 alex <d3vc0_de@proton.me>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

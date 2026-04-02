'use strict';

/*
 * Created with @iobroker/create-adapter v3.1.2
 */

const utils = require('@iobroker/adapter-core');
const http = require('node:http');

class ApsystemEz1Solar extends utils.Adapter {
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
	 */
	constructor(options) {
		super({
			...options,
			name: 'apsystem-ez1-solar',
		});
		this.on('ready', this.onReady.bind(this));
		this.on('stateChange', this.onStateChange.bind(this));
		this.on('unload', this.onUnload.bind(this));

		this.pollTimer = null;
	}

	async onReady() {
		if (!this.config.ipAddress) {
			this.log.error(
				'No IP address configured. Please enter the IP address of the EZ1 device in the adapter settings.',
			);
			return;
		}
		this.log.info(`Connecting to EZ1 at ${this.config.ipAddress}:8050, polling every ${this.config.pollInterval}s`);

		await this.createObjects();

		this.subscribeStates('device.status');
		this.subscribeStates('info.maxPower');

		await this.poll();

		const intervalMs = Math.max(5, this.config.pollInterval || 30) * 1000;
		this.pollTimer = this.setInterval(() => this.poll(), intervalMs);
	}

	async createObjects() {
		// info channel
		await this.setObjectNotExistsAsync('info', {
			type: 'channel',
			common: { name: 'Device Information' },
			native: {},
		});
		await this.setObjectNotExistsAsync('info.deviceId', {
			type: 'state',
			common: { name: 'Device ID', type: 'string', role: 'info.serial', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('info.devVer', {
			type: 'state',
			common: { name: 'Firmware Version', type: 'string', role: 'info.firmware', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('info.ssid', {
			type: 'state',
			common: { name: 'WiFi SSID', type: 'string', role: 'info.name', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('info.ipAddr', {
			type: 'state',
			common: { name: 'Device IP Address', type: 'string', role: 'info.ip', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('info.minPower', {
			type: 'state',
			common: {
				name: 'Min Power Limit',
				type: 'number',
				role: 'value.power',
				read: true,
				write: false,
				unit: 'W',
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('info.maxPower', {
			type: 'state',
			common: {
				name: 'Max Power Limit',
				type: 'number',
				role: 'value.power',
				read: true,
				write: true,
				unit: 'W',
			},
			native: {},
		});

		// output channels
		await this.setObjectNotExistsAsync('output', { type: 'channel', common: { name: 'Output Data' }, native: {} });
		await this.setObjectNotExistsAsync('output.channel1', {
			type: 'channel',
			common: { name: 'Channel 1' },
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel1.power', {
			type: 'state',
			common: { name: 'Power Ch1', type: 'number', role: 'value.power', read: true, write: false, unit: 'W' },
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel1.energySinceStartup', {
			type: 'state',
			common: {
				name: 'Energy since startup Ch1',
				type: 'number',
				role: 'value.energy',
				read: true,
				write: false,
				unit: 'kWh',
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel1.energyLifetime', {
			type: 'state',
			common: {
				name: 'Lifetime energy Ch1',
				type: 'number',
				role: 'value.energy',
				read: true,
				write: false,
				unit: 'kWh',
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel2', {
			type: 'channel',
			common: { name: 'Channel 2' },
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel2.power', {
			type: 'state',
			common: { name: 'Power Ch2', type: 'number', role: 'value.power', read: true, write: false, unit: 'W' },
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel2.energySinceStartup', {
			type: 'state',
			common: {
				name: 'Energy since startup Ch2',
				type: 'number',
				role: 'value.energy',
				read: true,
				write: false,
				unit: 'kWh',
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('output.channel2.energyLifetime', {
			type: 'state',
			common: {
				name: 'Lifetime energy Ch2',
				type: 'number',
				role: 'value.energy',
				read: true,
				write: false,
				unit: 'kWh',
			},
			native: {},
		});
		await this.setObjectNotExistsAsync('output.totalPower', {
			type: 'state',
			common: {
				name: 'Total Power (Ch1 + Ch2)',
				type: 'number',
				role: 'value.power',
				read: true,
				write: false,
				unit: 'W',
			},
			native: {},
		});

		// connection state (ioBroker standard)
		await this.setObjectNotExistsAsync('info.connection', {
			type: 'state',
			common: { name: 'Connection', type: 'boolean', role: 'indicator.connected', read: true, write: false },
			native: {},
		});

		// alarm channel
		await this.setObjectNotExistsAsync('alarm', { type: 'channel', common: { name: 'Alarms' }, native: {} });
		await this.setObjectNotExistsAsync('alarm.offGrid', {
			type: 'state',
			common: { name: 'Off Grid', type: 'boolean', role: 'indicator.alarm', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('alarm.outputFault', {
			type: 'state',
			common: { name: 'Output Fault', type: 'boolean', role: 'indicator.alarm', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('alarm.dc1ShortCircuit', {
			type: 'state',
			common: { name: 'DC 1 Short Circuit', type: 'boolean', role: 'indicator.alarm', read: true, write: false },
			native: {},
		});
		await this.setObjectNotExistsAsync('alarm.dc2ShortCircuit', {
			type: 'state',
			common: { name: 'DC 2 Short Circuit', type: 'boolean', role: 'indicator.alarm', read: true, write: false },
			native: {},
		});

		// device channel
		await this.setObjectNotExistsAsync('device', {
			type: 'channel',
			common: { name: 'Device Control' },
			native: {},
		});
		await this.setObjectNotExistsAsync('device.status', {
			type: 'state',
			common: {
				name: 'On/Off (true = On, false = Off)',
				type: 'boolean',
				role: 'switch',
				read: true,
				write: true,
			},
			native: {},
		});
	}

	async poll() {
		const tasks = [
			{ name: 'getDeviceInfo', fn: () => this.fetchDeviceInfo() },
			{ name: 'getOutputData', fn: () => this.fetchOutputData() },
			{ name: 'getAlarm', fn: () => this.fetchAlarm() },
			{ name: 'getOnOff', fn: () => this.fetchOnOff() },
		];
		let connected = true;
		for (const task of tasks) {
			try {
				await task.fn();
			} catch (e) {
				connected = false;
				this.logConnectionError(`${task.name} failed: ${e.message}`);
			}
		}
		await this.setState('info.connection', { val: connected, ack: true });
	}

	/**
	 * Log a connection/poll error — suppressed to debug if the user opted in.
	 *
	 * @param {string} message - Error message to log
	 */
	logConnectionError(message) {
		if (this.config.suppressConnectionErrors) {
			this.log.debug(message);
		} else {
			this.log.warn(message);
		}
	}

	/**
	 * Perform a GET request to the EZ1 local API.
	 *
	 * @param {string} path - API path including query string, e.g. '/getOutputData'
	 * @returns {Promise<Record<string, any>>} Parsed JSON response
	 */
	apiGet(path) {
		return new Promise((resolve, reject) => {
			const url = `http://${this.config.ipAddress}:8050${path}`;
			const req = http.get(url, { timeout: 5000 }, res => {
				let raw = '';
				res.on('data', chunk => (raw += chunk));
				res.on('error', reject);
				res.on('end', () => {
					try {
						const json = JSON.parse(raw);
						if (json.message !== 'SUCCESS') {
							reject(new Error(`API error: ${json.message}`));
						} else {
							resolve(json);
						}
					} catch (e) {
						reject(new Error(`Invalid JSON response from ${url}: ${e.message}`));
					}
				});
			});
			req.on('error', reject);
			req.on('timeout', () => {
				req.destroy();
				reject(new Error(`Request timed out: ${url}`));
			});
		});
	}

	async fetchDeviceInfo() {
		const { data } = await this.apiGet('/getDeviceInfo');
		await this.setState('info.deviceId', { val: String(data.deviceId), ack: true });
		await this.setState('info.devVer', { val: String(data.devVer), ack: true });
		await this.setState('info.ssid', { val: String(data.ssid), ack: true });
		await this.setState('info.ipAddr', { val: String(data.ipAddr), ack: true });
		await this.setState('info.minPower', { val: parseFloat(data.minPower), ack: true });
		await this.setState('info.maxPower', { val: parseFloat(data.maxPower), ack: true });
	}

	async fetchOutputData() {
		const { data } = await this.apiGet('/getOutputData');
		await this.setState('output.channel1.power', { val: data.p1, ack: true });
		await this.setState('output.channel1.energySinceStartup', { val: data.e1, ack: true });
		await this.setState('output.channel1.energyLifetime', { val: data.te1, ack: true });
		await this.setState('output.channel2.power', { val: data.p2, ack: true });
		await this.setState('output.channel2.energySinceStartup', { val: data.e2, ack: true });
		await this.setState('output.channel2.energyLifetime', { val: data.te2, ack: true });
		await this.setState('output.totalPower', { val: data.p1 + data.p2, ack: true });
	}

	async fetchAlarm() {
		const { data } = await this.apiGet('/getAlarm');
		await this.setState('alarm.offGrid', { val: data.og === '1', ack: true });
		await this.setState('alarm.outputFault', { val: data.oe === '1', ack: true });
		await this.setState('alarm.dc1ShortCircuit', { val: data.isce1 === '1', ack: true });
		await this.setState('alarm.dc2ShortCircuit', { val: data.isce2 === '1', ack: true });
	}

	async fetchOnOff() {
		const { data } = await this.apiGet('/getOnOff');
		// API: status "0" = On, "1" = Off
		await this.setState('device.status', { val: data.status === '0', ack: true });
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 *
	 * @param {() => void} callback - Callback function
	 */
	onUnload(callback) {
		try {
			if (this.pollTimer) {
				this.clearInterval(this.pollTimer);
				this.pollTimer = null;
			}
			callback();
		} catch {
			callback();
		}
	}

	/**
	 * Is called if a subscribed state changes
	 *
	 * @param {string} id - State ID
	 * @param {ioBroker.State | null | undefined} state - State object
	 */
	onStateChange(id, state) {
		if (!state || state.ack) {
			return;
		}

		const localId = id.replace(`${this.namespace}.`, '');

		if (localId === 'device.status') {
			// true = On → status=0, false = Off → status=1
			const apiStatus = state.val ? '0' : '1';
			this.apiGet(`/setOnOff?status=${apiStatus}`)
				.then(() => this.setState('device.status', { val: state.val, ack: true }))
				.catch(async e => {
					this.log.error(`setOnOff failed: ${e.message}`);
					// revert UI to actual device state
					const current = await this.getStateAsync('device.status');
					if (current) {
						await this.setState('device.status', { val: current.val, ack: true });
					}
				});
		} else if (localId === 'info.maxPower') {
			const power = Math.round(Number(state.val));
			this.apiGet(`/setMaxPower?p=${power}`)
				.then(() => this.setState('info.maxPower', { val: power, ack: true }))
				.catch(e => this.log.error(`setMaxPower failed: ${e.message}`));
		}
	}
}

if (require.main !== module) {
	// Export the constructor in compact mode
	/**
	 * @param {Partial<utils.AdapterOptions>} [options] - Adapter options
	 */
	module.exports = options => new ApsystemEz1Solar(options);
} else {
	// otherwise start the instance directly
	new ApsystemEz1Solar();
}

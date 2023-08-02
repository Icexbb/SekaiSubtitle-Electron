var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
import net from 'node:net';
import os from 'node:os';
var Locked = /** @class */ (function (_super) {
    __extends(Locked, _super);
    function Locked(port) {
        return _super.call(this, "".concat(port, " is locked")) || this;
    }
    return Locked;
}(Error));
var lockedPorts = {
    old: new Set(), young: new Set(),
};
// On this interval, the old locked ports are discarded,
// the young locked ports are moved to old locked ports,
// and a new young set for locked ports are created.
var releaseOldLockedPortsIntervalMs = 1000 * 15;
// const minPort = 1024;
// const maxPort = 65_535;
// Lazily create timeout on first use
var timeout;
var getLocalHosts = function () {
    var interfaces = os.networkInterfaces();
    // Add undefined value for createServer function to use default host,
    // and default IPv4 host in case createServer defaults to IPv6.
    var results = new Set([undefined, '0.0.0.0']);
    for (var _i = 0, _a = Object.values(interfaces); _i < _a.length; _i++) {
        var _interface = _a[_i];
        for (var _b = 0, _interface_1 = _interface; _b < _interface_1.length; _b++) {
            var config = _interface_1[_b];
            results.add(config.address);
        }
    }
    return results;
};
var checkAvailablePort = function (options) { return new Promise(function (resolve, reject) {
    var server = net.createServer();
    server.unref();
    server.on('error', reject);
    server.listen(options, function () {
        var port = server.address().port;
        server.close(function () {
            resolve(port);
        });
    });
}); };
var getAvailablePort = function (options, hosts) { return __awaiter(void 0, void 0, void 0, function () {
    var _i, hosts_1, host, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (options.host || options.port === 0) {
                    return [2 /*return*/, checkAvailablePort(options)];
                }
                _i = 0, hosts_1 = hosts;
                _a.label = 1;
            case 1:
                if (!(_i < hosts_1.length)) return [3 /*break*/, 6];
                host = hosts_1[_i];
                _a.label = 2;
            case 2:
                _a.trys.push([2, 4, , 5]);
                return [4 /*yield*/, checkAvailablePort({ port: options.port, host: host })];
            case 3:
                _a.sent(); // eslint-disable-line no-await-in-loop
                return [3 /*break*/, 5];
            case 4:
                error_1 = _a.sent();
                if (!['EADDRNOTAVAIL', 'EINVAL'].includes(error_1.code)) {
                    throw error_1;
                }
                return [3 /*break*/, 5];
            case 5:
                _i++;
                return [3 /*break*/, 1];
            case 6: return [2 /*return*/, options.port];
        }
    });
}); };
var portCheckSequence = function (ports) {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (!ports) return [3 /*break*/, 2];
                return [5 /*yield**/, __values(ports)];
            case 1:
                _a.sent();
                _a.label = 2;
            case 2: return [4 /*yield*/, 0];
            case 3:
                _a.sent(); // Fall back to 0 if anything else failed
                return [2 /*return*/];
        }
    });
};
export default function getPorts(options) {
    return __awaiter(this, void 0, void 0, function () {
        var ports, exclude, excludeIterable, _i, excludeIterable_1, element, hosts, _a, _b, port, availablePort, error_2;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    exclude = new Set();
                    if (options) {
                        if (options.port) {
                            ports = typeof options.port === 'number' ? [options.port] : options.port;
                        }
                        if (options.exclude) {
                            excludeIterable = options.exclude;
                            if (typeof excludeIterable[Symbol.iterator] !== 'function') {
                                throw new TypeError('The `exclude` option must be an iterable.');
                            }
                            for (_i = 0, excludeIterable_1 = excludeIterable; _i < excludeIterable_1.length; _i++) {
                                element = excludeIterable_1[_i];
                                if (typeof element !== 'number') {
                                    throw new TypeError('Each item in the `exclude` option must be a number corresponding to the port you want excluded.');
                                }
                                if (!Number.isSafeInteger(element)) {
                                    throw new TypeError("Number ".concat(element, " in the exclude option is not a safe integer and can't be used"));
                                }
                            }
                            exclude = new Set(excludeIterable);
                        }
                    }
                    if (timeout === undefined) {
                        timeout = setTimeout(function () {
                            timeout = undefined;
                            lockedPorts.old = lockedPorts.young;
                            lockedPorts.young = new Set();
                        }, releaseOldLockedPortsIntervalMs);
                        // Does not exist in some environments (Electron, Jest jsdom env, browser, etc).
                        if (timeout.unref) {
                            timeout.unref();
                        }
                    }
                    hosts = getLocalHosts();
                    _a = 0, _b = portCheckSequence(ports);
                    _c.label = 1;
                case 1:
                    if (!(_a < _b.length)) return [3 /*break*/, 9];
                    port = _b[_a];
                    _c.label = 2;
                case 2:
                    _c.trys.push([2, 7, , 8]);
                    if (exclude.has(port)) {
                        return [3 /*break*/, 8];
                    }
                    return [4 /*yield*/, getAvailablePort(__assign(__assign({}, options), { port: port }), hosts)];
                case 3:
                    availablePort = _c.sent();
                    _c.label = 4;
                case 4:
                    if (!(lockedPorts.old.has(availablePort) || lockedPorts.young.has(availablePort))) return [3 /*break*/, 6];
                    if (port !== 0) {
                        throw new Locked(port);
                    }
                    return [4 /*yield*/, getAvailablePort(__assign(__assign({}, options), { port: port }), hosts)];
                case 5:
                    availablePort = _c.sent(); // eslint-disable-line no-await-in-loop
                    return [3 /*break*/, 4];
                case 6:
                    lockedPorts.young.add(availablePort);
                    return [2 /*return*/, availablePort];
                case 7:
                    error_2 = _c.sent();
                    if (!['EADDRINUSE', 'EACCES'].includes(error_2.code) && !(error_2 instanceof Locked)) {
                        throw error_2;
                    }
                    return [3 /*break*/, 8];
                case 8:
                    _a++;
                    return [3 /*break*/, 1];
                case 9: throw new Error('No available ports found');
            }
        });
    });
}
//
// export function portNumbers(from, to) {
// 	if (!Number.isInteger(from) || !Number.isInteger(to)) {
// 		throw new TypeError('`from` and `to` must be integer numbers');
// 	}
//
// 	if (from < minPort || from > maxPort) {
// 		throw new RangeError(`'from' must be between ${minPort} and ${maxPort}`);
// 	}
//
// 	if (to < minPort || to > maxPort) {
// 		throw new RangeError(`'to' must be between ${minPort} and ${maxPort}`);
// 	}
//
// 	if (from > to) {
// 		throw new RangeError('`to` must be greater than or equal to `from`');
// 	}
//
// 	const generator = function* (from, to) {
// 		for (let port = from; port <= to; port++) {
// 			yield port;
// 		}
// 	};
//
// 	return generator(from, to);
// }

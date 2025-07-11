var __defProp = Object.defineProperty;
var __typeError = (msg) => {
  throw TypeError(msg);
};
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
var __accessCheck = (obj, member, msg) => member.has(obj) || __typeError("Cannot " + msg);
var __privateGet = (obj, member, getter) => (__accessCheck(obj, member, "read from private field"), getter ? getter.call(obj) : member.get(obj));
var __privateAdd = (obj, member, value) => member.has(obj) ? __typeError("Cannot add the same private member more than once") : member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
var __privateSet = (obj, member, value, setter) => (__accessCheck(obj, member, "write to private field"), setter ? setter.call(obj, value) : member.set(obj, value), value);
var __privateMethod = (obj, member, method) => (__accessCheck(obj, member, "access private method"), method);
var _client, _ctx, _logger, _objectPropertyMapping, _objectLinkMapping, _getConjureObjectType, _instances, _ws, _lastWsConnect, _client2, _logger2, _pendingSubscriptions, _subscriptions, _endedSubscriptions, _maybeDisconnectTimeout, _ObjectSetListenerWebsocket_instances, initiateSubscribe_fn, sendSubscribeMessage_fn, unsubscribe_fn, ensureWebsocket_fn, _onOpen, _onMessage, _handleMessage_objectSetChanged, fetchInterfaceMapping_fn, _handleMessage_refreshObjectSet, _handleMessage_subscribeResponses, handleMessage_subscriptionClosed_fn, _onClose, _cycleWebsocket, _tryCatchOnError, _triplet, _client3, _mediaReference, _triplet2, _client4, _triplet3, _client5, _factory, _a, _b;
var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
function getDefaultExportFromCjs(x) {
  return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
}
function getDefaultExportFromNamespaceIfPresent(n) {
  return n && Object.prototype.hasOwnProperty.call(n, "default") ? n["default"] : n;
}
function getDefaultExportFromNamespaceIfNotNamed(n) {
  return n && Object.prototype.hasOwnProperty.call(n, "default") && Object.keys(n).length === 1 ? n["default"] : n;
}
function getAugmentedNamespace(n) {
  if (Object.prototype.hasOwnProperty.call(n, "__esModule")) return n;
  var f = n.default;
  if (typeof f == "function") {
    var a = function a2() {
      if (this instanceof a2) {
        return Reflect.construct(f, arguments, this.constructor);
      }
      return f.apply(this, arguments);
    };
    a.prototype = f.prototype;
  } else a = {};
  Object.defineProperty(a, "__esModule", { value: true });
  Object.keys(n).forEach(function(k) {
    var d = Object.getOwnPropertyDescriptor(n, k);
    Object.defineProperty(a, k, d.get ? d : {
      enumerable: true,
      get: function() {
        return n[k];
      }
    });
  });
  return a;
}
const DistanceUnitMapping = {
  "centimeter": "CENTIMETERS",
  "centimeters": "CENTIMETERS",
  "cm": "CENTIMETERS",
  "meter": "METERS",
  "meters": "METERS",
  "m": "METERS",
  "kilometer": "KILOMETERS",
  "kilometers": "KILOMETERS",
  "km": "KILOMETERS",
  "inch": "INCHES",
  "inches": "INCHES",
  "foot": "FEET",
  "feet": "FEET",
  "yard": "YARDS",
  "yards": "YARDS",
  "mile": "MILES",
  "miles": "MILES",
  "nautical_mile": "NAUTICAL_MILES",
  "nauticalMile": "NAUTICAL_MILES",
  "nautical miles": "NAUTICAL_MILES"
};
const TimeDurationMapping = {
  "sec": "SECONDS",
  "seconds": "SECONDS",
  "min": "MINUTES",
  "minute": "MINUTES",
  "minutes": "MINUTES",
  "hr": "HOURS",
  "hrs": "HOURS",
  "hour": "HOURS",
  "hours": "HOURS",
  "day": "DAYS",
  "days": "DAYS",
  "wk": "WEEKS",
  "week": "WEEKS",
  "weeks": "WEEKS",
  "mos": "MONTHS",
  "month": "MONTHS",
  "months": "MONTHS",
  "yr": "YEARS",
  "year": "YEARS",
  "years": "YEARS"
};
const DurationMapping = {
  ...TimeDurationMapping,
  "quarter": "QUARTERS",
  "quarters": "QUARTERS"
};
function isOk(a) {
  return "value" in a;
}
function isError(a) {
  return "error" in a;
}
const TimeseriesDurationMapping = {
  "ms": "MILLISECONDS",
  "milliseconds": "MILLISECONDS",
  ...TimeDurationMapping
};
let PalantirApiError$1 = class PalantirApiError extends Error {
  constructor(message, errorName, errorCode, statusCode, errorInstanceId, parameters) {
    super(message);
    this.message = message;
    this.errorName = errorName;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errorInstanceId = errorInstanceId;
    this.parameters = parameters;
  }
};
let UnknownError$1 = class UnknownError extends PalantirApiError$1 {
  constructor(message, errorName, originalError, statusCode) {
    super(message, errorName, void 0, statusCode);
    this.originalError = originalError;
  }
};
class ActionValidationError extends Error {
  constructor(validation) {
    super("Validation Error: " + JSON.stringify(validation, null, 2));
    this.validation = validation;
  }
}
const __EXPERIMENTAL__NOT_SUPPORTED_YET__createMediaReference = {
  name: "__EXPERIMENTAL__NOT_SUPPORTED_YET__createMediaReference",
  type: "experiment",
  version: "2.1.0"
};
const __EXPERIMENTAL__NOT_SUPPORTED_YET__fetchOneByRid = {
  name: "__EXPERIMENTAL__NOT_SUPPORTED_YET__fetchOneByRid",
  type: "experiment",
  version: "2.1.0"
};
const __EXPERIMENTAL__NOT_SUPPORTED_YET__fetchPageByRid = {
  name: "__EXPERIMENTAL__NOT_SUPPORTED_YET__fetchPageByRid",
  type: "experiment",
  version: "2.2.0"
};
const __EXPERIMENTAL__NOT_SUPPORTED_YET__getBulkLinks = {
  name: "__EXPERIMENTAL__NOT_SUPPORTED_YET__getBulkLinks",
  type: "experiment",
  version: "2.0.8"
};
const symbolClientContext$1 = Symbol("ClientContext");
const symbolClientContext = "__osdkClientContext";
class PalantirApiError2 extends Error {
  constructor(message, errorName, errorCode, statusCode, errorInstanceId, parameters) {
    super(message);
    this.message = message;
    this.errorName = errorName;
    this.errorCode = errorCode;
    this.statusCode = statusCode;
    this.errorInstanceId = errorInstanceId;
    this.parameters = parameters;
  }
}
class UnknownError2 extends PalantirApiError2 {
  constructor(message, errorType, originalError) {
    super(message, errorType);
    this.originalError = originalError;
  }
}
async function foundryPlatformFetch(client, [httpMethodNum, origPath, flags, contentType, responseContentType], ...args) {
  const path = origPath.replace(/\{([^}]+)\}/g, () => encodeURIComponent(args.shift()));
  const body = flags & 1 ? args.shift() : void 0;
  const queryArgs = flags & 2 ? args.shift() : void 0;
  const headerArgs = flags & 4 ? args.shift() : void 0;
  const method = ["GET", "POST", "PUT", "DELETE", "PATCH"][httpMethodNum];
  return await apiFetch(client[symbolClientContext] ?? client[symbolClientContext$1] ?? client, method, path, body, queryArgs, headerArgs, contentType, responseContentType);
}
async function apiFetch(clientCtx, method, endpointPath, data, queryArguments, headers, requestMediaType, responseMediaType) {
  const url = parseUrl(clientCtx.baseUrl, endpointPath);
  for (const [key, value] of Object.entries(queryArguments || {})) {
    if (value == null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        url.searchParams.append(key, item);
      }
    } else {
      url.searchParams.append(key, value);
    }
  }
  const headersInit = new Headers();
  headersInit.set("Content-Type", requestMediaType ?? "application/json");
  headersInit.set("Accept", responseMediaType ?? "application/json");
  Object.entries(headers || {}).forEach(([key, value]) => {
    if (value != null) {
      headersInit.append(key, value.toString());
    }
  });
  const body = data == null || data instanceof globalThis.Blob ? data : JSON.stringify(data);
  const response = await clientCtx.fetch(url.toString(), {
    body,
    method,
    headers: headersInit
  });
  if (!response.ok) {
    try {
      const convertedError = await response.json();
      return new PalantirApiError2(convertedError.message, convertedError.errorName, convertedError.errorCode, response.status, convertedError.errorInstanceId, convertedError.parameters);
    } catch (e2) {
      if (e2 instanceof Error) {
        return new UnknownError2(e2.message, "UNKNOWN");
      }
      return new UnknownError2("Unable to parse error response", "UNKNOWN");
    }
  }
  if (response.status === 204) {
    return;
  }
  if (responseMediaType == null || responseMediaType === "application/json") {
    return await response.json();
  }
  return response;
}
function parseUrl(baseUrl, endpointPath) {
  baseUrl += baseUrl.endsWith("/") ? "" : "/";
  return new URL(`api${endpointPath}`, baseUrl);
}
const _apply = [1, "/v2/ontologies/{0}/actions/{1}/apply", 3];
function apply($ctx, ...args) {
  return foundryPlatformFetch($ctx, _apply, ...args);
}
const _applyAsync = [1, "/v2/ontologies/{0}/actions/{1}/applyAsync", 3];
function applyAsync($ctx, ...args) {
  return foundryPlatformFetch($ctx, _applyAsync, ...args);
}
const _applyBatch = [1, "/v2/ontologies/{0}/actions/{1}/applyBatch", 3];
function applyBatch($ctx, ...args) {
  return foundryPlatformFetch($ctx, _applyBatch, ...args);
}
const Action = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  apply,
  applyAsync,
  applyBatch
}, Symbol.toStringTag, { value: "Module" }));
const _list$f = [0, "/v2/ontologies/{0}/actionTypes", 2];
function list$f($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$f, ...args);
}
const _get$h = [0, "/v2/ontologies/{0}/actionTypes/{1}", 2];
function get$h($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$h, ...args);
}
const _getByRid = [0, "/v2/ontologies/{0}/actionTypes/byRid/{1}", 2];
function getByRid($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getByRid, ...args);
}
const ActionTypeV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$h,
  getByRid,
  list: list$f
}, Symbol.toStringTag, { value: "Module" }));
const _upload$1 = [1, "/v2/ontologies/attachments/upload", 7, "*/*"];
function upload$1($ctx, ...args) {
  var _a2;
  const headerParams = {
    ...args[2],
    "Content-Type": ((_a2 = args[2]) == null ? void 0 : _a2["Content-Type"]) ?? args[0].type,
    "Content-Length": args[0].size.toString()
  };
  return foundryPlatformFetch($ctx, _upload$1, args[0], args[1], headerParams);
}
const _read = [0, "/v2/ontologies/attachments/{0}/content", , , "*/*"];
function read($ctx, ...args) {
  return foundryPlatformFetch($ctx, _read, ...args);
}
const _get$g = [0, "/v2/ontologies/attachments/{0}"];
function get$g($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$g, ...args);
}
const Attachment = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$g,
  read,
  upload: upload$1
}, Symbol.toStringTag, { value: "Module" }));
const _getAttachment = [0, "/v2/ontologies/{0}/objects/{1}/{2}/attachments/{3}", 2];
function getAttachment($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getAttachment, ...args);
}
const _getAttachmentByRid = [0, "/v2/ontologies/{0}/objects/{1}/{2}/attachments/{3}/{4}", 2];
function getAttachmentByRid($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getAttachmentByRid, ...args);
}
const _readAttachment = [0, "/v2/ontologies/{0}/objects/{1}/{2}/attachments/{3}/content", 2, , "*/*"];
function readAttachment($ctx, ...args) {
  return foundryPlatformFetch($ctx, _readAttachment, ...args);
}
const _readAttachmentByRid = [0, "/v2/ontologies/{0}/objects/{1}/{2}/attachments/{3}/{4}/content", 2, , "*/*"];
function readAttachmentByRid($ctx, ...args) {
  return foundryPlatformFetch($ctx, _readAttachmentByRid, ...args);
}
const AttachmentPropertyV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getAttachment,
  getAttachmentByRid,
  readAttachment,
  readAttachmentByRid
}, Symbol.toStringTag, { value: "Module" }));
const _decrypt = [0, "/v2/ontologies/{0}/objects/{1}/{2}/ciphertexts/{3}/decrypt"];
function decrypt($ctx, ...args) {
  return foundryPlatformFetch($ctx, _decrypt, ...args);
}
const CipherTextProperty = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  decrypt
}, Symbol.toStringTag, { value: "Module" }));
const _listLinkedObjects = [0, "/v2/ontologies/{0}/objects/{1}/{2}/links/{3}", 2];
function listLinkedObjects($ctx, ...args) {
  return foundryPlatformFetch($ctx, _listLinkedObjects, ...args);
}
const _getLinkedObject = [0, "/v2/ontologies/{0}/objects/{1}/{2}/links/{3}/{4}", 2];
function getLinkedObject($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getLinkedObject, ...args);
}
const LinkedObjectV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getLinkedObject,
  listLinkedObjects
}, Symbol.toStringTag, { value: "Module" }));
const _getMediaContent = [0, "/v2/ontologies/{0}/objects/{1}/{2}/media/{3}/content", 2, , "*/*"];
function getMediaContent($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getMediaContent, ...args);
}
const _getMediaMetadata = [0, "/v2/ontologies/{0}/objects/{1}/{2}/media/{3}/metadata", 2];
function getMediaMetadata($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getMediaMetadata, ...args);
}
const _upload = [1, "/v2/ontologies/{0}/objectTypes/{1}/media/{2}/upload", 3, "*/*"];
function upload($ctx, ...args) {
  return foundryPlatformFetch($ctx, _upload, ...args);
}
const _uploadMedia = [1, "/v2/ontologies/{0}/actions/{1}/media/upload", 3, "*/*"];
function uploadMedia($ctx, ...args) {
  return foundryPlatformFetch($ctx, _uploadMedia, ...args);
}
const MediaReferenceProperty = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getMediaContent,
  getMediaMetadata,
  upload,
  uploadMedia
}, Symbol.toStringTag, { value: "Module" }));
const _list$e = [0, "/v2/ontologies/{0}/objectTypes", 2];
function list$e($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$e, ...args);
}
const _get$f = [0, "/v2/ontologies/{0}/objectTypes/{1}", 2];
function get$f($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$f, ...args);
}
const _getFullMetadata$1 = [0, "/v2/ontologies/{0}/objectTypes/{1}/fullMetadata", 2];
function getFullMetadata$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getFullMetadata$1, ...args);
}
const _listOutgoingLinkTypes = [0, "/v2/ontologies/{0}/objectTypes/{1}/outgoingLinkTypes", 2];
function listOutgoingLinkTypes($ctx, ...args) {
  return foundryPlatformFetch($ctx, _listOutgoingLinkTypes, ...args);
}
const _getOutgoingLinkType = [0, "/v2/ontologies/{0}/objectTypes/{1}/outgoingLinkTypes/{2}", 2];
function getOutgoingLinkType($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getOutgoingLinkType, ...args);
}
const ObjectTypeV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$f,
  getFullMetadata: getFullMetadata$1,
  getOutgoingLinkType,
  list: list$e,
  listOutgoingLinkTypes
}, Symbol.toStringTag, { value: "Module" }));
const _list$d = [0, "/v2/ontologies/{0}/interfaceTypes", 2];
function list$d($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$d, ...args);
}
const _get$e = [0, "/v2/ontologies/{0}/interfaceTypes/{1}", 2];
function get$e($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$e, ...args);
}
const _search$3 = [1, "/v2/ontologies/{0}/interfaces/{1}/search", 3];
function search$3($ctx, ...args) {
  return foundryPlatformFetch($ctx, _search$3, ...args);
}
const _aggregate$2 = [1, "/v2/ontologies/{0}/interfaces/{1}/aggregate", 3];
function aggregate$3($ctx, ...args) {
  return foundryPlatformFetch($ctx, _aggregate$2, ...args);
}
const OntologyInterface = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  aggregate: aggregate$3,
  get: get$e,
  list: list$d,
  search: search$3
}, Symbol.toStringTag, { value: "Module" }));
const _createTemporary = [1, "/v2/ontologies/{0}/objectSets/createTemporary", 1];
function createTemporary($ctx, ...args) {
  return foundryPlatformFetch($ctx, _createTemporary, ...args);
}
const _get$d = [0, "/v2/ontologies/{0}/objectSets/{1}"];
function get$d($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$d, ...args);
}
const _load = [1, "/v2/ontologies/{0}/objectSets/loadObjects", 3];
function load($ctx, ...args) {
  return foundryPlatformFetch($ctx, _load, ...args);
}
const _loadMultipleObjectTypes = [1, "/v2/ontologies/{0}/objectSets/loadObjectsMultipleObjectTypes", 3];
function loadMultipleObjectTypes($ctx, ...args) {
  return foundryPlatformFetch($ctx, _loadMultipleObjectTypes, ...args);
}
const _loadObjectsOrInterfaces = [1, "/v2/ontologies/{0}/objectSets/loadObjectsOrInterfaces", 3];
function loadObjectsOrInterfaces($ctx, ...args) {
  return foundryPlatformFetch($ctx, _loadObjectsOrInterfaces, ...args);
}
const _aggregate$1 = [1, "/v2/ontologies/{0}/objectSets/aggregate", 3];
function aggregate$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _aggregate$1, ...args);
}
const OntologyObjectSet = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  aggregate: aggregate$2,
  createTemporary,
  get: get$d,
  load,
  loadMultipleObjectTypes,
  loadObjectsOrInterfaces
}, Symbol.toStringTag, { value: "Module" }));
const _list$c = [0, "/v2/ontologies/{0}/objects/{1}", 2];
function list$c($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$c, ...args);
}
const _get$c = [0, "/v2/ontologies/{0}/objects/{1}/{2}", 2];
function get$c($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$c, ...args);
}
const _count = [1, "/v2/ontologies/{0}/objects/{1}/count", 2];
function count($ctx, ...args) {
  return foundryPlatformFetch($ctx, _count, ...args);
}
const _search$2 = [1, "/v2/ontologies/{0}/objects/{1}/search", 3];
function search$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _search$2, ...args);
}
const _aggregate = [1, "/v2/ontologies/{0}/objects/{1}/aggregate", 3];
function aggregate$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _aggregate, ...args);
}
const OntologyObjectV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  aggregate: aggregate$1,
  count,
  get: get$c,
  list: list$c,
  search: search$2
}, Symbol.toStringTag, { value: "Module" }));
const _list$b = [0, "/v2/ontologies"];
function list$b($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$b, ...args);
}
const _get$b = [0, "/v2/ontologies/{0}"];
function get$b($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$b, ...args);
}
const _getFullMetadata = [0, "/v2/ontologies/{0}/fullMetadata", 2];
function getFullMetadata($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getFullMetadata, ...args);
}
const _loadMetadata = [1, "/v2/ontologies/{0}/metadata", 3];
function loadMetadata($ctx, ...args) {
  return foundryPlatformFetch($ctx, _loadMetadata, ...args);
}
const OntologyV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$b,
  getFullMetadata,
  list: list$b,
  loadMetadata
}, Symbol.toStringTag, { value: "Module" }));
const _execute = [1, "/v2/ontologies/{0}/queries/{1}/execute", 3];
function execute($ctx, ...args) {
  return foundryPlatformFetch($ctx, _execute, ...args);
}
const Query = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  execute
}, Symbol.toStringTag, { value: "Module" }));
const _list$a = [0, "/v2/ontologies/{0}/queryTypes", 2];
function list$a($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$a, ...args);
}
const _get$a = [0, "/v2/ontologies/{0}/queryTypes/{1}", 2];
function get$a($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$a, ...args);
}
const QueryType = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$a,
  list: list$a
}, Symbol.toStringTag, { value: "Module" }));
const _getFirstPoint = [0, "/v2/ontologies/{0}/objects/{1}/{2}/timeseries/{3}/firstPoint", 2];
function getFirstPoint($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getFirstPoint, ...args);
}
const _getLastPoint = [0, "/v2/ontologies/{0}/objects/{1}/{2}/timeseries/{3}/lastPoint", 2];
function getLastPoint($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getLastPoint, ...args);
}
const _streamPoints = [1, "/v2/ontologies/{0}/objects/{1}/{2}/timeseries/{3}/streamPoints", 3, , "*/*"];
function streamPoints($ctx, ...args) {
  return foundryPlatformFetch($ctx, _streamPoints, ...args);
}
const TimeSeriesPropertyV2 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getFirstPoint,
  getLastPoint,
  streamPoints
}, Symbol.toStringTag, { value: "Module" }));
const _getLatestValue = [0, "/v2/ontologies/{0}/objects/{1}/{2}/timeseries/{3}/latestValue", 2];
function getLatestValue($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getLatestValue, ...args);
}
const _streamValues = [1, "/v2/ontologies/{0}/objects/{1}/{2}/timeseries/{3}/streamValues", 3, , "*/*"];
function streamValues($ctx, ...args) {
  return foundryPlatformFetch($ctx, _streamValues, ...args);
}
const TimeSeriesValueBankProperty = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getLatestValue,
  streamValues
}, Symbol.toStringTag, { value: "Module" }));
async function conjureFetch({ fetchFn, baseUrl, servicePath, tokenProvider }, url, method, body, params, contentType, accept) {
  if (body) {
    if (body instanceof URLSearchParams || body instanceof Blob || body instanceof FormData || typeof body === "string" || body instanceof ArrayBuffer) ;
    else {
      body = JSON.stringify(body);
    }
  }
  const queryParams = Object.entries(params ?? {}).flatMap(
    ([key, value]) => {
      if (value == null) {
        return [];
      }
      if (Array.isArray(value)) {
        return value.map((item) => [key, item]);
      }
      const stringValue = "" + value;
      return stringValue.length === 0 ? [] : [[key, stringValue]];
    }
  );
  const query = Object.keys(queryParams).length === 0 ? "" : `?${new URLSearchParams(queryParams).toString()}`;
  const response = await (fetchFn ?? fetch)(`${baseUrl}${servicePath}${url}${query}`, {
    method,
    credentials: "same-origin",
    headers: {
      "Fetch-User-Agent": "conjure-lite",
      "Content-Type": contentType ?? "application/json",
      accept: accept ?? "application/json",
      ...tokenProvider ? { "Authorization": `Bearer ${await tokenProvider()}` } : {}
    },
    ...body ? { body } : {}
  });
  try {
    if (response.status === 204) {
      return void 0;
    }
    const body2 = await readBody(response);
    if (!response.ok) {
      throw new ConjureError("STATUS", void 0, response.status, body2);
    }
    return body2;
  } catch (error) {
    if (error instanceof ConjureError) {
      throw error;
    } else if (error instanceof TypeError) {
      throw new ConjureError("NETWORK", error);
    } else {
      throw new ConjureError("OTHER", error);
    }
  }
}
async function readBody(response) {
  const contentType = response.headers.get("Content-Type") != null ? response.headers.get("Content-Type") : "";
  try {
    if (contentType.includes("application/json")) {
      return await response.json();
    } else if (contentType.includes("application/octet-stream")) {
      return await response.blob();
    } else {
      return await response.text();
    }
  } catch (error) {
    throw new ConjureError("PARSE", error, response.status);
  }
}
class ConjureError {
  constructor(errorType, originalError, status, body) {
    __publicField(this, "type");
    __publicField(this, "originalError");
    __publicField(this, "status");
    __publicField(this, "body");
    this.type = errorType;
    this.originalError = originalError;
    this.status = status;
    this.body = body;
  }
  toString() {
    return JSON.stringify(
      {
        body: this.body,
        originalError: this.originalError && this.originalError.toString(),
        status: this.status,
        type: this.type
      },
      null,
      "  "
    );
  }
}
async function createTemporaryObjectSet(ctx, request) {
  return conjureFetch(ctx, `/objectSets/temporary`, "POST", request);
}
async function getBulkLinksPage(ctx, request) {
  return conjureFetch(ctx, `/bulk-links`, "PUT", request);
}
async function bulkLoadOntologyEntities(ctx, onBehalfOf, request) {
  return conjureFetch(ctx, `/ontology/ontology/bulkLoadEntities`, "POST", request);
}
async function getLinkTypesForObjectTypes(ctx, request) {
  return conjureFetch(ctx, `/ontology/linkTypesForObjectTypes`, "POST", request);
}
async function loadAllOntologies(ctx, request) {
  return conjureFetch(ctx, `/ontology/ontology/ontologies/load/all`, "POST", request);
}
var isProduction = true;
var prefix = "Invariant failed";
function invariant(condition, message) {
  if (condition) {
    return;
  }
  if (isProduction) {
    throw new Error(prefix);
  }
  var provided = typeof message === "function" ? message() : message;
  var value = provided ? "".concat(prefix, ": ").concat(provided) : prefix;
  throw new Error(value);
}
function conjureUnionType(type, value) {
  return {
    type,
    [type]: value
  };
}
function makeConjureContext({
  baseUrl,
  fetch: fetchFn,
  tokenProvider
}, servicePath) {
  return {
    baseUrl,
    servicePath,
    fetchFn,
    tokenProvider
  };
}
function getResults(x) {
  return x.results;
}
function applyPageToken(payload, {
  pageToken
}) {
  return pageToken ? {
    ...payload,
    pageToken
  } : void 0;
}
async function* pageRequestAsAsyncIter(call, values, nextArgs, initialPayload) {
  let payload = initialPayload;
  while (payload) {
    const r = await call(payload);
    for (const q of values(r)) {
      yield q;
    }
    payload = nextArgs(payload, r);
  }
}
function createSimpleCache(map = /* @__PURE__ */ new Map(), fn) {
  function set(key, value) {
    map.set(key, value);
    return value;
  }
  return {
    get: function(key) {
      let r = map.get(key);
      if (r === void 0 && fn !== void 0) {
        return set(key, fn(key));
      } else {
        return r;
      }
    },
    set,
    remove: function(key) {
      return map.delete(key);
    }
  };
}
function createSimpleAsyncCache(type, fn, createCacheLocal = createSimpleCache) {
  const cache = createCacheLocal(type === "weak" ? /* @__PURE__ */ new WeakMap() : /* @__PURE__ */ new Map());
  const inProgress = createCacheLocal(type === "weak" ? /* @__PURE__ */ new WeakMap() : /* @__PURE__ */ new Map());
  const ret = {
    getOrUndefined: function(key) {
      return cache.get(key);
    },
    get: async function(key) {
      return cache.get(key) ?? inProgress.get(key) ?? ret.set(key, fn(key));
    },
    set: async function(k, v) {
      try {
        const r = await inProgress.set(k, v);
        cache.set(k, r);
        inProgress.remove(k);
        return r;
      } catch (e2) {
        inProgress.remove(k);
        throw e2;
      }
    }
  };
  return ret;
}
let cachedAllOntologies;
async function getOntologyVersionForRid(ctx, ontologyRid) {
  cachedAllOntologies ?? (cachedAllOntologies = await loadAllOntologies(ctx, {}));
  !cachedAllOntologies.ontologies[ontologyRid] ? false ? invariant(false, "ontology should be loaded") : invariant(false) : void 0;
  return cachedAllOntologies.ontologies[ontologyRid].currentOntologyVersion;
}
const strongMemoSync = (fn) => createSimpleCache(/* @__PURE__ */ new Map(), fn).get;
const weakMemoSync = (fn) => createSimpleCache(/* @__PURE__ */ new WeakMap(), fn).get;
const strongMemoAsync = (fn) => createSimpleAsyncCache("strong", fn).get;
const weakMemoAsync = (fn) => createSimpleAsyncCache("weak", fn).get;
class MetadataClient {
  constructor(client) {
    __privateAdd(this, _client);
    __privateAdd(this, _ctx);
    __privateAdd(this, _logger);
    __publicField(this, "forObjectByRid", strongMemoAsync(async (rid) => {
      return Promise.resolve({
        getPropertyMapping: __privateGet(this, _objectPropertyMapping).bind(this, rid),
        getLinkMapping: __privateGet(this, _objectLinkMapping).bind(this, rid),
        getRid: () => rid,
        getApiName: async () => (await __privateGet(this, _getConjureObjectType).call(this, rid)).apiName
      });
    }));
    __publicField(this, "forObjectByApiName", strongMemoAsync(async (objectApiName) => {
      const objectDef = await __privateGet(this, _client).ontologyProvider.getObjectDefinition(objectApiName);
      return this.forObjectByRid(objectDef.rid);
    }));
    __privateAdd(this, _objectPropertyMapping, strongMemoAsync(async (objectTypeRid) => {
      const conjureObjectType = await __privateGet(this, _getConjureObjectType).call(this, objectTypeRid);
      return createObjectPropertyMapping(conjureObjectType);
    }));
    __privateAdd(this, _objectLinkMapping, strongMemoAsync(async (objectTypeRid) => {
      const linkTypes = await getLinkTypesForObjectTypes(__privateGet(this, _ctx), {
        includeObjectTypesWithoutSearchableDatasources: true,
        loadRedacted: false,
        objectTypeBranches: {},
        objectTypeVersions: {
          [objectTypeRid]: await this.ontologyVersion("")
        }
      });
      !linkTypes.linkTypes[objectTypeRid] ? false ? invariant(false, "link type should be loaded") : invariant(false) : void 0;
      const ret = {};
      for (const l of linkTypes.linkTypes[objectTypeRid]) {
        const helper = ({
          apiName
        }, linkSide, otherObjectType) => {
          if (apiName) {
            ret[apiName] = {
              apiName,
              directedLinkTypeRid: {
                linkTypeRid: l.rid,
                linkSide
              },
              otherObjectType
            };
          }
        };
        if (l.definition.type === "oneToMany") {
          const {
            oneToMany: {
              objectTypeRidManySide,
              manyToOneLinkMetadata,
              objectTypeRidOneSide,
              oneToManyLinkMetadata
            }
          } = l.definition;
          if (objectTypeRidManySide === objectTypeRid) {
            helper(manyToOneLinkMetadata, "TARGET", objectTypeRidOneSide);
          }
          if (objectTypeRidOneSide === objectTypeRid) {
            helper(oneToManyLinkMetadata, "SOURCE", objectTypeRidManySide);
          }
        } else if (l.definition.type === "manyToMany") {
          const {
            manyToMany: {
              objectTypeRidA,
              objectTypeAToBLinkMetadata,
              objectTypeRidB,
              objectTypeBToALinkMetadata
            }
          } = l.definition;
          if (objectTypeRidA === objectTypeRid) {
            helper(objectTypeAToBLinkMetadata, "SOURCE", objectTypeRidB);
          }
          if (objectTypeRidB === objectTypeRid) {
            helper(objectTypeBToALinkMetadata, "TARGET", objectTypeRidA);
          }
        }
      }
      return ret;
    }));
    __privateAdd(this, _getConjureObjectType, strongMemoAsync(async (objectTypeRid) => {
      var _a2, _b2;
      (_a2 = __privateGet(this, _logger)) == null ? void 0 : _a2.debug(`getConjureObjectType(${objectTypeRid})`);
      const body = {
        datasourceTypes: [],
        objectTypes: [{
          identifier: {
            type: "objectTypeRid",
            objectTypeRid
          },
          versionReference: {
            type: "ontologyVersion",
            ontologyVersion: await this.ontologyVersion("")
          }
        }],
        linkTypes: [],
        sharedPropertyTypes: [],
        interfaceTypes: [],
        typeGroups: [],
        loadRedacted: false,
        includeObjectTypeCount: void 0,
        includeObjectTypesWithoutSearchableDatasources: true,
        includeEntityMetadata: void 0,
        actionTypes: [],
        includeTypeGroupEntitiesCount: void 0,
        entityMetadata: void 0
      };
      const entities = await bulkLoadOntologyEntities(__privateGet(this, _ctx), void 0, body);
      !((_b2 = entities.objectTypes[0]) == null ? void 0 : _b2.objectType) ? false ? invariant(false, "object type should be loaded") : invariant(false) : void 0;
      return entities.objectTypes[0].objectType;
    }));
    __publicField(this, "ontologyVersion", strongMemoAsync(async () => getOntologyVersionForRid(__privateGet(this, _ctx), await __privateGet(this, _client).ontologyRid)));
    var _a2;
    __privateSet(this, _client, client);
    __privateSet(this, _ctx, makeConjureContext(client, "ontology-metadata/api"));
    __privateGet(this, _client).ontologyProvider.getObjectDefinition;
    __privateSet(this, _logger, (_a2 = __privateGet(this, _client).logger) == null ? void 0 : _a2.child({
      mcc: true
    }));
  }
}
_client = new WeakMap();
_ctx = new WeakMap();
_logger = new WeakMap();
_objectPropertyMapping = new WeakMap();
_objectLinkMapping = new WeakMap();
_getConjureObjectType = new WeakMap();
const metadataCacheClient = weakMemoAsync((client) => Promise.resolve(new MetadataClient(client)));
function createObjectPropertyMapping(conjureOT) {
  !(conjureOT.primaryKeys.length === 1) ? false ? invariant(false, `only one primary key supported, got ${conjureOT.primaryKeys.length}`) : invariant(false) : void 0;
  const pkRid = conjureOT.primaryKeys[0];
  const pkProperty = Object.values(conjureOT.propertyTypes).find((a) => a.rid === pkRid);
  if (!pkProperty) {
    throw new Error(`Could not find PK property by rid: ${pkRid}`);
  }
  const propertyIdToApiNameMapping = Object.fromEntries(Object.values(conjureOT.propertyTypes).map((property) => {
    return [property.id, property.apiName];
  }));
  const propertyApiNameToIdMapping = Object.fromEntries(Object.values(conjureOT.propertyTypes).map((property) => {
    return [property.apiName, property.id];
  }));
  return {
    apiName: conjureOT.apiName,
    id: conjureOT.id,
    propertyIdToApiNameMapping,
    propertyApiNameToIdMapping,
    pk: {
      rid: pkRid,
      apiName: pkProperty.apiName,
      type: pkProperty.type
    }
  };
}
function createBulkLinksAsyncIterFactory(ctx) {
  return async function* (objs, linkTypes) {
    var _a2;
    if (objs.length === 0) {
      return;
    }
    (_a2 = ctx.logger) == null ? void 0 : _a2.debug("Preparing to fetch bulk links");
    !objs.every((a) => a.$objectType === objs[0].$objectType) ? false ? invariant(false) : invariant(false) : void 0;
    const mcc = await metadataCacheClient(ctx);
    const helper = await mcc.forObjectByApiName(objs[0].$objectType);
    const [objectTypeRid, propertyMapping, fullLinkMapping] = await Promise.all([helper.getRid(), helper.getPropertyMapping(), helper.getLinkMapping()]);
    const linkMapping = Object.fromEntries(Object.entries(fullLinkMapping).filter(([apiName]) => linkTypes.includes(apiName)));
    for (const linkType of linkTypes) {
      if (linkMapping[linkType] == null) {
        throw "Unable to find link type: " + linkType;
      }
    }
    const req = {
      objectSetContext: {
        forkRid: void 0,
        objectSetFilterContext: {
          parameterOverrides: {}
        },
        ontologyBranchRid: void 0,
        owningRid: void 0,
        reportUsage: void 0,
        workstateRid: void 0
      },
      responseOptions: {
        includeObjectSetEntities: true,
        includeUsageCost: false
      },
      pageSize: 1e3,
      pageToken: void 0,
      linksRequests: [{
        directedLinkTypes: Object.values(linkMapping).map(({
          directedLinkTypeRid
        }) => directedLinkTypeRid),
        objects: conjureUnionType("objects", objs.map((o) => conjureUnionType("objectLocatorV2", {
          objectTypeRid,
          objectPrimaryKey: {
            [propertyMapping.pk.rid]: conjureUnionType(propertyMapping.pk.type.type, o.$primaryKey)
          }
        })))
      }]
    };
    const bulkLinksIter = pageRequestAsAsyncIter(getBulkLinksPage.bind(void 0, makeConjureContext(ctx, "object-set-service/api")), getResults, (prevReq, prevResult) => applyPageToken({
      ...prevReq,
      pageToken: prevResult.pageToken
    }, {
      pageToken: prevResult.pageToken
    }), req);
    for await (const item of bulkLinksIter) {
      const {
        objectIdentifier
      } = item;
      const obj = findObject(objectIdentifier, objs);
      for (const link of item.links) {
        const ref = link.link[link.linkSide === "SOURCE" ? "objectSideB" : "objectSideA"];
        const pk = getPrimaryKeyOrThrow(ref);
        const otherObjectApiName = await (await mcc.forObjectByRid(pk.objectTypeRid)).getApiName();
        const mappedLink = Object.values(linkMapping).find((a) => a.directedLinkTypeRid.linkTypeRid === link.link.linkTypeRid && a.directedLinkTypeRid.linkSide === link.linkSide);
        if (!mappedLink) throw new Error("Could not find link type");
        yield {
          object: obj,
          linkApiName: mappedLink.apiName,
          otherObjectApiName,
          otherObjectPk: pk.pkValue
        };
      }
    }
  };
}
function findObject(objectIdentifier, objs) {
  const {
    pkValue
  } = getPrimaryKeyOrThrow(objectIdentifier);
  const obj = objs.find((o) => o.$primaryKey === pkValue);
  if (obj == null) {
    throw new Error(`Needed to find object with pk ${pkValue}} and could not`);
  }
  return obj;
}
function getPrimaryKeyOrThrow(ref) {
  if ("type" in ref && ref.type !== "objectLocatorV2") {
    throw new Error("We do not support looking up object by rid");
  }
  const pks = Object.entries(ref.objectLocatorV2.objectPrimaryKey);
  if (pks.length !== 1) {
    throw new Error("Unable to support this request due to multiple pks");
  }
  return {
    objectTypeRid: ref.objectLocatorV2.objectTypeRid,
    pkValue: pks[0][1][pks[0][1].type]
  };
}
function createFetchHeaderMutator(fetchFn = fetch, mutator) {
  return async function(url, requestInit) {
    if (!requestInit) {
      return fetchFn(url, {
        headers: await mutator(new Headers())
      });
    }
    return fetchFn(url, {
      ...requestInit,
      headers: await mutator(new Headers(requestInit.headers))
    });
  };
}
function createFetchOrThrow(fetchFn = fetch) {
  return async function(url, requestInit) {
    let response;
    try {
      response = await fetchFn(url, requestInit);
    } catch (e2) {
      throw convertError(e2, "A network error occurred");
    }
    if (!response.ok) {
      const fallbackMessage = `Failed to fetch ${response.status} ${response.statusText}`;
      if (response.headers.get("Content-Type") === "text/plain") {
        throw unknownError(await response.text(), response.status);
      }
      if (response.headers.get("Content-Type") === "text/html") {
        throw unknownError(fallbackMessage, response.status, new Error("Received HTML error page: " + await response.text()));
      }
      let body;
      try {
        body = await response.json();
      } catch (e2) {
        throw unknownError(fallbackMessage, response.status, e2 instanceof Error ? e2 : void 0);
      }
      throw new PalantirApiError$1((body == null ? void 0 : body.message) ?? fallbackMessage, body == null ? void 0 : body.errorName, body == null ? void 0 : body.errorCode, response.status, body == null ? void 0 : body.errorInstanceId, body == null ? void 0 : body.parameters);
    }
    return response;
  };
}
function convertError(e2, msgIfNotError = "An unknown error occurred") {
  if (e2 instanceof Error) {
    return unknownError(e2.message, void 0, e2);
  }
  return unknownError(msgIfNotError, void 0);
}
function unknownError(message, statusCode, originalError) {
  return new UnknownError$1(message, void 0, originalError, statusCode);
}
var fetchRetry_umd$1 = { exports: {} };
var fetchRetry_umd = fetchRetry_umd$1.exports;
var hasRequiredFetchRetry_umd;
function requireFetchRetry_umd() {
  if (hasRequiredFetchRetry_umd) return fetchRetry_umd$1.exports;
  hasRequiredFetchRetry_umd = 1;
  (function(module, exports) {
    (function(global2, factory) {
      true ? module.exports = factory() : false ? (void 0)(factory) : (global2 = typeof globalThis !== "undefined" ? globalThis : global2 || self, global2.fetchRetry = factory());
    })(fetchRetry_umd, function() {
      "use strict";
      var fetchRetry2 = function(fetch2, defaults) {
        defaults = defaults || {};
        if (typeof fetch2 !== "function") {
          throw new ArgumentError("fetch must be a function");
        }
        if (typeof defaults !== "object") {
          throw new ArgumentError("defaults must be an object");
        }
        if (defaults.retries !== void 0 && !isPositiveInteger(defaults.retries)) {
          throw new ArgumentError("retries must be a positive integer");
        }
        if (defaults.retryDelay !== void 0 && !isPositiveInteger(defaults.retryDelay) && typeof defaults.retryDelay !== "function") {
          throw new ArgumentError("retryDelay must be a positive integer or a function returning a positive integer");
        }
        if (defaults.retryOn !== void 0 && !Array.isArray(defaults.retryOn) && typeof defaults.retryOn !== "function") {
          throw new ArgumentError("retryOn property expects an array or function");
        }
        var baseDefaults = {
          retries: 3,
          retryDelay: 1e3,
          retryOn: []
        };
        defaults = Object.assign(baseDefaults, defaults);
        return function fetchRetry3(input, init) {
          var retries = defaults.retries;
          var retryDelay = defaults.retryDelay;
          var retryOn = defaults.retryOn;
          if (init && init.retries !== void 0) {
            if (isPositiveInteger(init.retries)) {
              retries = init.retries;
            } else {
              throw new ArgumentError("retries must be a positive integer");
            }
          }
          if (init && init.retryDelay !== void 0) {
            if (isPositiveInteger(init.retryDelay) || typeof init.retryDelay === "function") {
              retryDelay = init.retryDelay;
            } else {
              throw new ArgumentError("retryDelay must be a positive integer or a function returning a positive integer");
            }
          }
          if (init && init.retryOn) {
            if (Array.isArray(init.retryOn) || typeof init.retryOn === "function") {
              retryOn = init.retryOn;
            } else {
              throw new ArgumentError("retryOn property expects an array or function");
            }
          }
          return new Promise(function(resolve, reject) {
            var wrappedFetch = function(attempt) {
              var _input = typeof Request !== "undefined" && input instanceof Request ? input.clone() : input;
              fetch2(_input, init).then(function(response) {
                if (Array.isArray(retryOn) && retryOn.indexOf(response.status) === -1) {
                  resolve(response);
                } else if (typeof retryOn === "function") {
                  try {
                    return Promise.resolve(retryOn(attempt, null, response)).then(function(retryOnResponse) {
                      if (retryOnResponse) {
                        retry(attempt, null, response);
                      } else {
                        resolve(response);
                      }
                    }).catch(reject);
                  } catch (error) {
                    reject(error);
                  }
                } else {
                  if (attempt < retries) {
                    retry(attempt, null, response);
                  } else {
                    resolve(response);
                  }
                }
              }).catch(function(error) {
                if (typeof retryOn === "function") {
                  try {
                    Promise.resolve(retryOn(attempt, error, null)).then(function(retryOnResponse) {
                      if (retryOnResponse) {
                        retry(attempt, error, null);
                      } else {
                        reject(error);
                      }
                    }).catch(function(error2) {
                      reject(error2);
                    });
                  } catch (error2) {
                    reject(error2);
                  }
                } else if (attempt < retries) {
                  retry(attempt, error, null);
                } else {
                  reject(error);
                }
              });
            };
            function retry(attempt, error, response) {
              var delay2 = typeof retryDelay === "function" ? retryDelay(attempt, error, response) : retryDelay;
              setTimeout(function() {
                wrappedFetch(++attempt);
              }, delay2);
            }
            wrappedFetch(0);
          });
        };
      };
      function isPositiveInteger(value) {
        return Number.isInteger(value) && value >= 0;
      }
      function ArgumentError(message) {
        this.name = "ArgumentError";
        this.message = message;
      }
      return fetchRetry2;
    });
  })(fetchRetry_umd$1, fetchRetry_umd$1.exports);
  return fetchRetry_umd$1.exports;
}
var fetchRetry_umdExports = requireFetchRetry_umd();
const fetchRetry = /* @__PURE__ */ getDefaultExportFromCjs(fetchRetry_umdExports);
const INITIAL_DELAY = 1e3;
const JITTER_FACTOR = 0.5;
const MAX_RETRIES = 3;
function createRetryingFetch(fetch2) {
  return fetchRetry(fetch2, {
    retryDelay(attempt) {
      const delay2 = INITIAL_DELAY * 2 ** attempt;
      const jitter = delay2 * JITTER_FACTOR * (Math.random() * 2 - 1);
      return delay2 + jitter;
    },
    retryOn(attempt, error, response) {
      const status = (response == null ? void 0 : response.status) ?? 0;
      return !(status >= 200 && status < 300) && isRetryable(error) && attempt < MAX_RETRIES;
    }
  });
}
function isRetryable(e2) {
  if (e2 instanceof PalantirApiError$1) {
    if (e2.statusCode !== SERVICE_UNAVAILABLE && e2.statusCode !== TOO_MANY_REQUESTS) {
      return false;
    }
  }
  return true;
}
const SERVICE_UNAVAILABLE = 503;
const TOO_MANY_REQUESTS = 429;
const addUserAgentAndRequestContextHeaders = (client, withMetadata) => ({
  ...client,
  fetch: createFetchHeaderMutator(client.fetch, (headers) => {
    headers.set("X-OSDK-Request-Context", JSON.stringify(client.requestContext));
    if (withMetadata.osdkMetadata) {
      headers.set("Fetch-User-Agent", withMetadata.osdkMetadata.extraUserAgent);
    }
    return headers;
  })
});
const augmentRequestContext = (client, augment2) => ({
  ...client,
  requestContext: {
    ...client.requestContext,
    ...augment2(client.requestContext)
  }
});
function isAttachmentUpload(o) {
  return typeof o === `object` && "name" in o && "data" in o && o.data instanceof Blob;
}
function isAttachmentFile(o) {
  return typeof o === "object" && o instanceof Blob && "name" in o;
}
function createAttachmentUpload(data, name) {
  return {
    data,
    name
  };
}
function isMediaReference(o) {
  return typeof o === `object` && typeof o.mimeType === "string" && "reference" in o && typeof o.reference === "object" && o.reference.type === "mediaSetViewItem" && "mediaSetViewItem" in o.reference && typeof o.reference.mediaSetViewItem === "object" && typeof o.reference.mediaSetViewItem.mediaSetRid === "string" && typeof o.reference.mediaSetViewItem.mediaSetViewRid === "string" && typeof o.reference.mediaSetViewItem.mediaItemRid === "string";
}
function isMediaUpload(o) {
  return typeof o === "object" && "path" in o && typeof o.path === "string" && "data" in o && typeof o.data === "object" && o.data instanceof Blob;
}
function extractNamespace(fqApiName) {
  const last = fqApiName.lastIndexOf(".");
  if (last === -1) return [void 0, fqApiName];
  return [fqApiName.slice(0, last), fqApiName.slice(last + 1)];
}
function modernToLegacyWhereClause(whereClause, objectOrInterface) {
  if ("$and" in whereClause) {
    return {
      type: "and",
      value: whereClause.$and.map((clause) => modernToLegacyWhereClause(clause, objectOrInterface))
    };
  } else if ("$or" in whereClause) {
    return {
      type: "or",
      value: whereClause.$or.map((clause) => modernToLegacyWhereClause(clause, objectOrInterface))
    };
  } else if ("$not" in whereClause) {
    return {
      type: "not",
      value: modernToLegacyWhereClause(whereClause.$not, objectOrInterface)
    };
  }
  const parts = Object.entries(whereClause);
  if (parts.length === 1) {
    return handleWherePair(parts[0], objectOrInterface);
  }
  return {
    type: "and",
    value: parts.map((v) => handleWherePair(v, objectOrInterface))
  };
}
function makeGeoFilterBbox(bbox, filterType, propertyIdentifier, field) {
  return {
    type: filterType === "$within" ? "withinBoundingBox" : "intersectsBoundingBox",
    /**
     * This is a bit ugly, but did this so that propertyIdentifier only shows up in the return object if its defined,
     * this makes it so we don't need to go update our entire test bed either to include a field which may change in near future.
     * Once we solidify that this is the way forward, I can remove field and clean this up
     */
    ...propertyIdentifier != null && {
      propertyIdentifier
    },
    field,
    value: {
      topLeft: {
        type: "Point",
        coordinates: [bbox[0], bbox[3]]
      },
      bottomRight: {
        type: "Point",
        coordinates: [bbox[2], bbox[1]]
      }
    }
  };
}
function makeGeoFilterPolygon(coordinates, filterType, propertyIdentifier, field) {
  return {
    type: filterType,
    ...propertyIdentifier != null && {
      propertyIdentifier
    },
    field,
    value: {
      type: "Polygon",
      coordinates
    }
  };
}
function handleWherePair([fieldName, filter], objectOrInterface, structFieldSelector) {
  !(filter != null) ? false ? invariant(false, "Defined key values are only allowed when they are not undefined.") : invariant(false) : void 0;
  const propertyIdentifier = structFieldSelector != null ? {
    type: "structField",
    ...structFieldSelector,
    propertyApiName: fullyQualifyPropName(structFieldSelector.propertyApiName, objectOrInterface)
  } : void 0;
  const field = structFieldSelector == null ? fullyQualifyPropName(fieldName, objectOrInterface) : void 0;
  if (typeof filter === "string" || typeof filter === "number" || typeof filter === "boolean") {
    return {
      type: "eq",
      ...propertyIdentifier != null && {
        propertyIdentifier
      },
      field,
      value: filter
    };
  }
  const keysOfFilter = Object.keys(filter);
  const hasDollarSign = keysOfFilter.some((key) => key.startsWith("$"));
  !(!hasDollarSign || keysOfFilter.length === 1) ? false ? invariant(false, "A WhereClause Filter with multiple clauses/fields is not allowed. Instead, use an 'or'/'and' clause to combine multiple filters.") : invariant(false) : void 0;
  if (!hasDollarSign) {
    const structFilter = Object.entries(filter);
    !(structFilter.length === 1) ? false ? invariant(false, "Cannot filter on more than one struct field in the same clause, need to use an and clause") : invariant(false) : void 0;
    const structFieldApiName = keysOfFilter[0];
    return handleWherePair(Object.entries(filter)[0], objectOrInterface, {
      propertyApiName: fieldName,
      structFieldApiName
    });
  }
  const firstKey = keysOfFilter[0];
  !(filter[firstKey] != null) ? false ? invariant(false) : invariant(false) : void 0;
  if (firstKey === "$ne") {
    return {
      type: "not",
      value: {
        type: "eq",
        ...propertyIdentifier != null && {
          propertyIdentifier
        },
        field,
        value: filter[firstKey]
      }
    };
  }
  if (firstKey === "$within") {
    const withinBody = filter[firstKey];
    if (Array.isArray(withinBody)) {
      return makeGeoFilterBbox(withinBody, firstKey, propertyIdentifier, field);
    } else if ("$bbox" in withinBody && withinBody.$bbox != null) {
      return makeGeoFilterBbox(withinBody.$bbox, firstKey, propertyIdentifier, field);
    } else if ("$distance" in withinBody && "$of" in withinBody && withinBody.$distance != null && withinBody.$of != null) {
      return {
        type: "withinDistanceOf",
        ...propertyIdentifier != null && {
          propertyIdentifier
        },
        field,
        value: {
          center: Array.isArray(withinBody.$of) ? {
            type: "Point",
            coordinates: withinBody.$of
          } : withinBody.$of,
          distance: {
            value: withinBody.$distance[0],
            unit: DistanceUnitMapping[withinBody.$distance[1]]
          }
        }
      };
    } else {
      const coordinates = "$polygon" in withinBody ? withinBody.$polygon : withinBody.coordinates;
      return makeGeoFilterPolygon(coordinates, "withinPolygon", propertyIdentifier, fieldName);
    }
  }
  if (firstKey === "$intersects") {
    const intersectsBody = filter[firstKey];
    if (Array.isArray(intersectsBody)) {
      return makeGeoFilterBbox(intersectsBody, firstKey, propertyIdentifier, field);
    } else if ("$bbox" in intersectsBody && intersectsBody.$bbox != null) {
      return makeGeoFilterBbox(intersectsBody.$bbox, firstKey, propertyIdentifier, field);
    } else {
      const coordinates = "$polygon" in intersectsBody ? intersectsBody.$polygon : intersectsBody.coordinates;
      return makeGeoFilterPolygon(coordinates, "intersectsPolygon", propertyIdentifier, field);
    }
  }
  if (firstKey === "$containsAllTerms" || firstKey === "$containsAnyTerm") {
    return {
      type: firstKey.substring(1),
      ...propertyIdentifier != null && {
        propertyIdentifier
      },
      field,
      value: typeof filter[firstKey] === "string" ? filter[firstKey] : filter[firstKey]["term"],
      fuzzy: typeof filter[firstKey] === "string" ? false : filter[firstKey]["fuzzySearch"] ?? false
    };
  }
  return {
    type: firstKey.substring(1),
    ...propertyIdentifier != null && {
      propertyIdentifier
    },
    field,
    value: filter[firstKey]
  };
}
function fullyQualifyPropName(fieldName, objectOrInterface) {
  if (objectOrInterface.type === "interface") {
    const [objApiNamespace] = extractNamespace(objectOrInterface.apiName);
    const [fieldApiNamespace, fieldShortName] = extractNamespace(fieldName);
    return fieldApiNamespace == null && objApiNamespace != null ? `${objApiNamespace}.${fieldShortName}` : fieldName;
  }
  return fieldName;
}
function derivedPropertyDefinitionFactory(wireDefinition, definitionMap) {
  const definition = {
    abs() {
      return derivedPropertyDefinitionFactory({
        type: "absoluteValue",
        property: wireDefinition
      }, definitionMap);
    },
    negate() {
      return derivedPropertyDefinitionFactory({
        type: "negate",
        property: wireDefinition
      }, definitionMap);
    },
    max(value) {
      return derivedPropertyDefinitionFactory({
        type: "greatest",
        properties: [wireDefinition, getDefinitionFromMap(value, definitionMap)]
      }, definitionMap);
    },
    min(value) {
      return derivedPropertyDefinitionFactory({
        type: "least",
        properties: [wireDefinition, getDefinitionFromMap(value, definitionMap)]
      }, definitionMap);
    },
    add(value) {
      return derivedPropertyDefinitionFactory({
        type: "add",
        properties: [wireDefinition, getDefinitionFromMap(value, definitionMap)]
      }, definitionMap);
    },
    subtract(value) {
      return derivedPropertyDefinitionFactory({
        "type": "subtract",
        "left": wireDefinition,
        "right": getDefinitionFromMap(value, definitionMap)
      }, definitionMap);
    },
    multiply(value) {
      return derivedPropertyDefinitionFactory({
        type: "multiply",
        properties: [wireDefinition, getDefinitionFromMap(value, definitionMap)]
      }, definitionMap);
    },
    divide(value) {
      return derivedPropertyDefinitionFactory({
        "type": "subtract",
        "left": wireDefinition,
        "right": getDefinitionFromMap(value, definitionMap)
      }, definitionMap);
    },
    extractPart: (part) => {
      return derivedPropertyDefinitionFactory({
        type: "extract",
        part,
        property: wireDefinition
      }, definitionMap);
    }
  };
  definitionMap.set(definition, wireDefinition);
  return definition;
}
const getDefinitionFromMap = (arg, definitionMap) => {
  if (typeof arg === "object") {
    const definition = definitionMap.get(arg);
    !definition ? false ? invariant(false, "Derived Property is not defined") : invariant(false) : void 0;
    return definition;
  } else if (typeof arg === "number") {
    false ? invariant(false, "Literals for derived properties are not yet supported") : invariant(false);
  }
  false ? invariant(false, "Invalid argument type for a derived property") : invariant(false);
};
function createWithPropertiesObjectSet(objectType, objectSet, definitionMap, fromBaseObjectSet = false) {
  return {
    pivotTo: (link) => {
      return createWithPropertiesObjectSet(objectType, {
        type: "searchAround",
        objectSet,
        link
      }, definitionMap);
    },
    where: (clause) => {
      return createWithPropertiesObjectSet(objectType, {
        type: "filter",
        objectSet,
        where: modernToLegacyWhereClause(clause, objectType)
      }, definitionMap);
    },
    aggregate: (aggregation, opt) => {
      const splitAggregation = aggregation.split(":");
      !(splitAggregation.length === 2 || splitAggregation[0] === "$count") ? false ? invariant(false, "Invalid aggregation format") : invariant(false) : void 0;
      const [aggregationPropertyName, aggregationOperation] = splitAggregation;
      let aggregationOperationDefinition;
      switch (aggregationOperation) {
        case "sum":
        case "avg":
        case "min":
        case "max":
        case "exactDistinct":
        case "approximateDistinct":
          aggregationOperationDefinition = {
            type: aggregationOperation,
            selectedPropertyApiName: aggregationPropertyName
          };
          break;
        case "approximatePercentile":
          aggregationOperationDefinition = {
            type: "approximatePercentile",
            selectedPropertyApiName: aggregationPropertyName,
            approximatePercentile: (opt == null ? void 0 : opt.percentile) ?? 0.5
          };
          break;
        case "collectSet":
        case "collectList":
          aggregationOperationDefinition = {
            type: aggregationOperation,
            selectedPropertyApiName: aggregationPropertyName,
            limit: (opt == null ? void 0 : opt.limit) ?? 100
          };
          break;
        case void 0:
          if (aggregationPropertyName === "$count") {
            aggregationOperationDefinition = {
              type: "count"
            };
            break;
          }
        default:
          false ? invariant(false, "Invalid aggregation operation " + aggregationOperation) : invariant(false);
      }
      const wrappedObjectSet = {
        type: "selection",
        objectSet,
        operation: aggregationOperationDefinition
      };
      const selectorResult = derivedPropertyDefinitionFactory(wrappedObjectSet, definitionMap);
      definitionMap.set(selectorResult, wrappedObjectSet);
      return selectorResult;
    },
    selectProperty: (name) => {
      if (fromBaseObjectSet) {
        const wrappedObjectSet2 = {
          type: "property",
          apiName: name
        };
        const selectorResult2 = derivedPropertyDefinitionFactory(wrappedObjectSet2, definitionMap);
        definitionMap.set(selectorResult2, wrappedObjectSet2);
        return selectorResult2;
      }
      const wrappedObjectSet = {
        type: "selection",
        objectSet,
        operation: {
          type: "get",
          selectedPropertyApiName: name
        }
      };
      const selectorResult = derivedPropertyDefinitionFactory(wrappedObjectSet, definitionMap);
      definitionMap.set(selectorResult, wrappedObjectSet);
      return selectorResult;
    },
    constant: {
      double: () => {
        false ? invariant(false, "Not supported") : invariant(false);
      },
      integer: () => {
        false ? invariant(false, "Not supported") : invariant(false);
      },
      long: () => {
        false ? invariant(false, "Not supported") : invariant(false);
      },
      datetime: () => {
        false ? invariant(false, "Not supported") : invariant(false);
      },
      timestamp: () => {
        false ? invariant(false, "Not supported") : invariant(false);
      }
    }
  };
}
function legacyToModernSingleAggregationResult(entry) {
  return entry.metrics.reduce((accumulator, curValue) => {
    const parts = curValue.name.split(".");
    if (parts[0] === "count") {
      return accumulator;
    }
    !(parts.length === 2) ? false ? invariant(false, "assumed we were getting a `${key}.${type}`") : invariant(false) : void 0;
    const property = parts[0];
    const metricType = parts[1];
    if (!(property in accumulator)) {
      accumulator[property] = {};
    }
    accumulator[property][metricType] = curValue.value;
    return accumulator;
  }, {});
}
const directionFieldMap = (dir) => dir === "asc" ? "ASC" : dir === "desc" ? "DESC" : void 0;
function modernToLegacyAggregationClause(select) {
  return Object.entries(select).flatMap(([propAndMetric, aggregationType]) => {
    if (propAndMetric === "$count") {
      return {
        type: "count",
        name: "count",
        direction: directionFieldMap(aggregationType)
      };
    }
    const colonPos = propAndMetric.lastIndexOf(":");
    const property = propAndMetric.slice(0, colonPos);
    const metric = propAndMetric.slice(colonPos + 1);
    return [{
      type: metric,
      name: `${property}.${metric}`,
      direction: directionFieldMap(aggregationType),
      field: property
    }];
  });
}
function modernToLegacyGroupByClause(groupByClause) {
  if (!groupByClause) return [];
  return Object.entries(groupByClause).flatMap(([field, type]) => {
    var _a2;
    if (type === "exact") {
      return [{
        type,
        field
      }];
    } else if ("$exactWithLimit" in type) {
      {
        return [{
          type: "exact",
          field,
          maxGroupCount: type.$exactWithLimit
        }];
      }
    } else if ("$exact" in type) {
      return [{
        type: "exact",
        field,
        maxGroupCount: ((_a2 = type.$exact) == null ? void 0 : _a2.$limit) ?? void 0,
        defaultValue: type.$exact.$defaultValue ?? void 0
      }];
    } else if ("$fixedWidth" in type) {
      return [{
        type: "fixedWidth",
        field,
        fixedWidth: type.$fixedWidth
      }];
    } else if ("$ranges" in type) {
      return [{
        type: "ranges",
        field,
        ranges: type.$ranges.map((range) => convertRange(range))
      }];
    } else if ("$duration" in type) {
      return [{
        type: "duration",
        field,
        value: type.$duration[0],
        unit: DurationMapping[type.$duration[1]]
      }];
    } else return [];
  });
}
function convertRange(range) {
  return {
    startValue: range[0],
    endValue: range[1]
  };
}
function resolveBaseObjectSetType(objectType) {
  return objectType.type === "interface" ? {
    type: "interfaceBase",
    interfaceType: objectType["apiName"]
  } : {
    type: "base",
    objectType: objectType["apiName"]
  };
}
async function aggregate(clientCtx, objectType, objectSet = resolveBaseObjectSetType(objectType), req) {
  resolveBaseObjectSetType(objectType);
  const body = {
    aggregation: modernToLegacyAggregationClause(req.$select),
    groupBy: [],
    where: void 0
  };
  if (req.$groupBy) {
    body.groupBy = modernToLegacyGroupByClause(req.$groupBy);
  }
  const result = await aggregate$2(addUserAgentAndRequestContextHeaders(clientCtx, objectType), await clientCtx.ontologyRid, {
    objectSet,
    groupBy: body.groupBy,
    aggregation: body.aggregation
  });
  if (!req.$groupBy) {
    !(result.data.length === 1) ? false ? invariant(false, "no group by clause should mean only one data result") : invariant(false) : void 0;
    return {
      ...aggregationToCountResult(result.data[0]),
      ...legacyToModernSingleAggregationResult(result.data[0])
    };
  }
  const ret = result.data.map((entry) => {
    return {
      $group: entry.group,
      ...aggregationToCountResult(entry),
      ...legacyToModernSingleAggregationResult(entry)
    };
  });
  return ret;
}
function aggregationToCountResult(entry) {
  for (const aggregateResult of entry.metrics) {
    if (aggregateResult.name === "count") {
      return {
        $count: aggregateResult.value
      };
    }
  }
}
async function extractRdpDefinition(clientCtx, objectSet) {
  return (await extractRdpDefinitionInternal(clientCtx, objectSet, void 0)).definitions;
}
async function extractRdpDefinitionInternal(clientCtx, objectSet, methodInputObjectType) {
  var _a2;
  switch (objectSet.type) {
    case "searchAround": {
      const {
        definitions: definitions2,
        childObjectType
      } = await extractRdpDefinitionInternal(clientCtx, objectSet.objectSet, methodInputObjectType);
      if (childObjectType === void 0 || childObjectType === "") {
        return {
          definitions: {}
        };
      }
      const objDef = await clientCtx.ontologyProvider.getObjectDefinition(childObjectType);
      const linkDef = objDef.links[objectSet.link];
      !linkDef ? false ? invariant(false, `Missing link definition for '${objectSet.link}'`) : invariant(false) : void 0;
      return {
        definitions: definitions2,
        childObjectType: objDef.links[objectSet.link].targetType
      };
    }
    case "withProperties": {
      const {
        definitions: definitions2,
        childObjectType
      } = await extractRdpDefinitionInternal(clientCtx, objectSet.objectSet, methodInputObjectType);
      if (childObjectType === void 0 || childObjectType === "") {
        return {
          definitions: {}
        };
      }
      for (const [name, definition] of Object.entries(objectSet.derivedProperties)) {
        if (definition.type !== "selection") {
          definitions2[name] = {
            selectedOrCollectedPropertyType: void 0,
            definition
          };
          continue;
        }
        switch (definition.operation.type) {
          case "collectList":
          case "collectSet":
          case "get":
            const {
              childObjectType: operationLevelObjectType
            } = await extractRdpDefinitionInternal(clientCtx, definition.objectSet, childObjectType);
            if (operationLevelObjectType === void 0 || operationLevelObjectType === "") {
              return {
                definitions: {}
              };
            }
            const objDef = await clientCtx.ontologyProvider.getObjectDefinition(operationLevelObjectType);
            definitions2[name] = {
              selectedOrCollectedPropertyType: objDef.properties[definition.operation.selectedPropertyApiName],
              definition
            };
            break;
          default:
            definitions2[name] = {
              selectedOrCollectedPropertyType: void 0,
              definition
            };
        }
      }
      return {
        definitions: definitions2,
        childObjectType
      };
    }
    case "methodInput":
      return {
        definitions: {},
        childObjectType: methodInputObjectType
      };
    case "base":
      return {
        definitions: {},
        childObjectType: objectSet.objectType
      };
    case "interfaceBase":
      return {
        definitions: {},
        childObjectType: objectSet.interfaceType
      };
    case "filter":
    case "asBaseObjectTypes":
    case "asType":
    case "nearestNeighbors":
      return extractRdpDefinitionInternal(clientCtx, objectSet.objectSet, methodInputObjectType);
    // These will throw in OSS so we should throw here so no request is made
    case "intersect":
    case "subtract":
    case "union":
      const objectSets = objectSet.objectSets;
      const objectSetTypes = await Promise.all(objectSets.map((os) => extractRdpDefinitionInternal(clientCtx, os, methodInputObjectType)));
      const definitions = objectSetTypes.reduce((acc, {
        definitions: definitions2
      }) => ({
        ...acc,
        ...definitions2
      }), {});
      !(Object.keys(definitions).length === 0) ? false ? invariant(false, "Object sets combined using intersect, subtract, or union must not contain any derived property definitions") : invariant(false) : void 0;
      const firstValidChildObjectType = (_a2 = objectSetTypes.find(({
        childObjectType
      }) => childObjectType != null)) == null ? void 0 : _a2.childObjectType;
      !objectSetTypes.every(({
        childObjectType
      }) => childObjectType === firstValidChildObjectType || childObjectType == null) ? false ? invariant(false, "All object sets in an intersect, subtract, or union must have the same child object type") : invariant(false) : void 0;
      return {
        definitions: {},
        childObjectType: firstValidChildObjectType
      };
    case "static":
    case "reference":
      return {
        definitions: {}
      };
    // We don't have to worry about new object sets being added and doing a runtime break and breaking people since the OSDK is always constructing these.
    case "interfaceLinkSearchAround":
      false ? invariant(false, `Unsupported object set type for Runtime Derived Properties`) : invariant(false);
    default:
      false ? invariant(false, `Unsupported object set type for Runtime Derived Properties`) : invariant(false);
  }
}
function augment(type, ...properties) {
  return {
    [type.apiName]: properties
  };
}
function objectSetToSearchJsonV2(objectSet, expectedApiName, existingWhere = void 0) {
  if (objectSet.type === "base" || objectSet.type === "interfaceBase") {
    if (objectSet.type === "base" && objectSet.objectType !== expectedApiName) {
      throw new Error(`Expected objectSet.objectType to be ${expectedApiName}, but got ${objectSet.objectType}`);
    }
    if (objectSet.type === "interfaceBase" && objectSet.interfaceType !== expectedApiName) {
      throw new Error(`Expected objectSet.objectType to be ${expectedApiName}, but got ${objectSet.interfaceType}`);
    }
    return existingWhere;
  }
  if (objectSet.type === "filter") {
    return objectSetToSearchJsonV2(objectSet.objectSet, expectedApiName, existingWhere == null ? objectSet.where : {
      type: "and",
      value: [existingWhere, objectSet.where]
    });
  }
  throw new Error(`Unsupported objectSet type: ${objectSet.type}`);
}
function resolveInterfaceObjectSet(objectSet, interfaceTypeApiName, args) {
  return (args == null ? void 0 : args.$includeAllBaseObjectProperties) ? {
    type: "intersect",
    objectSets: [objectSet, {
      type: "interfaceBase",
      interfaceType: interfaceTypeApiName,
      includeAllBaseObjectProperties: true
    }]
  } : objectSet;
}
async function fetchInterfacePage(client, interfaceType, args, objectSet) {
  if (args.$__UNSTABLE_useOldInterfaceApis) {
    const result2 = await search$3(addUserAgentAndRequestContextHeaders(client, interfaceType), await client.ontologyRid, interfaceType.apiName, applyFetchArgs(args, {
      augmentedProperties: {},
      augmentedSharedPropertyTypes: {},
      otherInterfaceTypes: [],
      selectedObjectTypes: [],
      selectedSharedPropertyTypes: args.$select ?? [],
      where: objectSetToSearchJsonV2(objectSet, interfaceType.apiName)
    }), {
      preview: true
    });
    result2.data = await client.objectFactory(
      client,
      result2.data,
      // drop readonly
      interfaceType.apiName,
      !args.$includeRid,
      await extractRdpDefinition(client, objectSet)
    );
    return result2;
  }
  const result = await loadMultipleObjectTypes(addUserAgentAndRequestContextHeaders(client, interfaceType), await client.ontologyRid, applyFetchArgs(args, {
    objectSet: resolveInterfaceObjectSet(objectSet, interfaceType.apiName, args),
    select: (args == null ? void 0 : args.$select) ?? [],
    excludeRid: !(args == null ? void 0 : args.$includeRid)
  }), {
    preview: true
  });
  return Promise.resolve({
    data: await client.objectFactory2(client, result.data, interfaceType.apiName, {}, !args.$includeRid, args.$select, false, result.interfaceToObjectTypeMappings),
    nextPageToken: result.nextPageToken,
    totalCount: result.totalCount
  });
}
async function fetchPageInternal(client, objectType, objectSet, args = {}) {
  if (objectType.type === "interface") {
    return await fetchInterfacePage(client, objectType, args, objectSet);
  } else {
    return await fetchObjectPage(client, objectType, args, objectSet);
  }
}
async function fetchPageWithErrorsInternal(client, objectType, objectSet, args = {}) {
  try {
    const result = await fetchPageInternal(client, objectType, objectSet, args);
    return {
      value: result
    };
  } catch (e2) {
    if (e2 instanceof Error) {
      return {
        error: e2
      };
    }
    return {
      error: e2
    };
  }
}
async function fetchPage(client, objectType, args, objectSet = resolveBaseObjectSetType(objectType)) {
  return fetchPageInternal(client, objectType, objectSet, args);
}
async function fetchPageWithErrors(client, objectType, args, objectSet = resolveBaseObjectSetType(objectType)) {
  return fetchPageWithErrorsInternal(client, objectType, objectSet, args);
}
function applyFetchArgs(args, body) {
  if (args == null ? void 0 : args.$nextPageToken) {
    body.pageToken = args.$nextPageToken;
  }
  if ((args == null ? void 0 : args.$pageSize) != null) {
    body.pageSize = args.$pageSize;
  }
  if ((args == null ? void 0 : args.$orderBy) != null) {
    body.orderBy = {
      fields: Object.entries(args.$orderBy).map(([field, direction]) => ({
        field,
        direction
      }))
    };
  }
  return body;
}
async function fetchObjectPage(client, objectType, args, objectSet) {
  const r = await load(addUserAgentAndRequestContextHeaders(client, objectType), await client.ontologyRid, applyFetchArgs(args, {
    objectSet,
    // We have to do the following case because LoadObjectSetRequestV2 isn't readonly
    select: (args == null ? void 0 : args.$select) ?? [],
    // FIXME?
    excludeRid: !(args == null ? void 0 : args.$includeRid)
  }));
  return Promise.resolve({
    data: await client.objectFactory(client, r.data, void 0, void 0, await extractRdpDefinition(client, objectSet), args.$select),
    nextPageToken: r.nextPageToken,
    totalCount: r.totalCount
  });
}
async function fetchSingle(client, objectType, args, objectSet) {
  const result = await fetchPage(client, objectType, {
    ...args,
    $pageSize: 1
  }, objectSet);
  if (result.data.length !== 1 || result.nextPageToken != null) {
    throw new PalantirApiError$1(`Expected a single result but got ${result.data.length} instead${result.nextPageToken != null ? " with nextPageToken set" : ""}`);
  }
  return result.data[0];
}
async function fetchSingleWithErrors(client, objectType, args, objectSet) {
  try {
    const result = await fetchSingle(client, objectType, args, objectSet);
    return {
      value: result
    };
  } catch (e2) {
    if (e2 instanceof Error) {
      return {
        error: e2
      };
    }
    return {
      error: e2
    };
  }
}
const WIRE_OBJECT_SET_TYPES = /* @__PURE__ */ new Set(["base", "filter", "intersect", "reference", "searchAround", "static", "subtract", "union"]);
function isWireObjectSet(o) {
  return o != null && typeof o === "object" && WIRE_OBJECT_SET_TYPES.has(o.type);
}
var ws = null;
if (typeof WebSocket !== "undefined") {
  ws = WebSocket;
} else if (typeof MozWebSocket !== "undefined") {
  ws = MozWebSocket;
} else if (typeof global !== "undefined") {
  ws = global.WebSocket || global.MozWebSocket;
} else if (typeof window !== "undefined") {
  ws = window.WebSocket || window.MozWebSocket;
} else if (typeof self !== "undefined") {
  ws = self.WebSocket || self.MozWebSocket;
}
const WebSocket$1 = ws;
const MINIMUM_RECONNECT_DELAY_MS = 5 * 1e3;
function doNothing() {
}
function fillOutListener({
  onChange = doNothing,
  onError = doNothing,
  onOutOfDate = doNothing,
  onSuccessfulSubscription = doNothing
}) {
  return {
    onChange,
    onError,
    onOutOfDate,
    onSuccessfulSubscription
  };
}
function isReady(sub) {
  return sub.isReady != null;
}
function subscriptionIsDone(sub) {
  return sub.status === "done" || sub.status === "error";
}
const _ObjectSetListenerWebsocket = class _ObjectSetListenerWebsocket {
  // DO NOT CONSTRUCT DIRECTLY. ONLY EXPOSED AS A TESTING SEAM
  constructor(client, {
    minimumReconnectDelayMs = MINIMUM_RECONNECT_DELAY_MS
  } = {}) {
    __privateAdd(this, _ObjectSetListenerWebsocket_instances);
    __privateAdd(this, _ws);
    __privateAdd(this, _lastWsConnect, 0);
    __privateAdd(this, _client2);
    __privateAdd(this, _logger2);
    /**
     * map of requestId to all active subscriptions at the time of the request
     */
    __privateAdd(this, _pendingSubscriptions, /* @__PURE__ */ new Map());
    /**
     * Map of subscriptionId to Subscription. Note: the subscriptionId may be
     * temporary and not the actual subscriptionId from the server.
     */
    __privateAdd(this, _subscriptions, /* @__PURE__ */ new Map());
    __privateAdd(this, _endedSubscriptions, /* @__PURE__ */ new Set());
    __privateAdd(this, _maybeDisconnectTimeout);
    __privateAdd(this, _onOpen, () => {
      __privateMethod(this, _ObjectSetListenerWebsocket_instances, sendSubscribeMessage_fn).call(this);
    });
    __privateAdd(this, _onMessage, async (message) => {
      const data = JSON.parse(message.data.toString());
      if (false) {
        (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug({
          payload: data
        }, "received message from ws");
      }
      switch (data.type) {
        case "objectSetChanged":
          await __privateGet(this, _handleMessage_objectSetChanged).call(this, data);
          return;
        case "refreshObjectSet":
          __privateGet(this, _handleMessage_refreshObjectSet).call(this, data);
          return;
        case "subscribeResponses":
          __privateGet(this, _handleMessage_subscribeResponses).call(this, data);
          return;
        case "subscriptionClosed": {
          __privateMethod(this, _ObjectSetListenerWebsocket_instances, handleMessage_subscriptionClosed_fn).call(this, data);
          return;
        }
        default:
          false ? invariant(false, "Unexpected message type") : invariant(false);
      }
    });
    __privateAdd(this, _handleMessage_objectSetChanged, async (payload) => {
      var _a2, _b2, _c, _d, _e, _f;
      const sub = __privateGet(this, _subscriptions).get(payload.id);
      if (sub == null) return;
      const objectUpdates = payload.updates.filter((update) => update.type === "object");
      const referenceUpdates = payload.updates.filter((update) => update.type === "reference");
      const osdkObjectsWithReferenceUpdates = await Promise.all(referenceUpdates.map(async (o) => {
        const osdkObjectArray = await __privateGet(this, _client2).objectFactory2(__privateGet(this, _client2), [{
          __apiName: o.objectType,
          __primaryKey: sub.primaryKeyPropertyName != null ? o.primaryKey[sub.primaryKeyPropertyName] : void 0,
          ...o.primaryKey,
          [o.property]: o.value
        }], sub.interfaceApiName, {}, false, void 0, false, await __privateMethod(this, _ObjectSetListenerWebsocket_instances, fetchInterfaceMapping_fn).call(this, o.objectType, sub.interfaceApiName));
        const singleOsdkObject = osdkObjectArray[0] ?? void 0;
        return singleOsdkObject != null ? {
          object: singleOsdkObject,
          state: "ADDED_OR_UPDATED"
        } : void 0;
      }));
      for (const update of osdkObjectsWithReferenceUpdates) {
        if (update != null) {
          try {
            (_b2 = (_a2 = sub.listener).onChange) == null ? void 0 : _b2.call(_a2, update);
          } catch (error) {
            (_c = __privateGet(this, _logger2)) == null ? void 0 : _c.error(error, "Error in onChange callback");
            __privateGet(this, _tryCatchOnError).call(this, sub, false, error);
          }
        }
      }
      const osdkObjects = await Promise.all(objectUpdates.map(async (o) => {
        const keysToDelete = Object.keys(o.object).filter((key) => sub.requestedReferenceProperties.includes(key));
        for (const key of keysToDelete) {
          delete o.object[key];
        }
        const osdkObjectArray = await __privateGet(this, _client2).objectFactory2(__privateGet(this, _client2), [o.object], sub.interfaceApiName, {}, false, void 0, false, await __privateMethod(this, _ObjectSetListenerWebsocket_instances, fetchInterfaceMapping_fn).call(this, o.object.__apiName, sub.interfaceApiName));
        const singleOsdkObject = osdkObjectArray[0] ?? void 0;
        return singleOsdkObject != null ? {
          object: singleOsdkObject,
          state: o.state
        } : void 0;
      }));
      for (const osdkObject of osdkObjects) {
        if (osdkObject != null) {
          try {
            (_e = (_d = sub.listener).onChange) == null ? void 0 : _e.call(_d, osdkObject);
          } catch (error) {
            (_f = __privateGet(this, _logger2)) == null ? void 0 : _f.error(error, "Error in onChange callback");
            __privateGet(this, _tryCatchOnError).call(this, sub, false, error);
          }
        }
      }
    });
    __privateAdd(this, _handleMessage_refreshObjectSet, (payload) => {
      var _a2;
      const sub = __privateGet(this, _subscriptions).get(payload.id);
      !sub ? false ? invariant(false, `Expected subscription id ${payload.id}`) : invariant(false) : void 0;
      try {
        sub.listener.onOutOfDate();
      } catch (error) {
        (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.error(error, "Error in onOutOfDate callback");
        __privateGet(this, _tryCatchOnError).call(this, sub, false, error);
      }
    });
    __privateAdd(this, _handleMessage_subscribeResponses, (payload) => {
      var _b2;
      const {
        id,
        responses
      } = payload;
      const subs = __privateGet(this, _pendingSubscriptions).get(id);
      !subs ? false ? invariant(false, `should have a pending subscription for ${id}`) : invariant(false) : void 0;
      __privateGet(this, _pendingSubscriptions).delete(id);
      for (let i = 0; i < responses.length; i++) {
        const sub = subs[i];
        const response = responses[i];
        switch (response.type) {
          case "error":
            __privateGet(this, _tryCatchOnError).call(this, sub, true, response.errors);
            __privateMethod(this, _ObjectSetListenerWebsocket_instances, unsubscribe_fn).call(this, sub, "error");
            break;
          case "qos":
            __privateGet(this, _cycleWebsocket).call(this);
            break;
          case "success":
            const shouldFireOutOfDate = sub.status === "expired" || sub.status === "reconnecting";
            if (false) {
              (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug({
                shouldFireOutOfDate
              }, "success");
            }
            sub.status = "subscribed";
            if (sub.subscriptionId !== response.id) {
              __privateGet(this, _subscriptions).delete(sub.subscriptionId);
              sub.subscriptionId = response.id;
              __privateGet(this, _subscriptions).set(sub.subscriptionId, sub);
            }
            try {
              if (shouldFireOutOfDate) sub.listener.onOutOfDate();
              else sub.listener.onSuccessfulSubscription();
            } catch (error) {
              (_b2 = __privateGet(this, _logger2)) == null ? void 0 : _b2.error(error, "Error in onOutOfDate or onSuccessfulSubscription callback");
              __privateGet(this, _tryCatchOnError).call(this, sub, false, error);
            }
            break;
          default:
            __privateGet(this, _tryCatchOnError).call(this, sub, true, response);
        }
      }
    });
    __privateAdd(this, _onClose, (event) => {
      if (false) {
        (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug({
          event
        }, "Received close event from ws", event);
      }
      __privateGet(this, _cycleWebsocket).call(this);
    });
    __privateAdd(this, _cycleWebsocket, () => {
      if (__privateGet(this, _ws)) {
        __privateGet(this, _ws).removeEventListener("open", __privateGet(this, _onOpen));
        __privateGet(this, _ws).removeEventListener("message", __privateGet(this, _onMessage));
        __privateGet(this, _ws).removeEventListener("close", __privateGet(this, _onClose));
        if (__privateGet(this, _ws).readyState !== WebSocket$1.CLOSING && __privateGet(this, _ws).readyState !== WebSocket$1.CLOSED) {
          __privateGet(this, _ws).close();
        }
        __privateSet(this, _ws, void 0);
      }
      if (__privateGet(this, _subscriptions).size > 0) {
        if (false) {
          for (const s of __privateGet(this, _subscriptions).values()) {
            !(s.status !== "done" && s.status !== "error") ? false ? invariant(false, "should not have done/error subscriptions still") : invariant(false) : void 0;
          }
        }
        for (const s of __privateGet(this, _subscriptions).values()) {
          if (s.status === "subscribed") s.status = "reconnecting";
        }
        void __privateMethod(this, _ObjectSetListenerWebsocket_instances, ensureWebsocket_fn).call(this);
      }
    });
    __privateAdd(this, _tryCatchOnError, (sub, subscriptionClosed, error) => {
      var _a2;
      try {
        sub.listener.onError({
          subscriptionClosed,
          error
        });
      } catch (onErrorError) {
        console.error(`Error encountered in an onError callback for an OSDK subscription`, onErrorError);
        console.error(`This onError call was triggered by an error in another callback`, error);
        console.error(`The subscription has been closed.`, error);
        if (!subscriptionClosed) {
          (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.error(error, "Error in onError callback");
          __privateMethod(this, _ObjectSetListenerWebsocket_instances, unsubscribe_fn).call(this, sub, "error");
          __privateGet(this, _tryCatchOnError).call(this, sub, true, onErrorError);
        }
      }
    });
    var _a2;
    this.MINIMUM_RECONNECT_DELAY_MS = minimumReconnectDelayMs;
    __privateSet(this, _client2, client);
    __privateSet(this, _logger2, (_a2 = client.logger) == null ? void 0 : _a2.child({}, {
      msgPrefix: "<OSW> "
    }));
    !(client.baseUrl.startsWith("https://") || client.baseUrl.startsWith("http://")) ? false ? invariant(false, "Stack must be a URL") : invariant(false) : void 0;
  }
  // FIXME
  static getInstance(client) {
    let instance = __privateGet(_ObjectSetListenerWebsocket, _instances).get(client.clientCacheKey);
    if (instance == null) {
      instance = new _ObjectSetListenerWebsocket(client);
      __privateGet(_ObjectSetListenerWebsocket, _instances).set(client.clientCacheKey, instance);
    }
    return instance;
  }
  async subscribe(objectType, objectSet, listener, properties = []) {
    const objOrInterfaceDef = objectType.type === "object" ? await __privateGet(this, _client2).ontologyProvider.getObjectDefinition(objectType.apiName) : await __privateGet(this, _client2).ontologyProvider.getInterfaceDefinition(objectType.apiName);
    let objectProperties = [];
    let referenceProperties = [];
    if (properties.length === 0) {
      properties = Object.keys(objOrInterfaceDef.properties);
    }
    objectProperties = properties.filter((p) => objOrInterfaceDef.properties[p].type !== "geotimeSeriesReference");
    referenceProperties = properties.filter((p) => objOrInterfaceDef.properties[p].type === "geotimeSeriesReference");
    const sub = {
      listener: fillOutListener(listener),
      objectSet,
      primaryKeyPropertyName: objOrInterfaceDef.type === "interface" ? void 0 : objOrInterfaceDef.primaryKeyApiName,
      requestedProperties: objectProperties,
      requestedReferenceProperties: referenceProperties,
      status: "preparing",
      // Since we don't have a real subscription id yet but we need to keep
      // track of this reference, we can just use a random uuid.
      subscriptionId: `TMP-${nextUuid()}}`,
      interfaceApiName: objOrInterfaceDef.type === "object" ? void 0 : objOrInterfaceDef.apiName
    };
    __privateGet(this, _subscriptions).set(sub.subscriptionId, sub);
    void __privateMethod(this, _ObjectSetListenerWebsocket_instances, initiateSubscribe_fn).call(this, sub);
    return () => {
      __privateMethod(this, _ObjectSetListenerWebsocket_instances, unsubscribe_fn).call(this, sub);
    };
  }
};
_instances = new WeakMap();
_ws = new WeakMap();
_lastWsConnect = new WeakMap();
_client2 = new WeakMap();
_logger2 = new WeakMap();
_pendingSubscriptions = new WeakMap();
_subscriptions = new WeakMap();
_endedSubscriptions = new WeakMap();
_maybeDisconnectTimeout = new WeakMap();
_ObjectSetListenerWebsocket_instances = new WeakSet();
initiateSubscribe_fn = async function(sub) {
  var _b2, _c;
  if (false) {
    (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug("#initiateSubscribe()");
  }
  try {
    await __privateMethod(this, _ObjectSetListenerWebsocket_instances, ensureWebsocket_fn).call(this);
    if (subscriptionIsDone(sub)) {
      return;
    }
    sub.isReady = true;
    if (((_b2 = __privateGet(this, _ws)) == null ? void 0 : _b2.readyState) === WebSocket$1.OPEN) {
      __privateMethod(this, _ObjectSetListenerWebsocket_instances, sendSubscribeMessage_fn).call(this);
    }
  } catch (error) {
    (_c = __privateGet(this, _logger2)) == null ? void 0 : _c.error(error, "Error in #initiateSubscribe");
    __privateGet(this, _tryCatchOnError).call(this, sub, true, error);
  }
};
sendSubscribeMessage_fn = function() {
  var _c;
  if (false) {
    (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug("#sendSubscribeMessage()");
  }
  const readySubs = [...__privateGet(this, _subscriptions).values()].filter(isReady);
  const id = nextUuid();
  __privateGet(this, _pendingSubscriptions).set(id, readySubs);
  const subscribe = {
    id,
    requests: readySubs.map(({
      objectSet,
      requestedProperties,
      requestedReferenceProperties,
      interfaceApiName
    }) => {
      return {
        objectSet,
        propertySet: requestedProperties,
        referenceSet: requestedReferenceProperties
      };
    })
  };
  if (false) {
    (_b2 = __privateGet(this, _logger2)) == null ? void 0 : _b2.debug({
      payload: subscribe
    }, "sending subscribe message");
  }
  (_c = __privateGet(this, _ws)) == null ? void 0 : _c.send(JSON.stringify(subscribe));
};
unsubscribe_fn = function(sub, newStatus = "done") {
  if (subscriptionIsDone(sub)) {
    return;
  }
  sub.status = newStatus;
  sub.listener = fillOutListener({});
  __privateGet(this, _subscriptions).delete(sub.subscriptionId);
  __privateGet(this, _endedSubscriptions).add(sub.subscriptionId);
  __privateMethod(this, _ObjectSetListenerWebsocket_instances, sendSubscribeMessage_fn).call(this);
  if (__privateGet(this, _maybeDisconnectTimeout)) {
    clearTimeout(__privateGet(this, _maybeDisconnectTimeout));
  }
  __privateSet(this, _maybeDisconnectTimeout, setTimeout(
    () => {
      __privateSet(this, _maybeDisconnectTimeout, void 0);
      if (__privateGet(this, _subscriptions).size === 0) {
        __privateGet(this, _cycleWebsocket).call(this);
      }
    },
    15e3
    /* ms */
  ));
};
ensureWebsocket_fn = async function() {
  if (__privateGet(this, _ws) == null) {
    const {
      baseUrl,
      tokenProvider
    } = __privateGet(this, _client2);
    const url = constructWebsocketUrl(baseUrl, await __privateGet(this, _client2).ontologyRid);
    const token = await tokenProvider();
    if (__privateGet(this, _ws) == null) {
      const nextConnectTime = (__privateGet(this, _lastWsConnect) ?? 0) + this.MINIMUM_RECONNECT_DELAY_MS;
      if (nextConnectTime > Date.now()) {
        await new Promise((resolve) => {
          setTimeout(resolve, nextConnectTime - Date.now());
        });
      }
      __privateSet(this, _lastWsConnect, Date.now());
      if (__privateGet(this, _ws) == null) {
        if (false) {
          (_a2 = __privateGet(this, _logger2)) == null ? void 0 : _a2.debug("Creating websocket");
        }
        __privateSet(this, _ws, new WebSocket$1(url, [`Bearer-${token}`]));
        __privateGet(this, _ws).addEventListener("close", __privateGet(this, _onClose));
        __privateGet(this, _ws).addEventListener("message", __privateGet(this, _onMessage));
        __privateGet(this, _ws).addEventListener("open", __privateGet(this, _onOpen));
      }
    }
    if (__privateGet(this, _ws).readyState === WebSocket$1.CONNECTING) {
      const ws2 = __privateGet(this, _ws);
      return new Promise((resolve, reject) => {
        function cleanup() {
          ws2.removeEventListener("open", open);
          ws2.removeEventListener("error", error);
          ws2.removeEventListener("close", cleanup);
        }
        function open() {
          cleanup();
          resolve();
        }
        function error(evt) {
          cleanup();
          reject(evt);
        }
        ws2.addEventListener("open", open);
        ws2.addEventListener("error", error);
        ws2.addEventListener("close", cleanup);
      });
    }
  }
};
_onOpen = new WeakMap();
_onMessage = new WeakMap();
_handleMessage_objectSetChanged = new WeakMap();
fetchInterfaceMapping_fn = async function(objectTypeApiName, interfaceApiName) {
  if (interfaceApiName == null) return {};
  const interfaceMap = (await __privateGet(this, _client2).ontologyProvider.getObjectDefinition(objectTypeApiName)).interfaceMap;
  return {
    [interfaceApiName]: {
      [objectTypeApiName]: interfaceMap[interfaceApiName]
    }
  };
};
_handleMessage_refreshObjectSet = new WeakMap();
_handleMessage_subscribeResponses = new WeakMap();
handleMessage_subscriptionClosed_fn = function(payload) {
  const sub = __privateGet(this, _subscriptions).get(payload.id);
  if (sub == null && __privateGet(this, _endedSubscriptions).has(payload.id)) return;
  !sub ? false ? invariant(false, `Expected subscription id ${payload.id}`) : invariant(false) : void 0;
  __privateGet(this, _tryCatchOnError).call(this, sub, true, payload.cause);
  __privateMethod(this, _ObjectSetListenerWebsocket_instances, unsubscribe_fn).call(this, sub, "error");
};
_onClose = new WeakMap();
_cycleWebsocket = new WeakMap();
_tryCatchOnError = new WeakMap();
__privateAdd(_ObjectSetListenerWebsocket, _instances, /* @__PURE__ */ new WeakMap());
let ObjectSetListenerWebsocket = _ObjectSetListenerWebsocket;
function constructWebsocketUrl(baseUrl, ontologyRid) {
  const base = new URL(baseUrl);
  const url = new URL(`api/v2/ontologySubscriptions/ontologies/${ontologyRid}/streamSubscriptions`, base);
  url.protocol = url.protocol.replace("https", "wss");
  return url;
}
let uuidCounter = 0;
function nextUuid() {
  return `00000000-0000-0000-0000-${(uuidCounter++).toString().padStart(12, "0")}`;
}
function isObjectTypeDefinition(def) {
  return def.type === "object";
}
function isObjectSet(o) {
  return o != null && typeof o === "object" && isWireObjectSet(objectSetDefinitions.get(o));
}
function getWireObjectSet(objectSet) {
  return objectSetDefinitions.get(objectSet);
}
const objectSetDefinitions = /* @__PURE__ */ new WeakMap();
function createObjectSet(objectType, clientCtx, objectSet = resolveBaseObjectSetType(objectType)) {
  const base = {
    aggregate: aggregate.bind(globalThis, augmentRequestContext(clientCtx, () => ({
      finalMethodCall: "aggregate"
    })), objectType, objectSet),
    fetchPage: fetchPageInternal.bind(globalThis, augmentRequestContext(clientCtx, () => ({
      finalMethodCall: "fetchPage"
    })), objectType, objectSet),
    fetchPageWithErrors: fetchPageWithErrorsInternal.bind(globalThis, augmentRequestContext(clientCtx, () => ({
      finalMethodCall: "fetchPageWithErrors"
    })), objectType, objectSet),
    where: (clause) => {
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "filter",
        objectSet,
        where: modernToLegacyWhereClause(clause, objectType)
      });
    },
    pivotTo: function(type) {
      return createSearchAround(type)();
    },
    union: (...objectSets) => {
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "union",
        objectSets: [objectSet, ...objectSets.map((os) => objectSetDefinitions.get(os))]
      });
    },
    intersect: (...objectSets) => {
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "intersect",
        objectSets: [objectSet, ...objectSets.map((os) => objectSetDefinitions.get(os))]
      });
    },
    subtract: (...objectSets) => {
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "subtract",
        objectSets: [objectSet, ...objectSets.map((os) => objectSetDefinitions.get(os))]
      });
    },
    asyncIter: async function* (args) {
      let $nextPageToken = void 0;
      do {
        const result = await fetchPageInternal(augmentRequestContext(clientCtx, () => ({
          finalMethodCall: "asyncIter"
        })), objectType, objectSet, {
          ...args,
          $pageSize: 1e4,
          $nextPageToken
        });
        $nextPageToken = result.nextPageToken;
        for (const obj of result.data) {
          yield obj;
        }
      } while ($nextPageToken != null);
    },
    fetchOne: isObjectTypeDefinition(objectType) ? async (primaryKey, options) => {
      return await fetchSingle(augmentRequestContext(clientCtx, () => ({
        finalMethodCall: "fetchOne"
      })), objectType, options, await createWithPk(clientCtx, objectType, objectSet, primaryKey));
    } : void 0,
    fetchOneWithErrors: isObjectTypeDefinition(objectType) ? async (primaryKey, options) => {
      return await fetchSingleWithErrors(augmentRequestContext(clientCtx, () => ({
        finalMethodCall: "fetchOneWithErrors"
      })), objectType, options, await createWithPk(clientCtx, objectType, objectSet, primaryKey));
    } : void 0,
    subscribe: (listener, opts) => {
      const pendingSubscribe = ObjectSetListenerWebsocket.getInstance(clientCtx).subscribe(objectType, objectSet, listener, opts == null ? void 0 : opts.properties);
      return {
        unsubscribe: async () => (await pendingSubscribe)()
      };
    },
    withProperties: (clause) => {
      const definitionMap = /* @__PURE__ */ new Map();
      const derivedProperties = {};
      for (const key of Object.keys(clause)) {
        const derivedPropertyDefinition = clause[key](createWithPropertiesObjectSet(objectType, {
          type: "methodInput"
        }, definitionMap, true));
        derivedProperties[key] = definitionMap.get(derivedPropertyDefinition);
      }
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "withProperties",
        derivedProperties,
        objectSet
      });
    },
    $objectSetInternals: {
      def: objectType
    }
  };
  function createSearchAround(link) {
    return () => {
      return clientCtx.objectSetFactory(objectType, clientCtx, {
        type: "searchAround",
        objectSet,
        link
      });
    };
  }
  objectSetDefinitions.set(base, objectSet);
  return base;
}
async function createWithPk(clientCtx, objectType, objectSet, primaryKey) {
  const objDef = await clientCtx.ontologyProvider.getObjectDefinition(objectType.apiName);
  const withPk = {
    type: "filter",
    objectSet,
    where: {
      type: "eq",
      field: objDef.primaryKeyApiName,
      value: primaryKey
    }
  };
  return withPk;
}
function isInterfaceActionParam(o) {
  return o != null && typeof o === "object" && "$objectType" in o && "$primaryKey" in o;
}
function isObjectSpecifiersObject(o) {
  return o && typeof o === "object" && typeof o.$apiName === "string" && o.$primaryKey != null;
}
function isOntologyObjectV2(o) {
  return o && typeof o === "object" && typeof o.__apiName === "string" && o.__primaryKey != null;
}
function isPoint(o) {
  return o && typeof o === "object" && "type" in o && o.type === "Point" && "coordinates" in o && o.coordinates.length === 2;
}
async function toDataValue(value, client, actionMetadata) {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value) || value instanceof Set) {
    const values = Array.from(value);
    if (values.some((dataValue) => isAttachmentUpload(dataValue) || isAttachmentFile(dataValue))) {
      const converted = [];
      for (const value2 of values) {
        converted.push(await toDataValue(value2, client, actionMetadata));
      }
      return converted;
    }
    const promiseArray = Array.from(value, async (innerValue) => await toDataValue(innerValue, client, actionMetadata));
    return Promise.all(promiseArray);
  }
  if (isAttachmentUpload(value)) {
    const attachment = await upload$1(client, value.data, {
      filename: value.name
    });
    return await toDataValue(attachment.rid, client, actionMetadata);
  }
  if (isAttachmentFile(value)) {
    const attachment = await upload$1(client, value, {
      filename: value.name
    });
    return await toDataValue(attachment.rid, client, actionMetadata);
  }
  if (isMediaUpload(value)) {
    const mediaRef = await uploadMedia(client, await client.ontologyRid, actionMetadata.apiName, value.data, {
      mediaItemPath: value.path,
      preview: true
    });
    return await toDataValue(mediaRef, client, actionMetadata);
  }
  if (isOntologyObjectV2(value)) {
    return await toDataValue(value.__primaryKey, client, actionMetadata);
  }
  if (isObjectSpecifiersObject(value)) {
    return await toDataValue(value.$primaryKey, client, actionMetadata);
  }
  if (isPoint(value)) {
    return await toDataValue(`${value.coordinates[1]},${value.coordinates[0]}`, client, actionMetadata);
  }
  if (isWireObjectSet(value)) {
    return value;
  }
  if (isObjectSet(value)) {
    return getWireObjectSet(value);
  }
  if (isMediaReference(value)) {
    return value;
  }
  if (isInterfaceActionParam(value)) {
    return {
      objectTypeApiName: value.$objectType,
      primaryKeyValue: value.$primaryKey
    };
  }
  if (typeof value === "object") {
    return Object.entries(value).reduce(async (promisedAcc, [key, structValue]) => {
      const acc = await promisedAcc;
      acc[key] = await toDataValue(structValue, client, actionMetadata);
      return acc;
    }, Promise.resolve({}));
  }
  return value;
}
async function applyAction(client, action, parameters, options = {}) {
  var _a2;
  const clientWithHeaders = addUserAgentAndRequestContextHeaders(augmentRequestContext(client, () => ({
    finalMethodCall: "applyAction"
  })), action);
  if (Array.isArray(parameters)) {
    const response = await applyBatch(clientWithHeaders, await client.ontologyRid, action.apiName, {
      requests: parameters ? await remapBatchActionParams(parameters, client, await client.ontologyProvider.getActionDefinition(action.apiName)) : [],
      options: {
        returnEdits: (options == null ? void 0 : options.$returnEdits) ? "ALL" : "NONE"
      }
    });
    const edits = response.edits;
    return (options == null ? void 0 : options.$returnEdits) ? (edits == null ? void 0 : edits.type) === "edits" ? remapActionResponse(response) : edits : void 0;
  } else {
    const response = await apply(clientWithHeaders, await client.ontologyRid, action.apiName, {
      parameters: await remapActionParams(parameters, client, await client.ontologyProvider.getActionDefinition(action.apiName)),
      options: {
        mode: (options == null ? void 0 : options.$validateOnly) ? "VALIDATE_ONLY" : "VALIDATE_AND_EXECUTE",
        returnEdits: (options == null ? void 0 : options.$returnEdits) ? "ALL_V2_WITH_DELETIONS" : "NONE"
      }
    });
    if (options == null ? void 0 : options.$validateOnly) {
      return response.validation;
    }
    if (response.validation && ((_a2 = response.validation) == null ? void 0 : _a2.result) === "INVALID") {
      const validation = response.validation;
      throw new ActionValidationError(validation);
    }
    const edits = response.edits;
    return (options == null ? void 0 : options.$returnEdits) ? (edits == null ? void 0 : edits.type) === "edits" ? remapActionResponse(response) : edits : void 0;
  }
}
async function remapActionParams(params, client, actionMetadata) {
  if (params == null) {
    return {};
  }
  const parameterMap = {};
  for (const [key, value] of Object.entries(params)) {
    parameterMap[key] = await toDataValue(value, client, actionMetadata);
  }
  return parameterMap;
}
async function remapBatchActionParams(params, client, actionMetadata) {
  const remappedParams = await Promise.all(params.map(async (param) => {
    return {
      parameters: await remapActionParams(param, client, actionMetadata)
    };
  }));
  return remappedParams;
}
function remapActionResponse(response) {
  var _a2, _b2;
  const editResponses = response == null ? void 0 : response.edits;
  if ((editResponses == null ? void 0 : editResponses.type) === "edits") {
    const remappedActionResponse = {
      type: editResponses.type,
      deletedLinksCount: editResponses.deletedLinksCount,
      deletedObjectsCount: editResponses.deletedObjectsCount,
      addedLinks: [],
      deletedLinks: [],
      addedObjects: [],
      deletedObjects: [],
      modifiedObjects: [],
      editedObjectTypes: []
    };
    const editedObjectTypesSet = /* @__PURE__ */ new Set();
    for (const edit of editResponses.edits) {
      if (edit.type === "addLink" || edit.type === "deleteLink") {
        const osdkEdit = {
          linkTypeApiNameAtoB: edit.linkTypeApiNameAtoB,
          linkTypeApiNameBtoA: edit.linkTypeApiNameBtoA,
          aSideObject: edit.aSideObject,
          bSideObject: edit.bSideObject
        };
        edit.type === "addLink" ? remappedActionResponse.addedLinks.push(osdkEdit) : (_a2 = remappedActionResponse.deletedLinks) == null ? void 0 : _a2.push(osdkEdit);
        editedObjectTypesSet.add(edit.aSideObject.objectType);
        editedObjectTypesSet.add(edit.bSideObject.objectType);
      } else if (edit.type === "addObject" || edit.type === "deleteObject" || edit.type === "modifyObject") {
        const osdkEdit = {
          objectType: edit.objectType,
          primaryKey: edit.primaryKey
        };
        if (edit.type === "addObject") {
          remappedActionResponse.addedObjects.push(osdkEdit);
        } else if (edit.type === "deleteObject") {
          (_b2 = remappedActionResponse.deletedObjects) == null ? void 0 : _b2.push(osdkEdit);
        } else if (edit.type === "modifyObject") {
          remappedActionResponse.modifiedObjects.push(osdkEdit);
        }
        editedObjectTypesSet.add(edit.objectType);
      } else {
        if (false) {
          console.warn(`Unexpected edit type: ${JSON.stringify(edit)}`);
        }
      }
    }
    remappedActionResponse.editedObjectTypes = [...editedObjectTypesSet];
    return remappedActionResponse;
  }
}
const additionalContext = Symbol("additionalContext");
const MaxOsdkVersion = "2.3.0";
const ErrorMessage = Symbol("ErrorMessage");
function createSharedClientContext(baseUrl, tokenProvider, userAgent, fetchFn = fetch) {
  if (baseUrl.length === 0) {
    throw new Error("baseUrl cannot be empty");
  }
  const retryingFetchWithAuthOrThrow = createFetchHeaderMutator(createRetryingFetch(createFetchOrThrow(fetchFn)), async (headers) => {
    const token = await tokenProvider();
    headers.set("Authorization", `Bearer ${token}`);
    headers.set("Fetch-User-Agent", [headers.get("Fetch-User-Agent"), userAgent].filter((x) => x && (x == null ? void 0 : x.length) > 0).join(" "));
    return headers;
  });
  return {
    baseUrl,
    fetch: async (input, init) => {
      try {
        return await retryingFetchWithAuthOrThrow(input, init);
      } catch (e2) {
        const betterError = e2 instanceof PalantirApiError$1 ? new PalantirApiError$1(e2.message, e2.errorName, e2.errorCode, e2.statusCode, e2.errorInstanceId, e2.parameters) : new Error("Captured stack trace for error: " + (e2.message ?? e2));
        betterError.cause = e2;
        throw betterError;
      }
    },
    tokenProvider
  };
}
const START_TOKEN = new Uint8Array([123, 34, 100, 97, 116, 97, 34, 58, 91]);
const OBJECT_OPEN_CHAR_CODE = 123;
const OBJECT_CLOSE_CHAR_CODE = 125;
async function* parseStreamedResponse(asyncIterable) {
  const utf8decoder = new TextDecoder("utf-8");
  let parsedStart = false;
  let prevChunks = [];
  let openBracesCount = 0;
  for await (let chunk of asyncIterable) {
    let i = 0;
    if (!parsedStart) {
      parsedStart = true;
      if (startsWith(chunk, START_TOKEN)) {
        i = START_TOKEN.length;
      }
    }
    for (; i < chunk.length; i++) {
      while (openBracesCount === 0 && chunk[i] !== OBJECT_OPEN_CHAR_CODE && i < chunk.length) {
        i++;
      }
      let j = i;
      for (; j < chunk.length; j++) {
        const c = chunk[j];
        if (c === OBJECT_OPEN_CHAR_CODE) {
          openBracesCount++;
        } else if (c === OBJECT_CLOSE_CHAR_CODE) {
          openBracesCount--;
          if (0 === openBracesCount) {
            yield combineAndParse(utf8decoder, prevChunks, chunk.subarray(i, j + 1));
            prevChunks = [];
            i = j;
            break;
          }
        }
      }
      if (j === chunk.length) {
        prevChunks.push(chunk.subarray(i));
        break;
      }
    }
  }
}
function startsWith(a, b) {
  if (a.length < b.length) {
    return false;
  }
  for (let i = 0; i < b.length; i++) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
function combineAndParse(utf8decoder, prev, curr) {
  let str = "";
  for (const chunk of prev) {
    str += utf8decoder.decode(chunk, {
      stream: true
    });
  }
  str += utf8decoder.decode(curr);
  return JSON.parse(str);
}
async function* iterateReadableStream(readableStream) {
  let res = await readableStream.read();
  while (!res.done) {
    yield res.value;
    res = await readableStream.read();
  }
}
function getTimeRange(body) {
  if ("$startTime" in body || "$endTime" in body) {
    return {
      type: "absolute",
      startTime: body.$startTime,
      endTime: body.$endTime
    };
  }
  return body.$before ? {
    type: "relative",
    startTime: {
      when: "BEFORE",
      value: body.$before,
      unit: TimeseriesDurationMapping[body.$unit]
    }
  } : {
    type: "relative",
    endTime: {
      when: "AFTER",
      value: body.$after,
      unit: TimeseriesDurationMapping[body.$unit]
    }
  };
}
async function* asyncIterPointsHelper(iterator) {
  var _a2;
  const reader = (_a2 = iterator.body) == null ? void 0 : _a2.getReader();
  for await (const point of parseStreamedResponse(iterateReadableStream(reader))) {
    yield {
      time: point.time,
      value: point.value
    };
  }
}
class GeotimeSeriesPropertyImpl {
  constructor(client, objectApiName, primaryKey, propertyName, initialValue) {
    __privateAdd(this, _triplet);
    __privateAdd(this, _client3);
    __privateSet(this, _client3, client);
    __privateSet(this, _triplet, [objectApiName, primaryKey, propertyName]);
    if (initialValue != null) {
      this.lastFetchedValue = initialValue;
    }
  }
  async getLatestValue() {
    const latestPointPromise = getLatestValue(__privateGet(this, _client3), await __privateGet(this, _client3).ontologyRid, ...__privateGet(this, _triplet));
    latestPointPromise.then(
      (latestPoint) => this.lastFetchedValue = latestPoint,
      // eslint-disable-next-line no-console
      (err) => void console.error(err)
    );
    return latestPointPromise;
  }
  async getAllValues(query) {
    const allPoints = [];
    for await (const point of this.asyncIterValues(query)) {
      allPoints.push(point);
    }
    return allPoints;
  }
  async *asyncIterValues(query) {
    const streamPointsIterator = await streamValues(__privateGet(this, _client3), await __privateGet(this, _client3).ontologyRid, ...__privateGet(this, _triplet), query ? {
      range: getTimeRange(query)
    } : {});
    for await (const timeseriesPoint of asyncIterPointsHelper(streamPointsIterator)) {
      yield timeseriesPoint;
    }
  }
}
_triplet = new WeakMap();
_client3 = new WeakMap();
class MediaReferencePropertyImpl {
  constructor(args) {
    __privateAdd(this, _mediaReference);
    __privateAdd(this, _triplet2);
    __privateAdd(this, _client4);
    const {
      client,
      objectApiName,
      primaryKey,
      propertyName,
      mediaReference
    } = args;
    __privateSet(this, _client4, client);
    __privateSet(this, _triplet2, [objectApiName, primaryKey, propertyName]);
    __privateSet(this, _mediaReference, mediaReference);
  }
  async fetchContents() {
    return getMediaContent(__privateGet(this, _client4), await __privateGet(this, _client4).ontologyRid, ...__privateGet(this, _triplet2), {
      preview: true
      // TODO: Can turn this back off when backend is no longer in beta.
    });
  }
  async fetchMetadata() {
    const r = await getMediaMetadata(__privateGet(this, _client4), await __privateGet(this, _client4).ontologyRid, ...__privateGet(this, _triplet2), {
      preview: true
      // TODO: Can turn this back off when backend is no longer in beta.
    });
    return {
      path: r.path,
      sizeBytes: Number(r.sizeBytes),
      mediaType: r.mediaType
    };
  }
  getMediaReference() {
    return __privateGet(this, _mediaReference);
  }
}
_mediaReference = new WeakMap();
_triplet2 = new WeakMap();
_client4 = new WeakMap();
class TimeSeriesPropertyImpl {
  constructor(client, objectApiName, primaryKey, propertyName) {
    __privateAdd(this, _triplet3);
    __privateAdd(this, _client5);
    __privateSet(this, _client5, client);
    __privateSet(this, _triplet3, [objectApiName, primaryKey, propertyName]);
  }
  async getFirstPoint() {
    return getFirstPoint(__privateGet(this, _client5), await __privateGet(this, _client5).ontologyRid, ...__privateGet(this, _triplet3));
  }
  async getLastPoint() {
    return getLastPoint(__privateGet(this, _client5), await __privateGet(this, _client5).ontologyRid, ...__privateGet(this, _triplet3));
  }
  async getAllPoints(query) {
    const allPoints = [];
    for await (const point of this.asyncIterPoints(query)) {
      allPoints.push(point);
    }
    return allPoints;
  }
  async *asyncIterPoints(query) {
    const streamPointsIterator = await streamPoints(__privateGet(this, _client5), await __privateGet(this, _client5).ontologyRid, ...__privateGet(this, _triplet3), query ? {
      range: getTimeRange(query)
    } : {});
    for await (const timeseriesPoint of asyncIterPointsHelper(streamPointsIterator)) {
      yield timeseriesPoint;
    }
  }
}
_triplet3 = new WeakMap();
_client5 = new WeakMap();
function hydrateAttachmentFromRid(client, rid) {
  return hydrateAttachmentFromRidInternal(client[additionalContext], rid);
}
function hydrateAttachmentFromRidInternal(client, rid) {
  return {
    rid,
    async fetchContents() {
      return read(client, rid);
    },
    async fetchMetadata() {
      const r = await get$g(client, rid);
      return {
        ...r,
        sizeBytes: Number(r.sizeBytes)
      };
    }
  };
}
function createObjectSpecifierFromPrimaryKey(objectDef, primaryKey) {
  return `${objectDef.apiName}:${primaryKey}`;
}
function extractPrimaryKeyFromObjectSpecifier(ObjectSpecifier) {
  return ObjectSpecifier.split(":")[1];
}
function extractObjectTypeFromObjectSpecifier(ObjectSpecifier) {
  return ObjectSpecifier.split(":")[0];
}
const InterfaceDefinitions = Symbol("InterfaceDefinitions");
const UnderlyingOsdkObject = Symbol("Underlying Object");
const ObjectDefRef = Symbol("ObjectDefinition");
const InterfaceDefRef = Symbol("InterfaceDefinition");
const ClientRef = Symbol("ClientRef");
function createOsdkInterface(underlying, interfaceDef) {
  const [objApiNamespace] = extractNamespace(interfaceDef.apiName);
  return Object.freeze(Object.defineProperties({}, {
    // first to minimize hidden classes
    [UnderlyingOsdkObject]: {
      value: underlying
    },
    "$apiName": {
      value: interfaceDef.apiName,
      enumerable: true
    },
    "$as": {
      value: underlying.$as,
      enumerable: false
    },
    "$objectType": {
      value: underlying.$objectType,
      enumerable: "$objectType" in underlying
    },
    "$primaryKey": {
      value: underlying.$primaryKey,
      enumerable: "$primaryKey" in underlying
    },
    "$objectSpecifier": {
      value: underlying.$objectSpecifier,
      enumerable: "$objectSpecifier" in underlying
    },
    "$title": {
      value: underlying.$title,
      enumerable: "$title" in underlying
    },
    "$rid": {
      value: underlying.$rid,
      enumerable: "$rid" in underlying
    },
    "$clone": {
      value: clone,
      enumerable: false
    },
    [InterfaceDefRef]: {
      value: interfaceDef
    },
    ...Object.fromEntries(Object.keys(interfaceDef.properties).map((p) => {
      const objDef = underlying[ObjectDefRef];
      const [apiNamespace, apiName] = extractNamespace(p);
      const targetPropName = objDef.interfaceMap[interfaceDef.apiName][p];
      return [apiNamespace === objApiNamespace ? apiName : p, {
        enumerable: targetPropName in underlying,
        value: underlying[targetPropName]
      }];
    }))
  }));
  function clone(update) {
    if (update == null) {
      return underlying.$clone().$as(interfaceDef);
    }
    for (const key of Object.keys(update)) {
      if (!(key in interfaceDef.properties)) {
        throw new Error(`Invalid property ${key} for interface ${interfaceDef.apiName}`);
      }
    }
    const remappedProps = Object.fromEntries(Object.keys(update).map((p) => mapProperty(p, update[p])).filter((x) => x != null));
    return underlying.$clone(remappedProps).$as(interfaceDef);
  }
  function mapProperty(propertyName, value) {
    const objDef = underlying[ObjectDefRef];
    const targetPropName = objDef.interfaceMap[interfaceDef.apiName][propertyName];
    if (targetPropName == null) {
      throw new Error(`Cannot clone interface with ${propertyName} as property is not implemented by the underlying object type ${objDef.apiName}`);
    }
    return [targetPropName, value];
  }
}
const get$as = createSimpleCache(/* @__PURE__ */ new WeakMap(), $asFactory).get;
const osdkObjectToInterfaceView = createSimpleCache(/* @__PURE__ */ new WeakMap(), () => /* @__PURE__ */ new Map());
function $asFactory(objDef) {
  return function(targetMinDef) {
    var _a2, _b2;
    let targetInterfaceApiName;
    if (typeof targetMinDef === "string") {
      if (targetMinDef === objDef.apiName) {
        return this[UnderlyingOsdkObject];
      }
      if (((_a2 = objDef.interfaceMap) == null ? void 0 : _a2[targetMinDef]) == null) {
        throw new Error(`Object does not implement interface '${targetMinDef}'.`);
      }
      targetInterfaceApiName = targetMinDef;
    } else if (targetMinDef.apiName === objDef.apiName) {
      return this[UnderlyingOsdkObject];
    } else {
      if (targetMinDef.type === "object") {
        throw new Error(`'${targetMinDef.apiName}' is not an interface nor is it '${objDef.apiName}', which is the object type.`);
      }
      targetInterfaceApiName = targetMinDef.apiName;
    }
    const def = objDef[InterfaceDefinitions][targetInterfaceApiName];
    if (!def) {
      throw new Error(`Object does not implement interface '${targetInterfaceApiName}'.`);
    }
    const underlying = this[UnderlyingOsdkObject];
    const existing = (_b2 = osdkObjectToInterfaceView.get(underlying).get(targetInterfaceApiName)) == null ? void 0 : _b2.deref();
    if (existing) return existing;
    const osdkInterface = createOsdkInterface(underlying, def.def);
    osdkObjectToInterfaceView.get(underlying).set(targetInterfaceApiName, new WeakRef(osdkInterface));
    return osdkInterface;
  };
}
function get$link(holder) {
  const client = holder[ClientRef];
  const objDef = holder[ObjectDefRef];
  const rawObj = holder[UnderlyingOsdkObject];
  return Object.freeze(Object.fromEntries(Object.keys(objDef.links).map((linkName) => {
    const linkDef = objDef.links[linkName];
    const objectSet = client.objectSetFactory(objDef, client).where({
      [objDef.primaryKeyApiName]: rawObj.$primaryKey
    }).pivotTo(linkName);
    const value = !linkDef.multiplicity ? {
      fetchOne: (options) => fetchSingle(client, objDef, options ?? {}, getWireObjectSet(objectSet)),
      fetchOneWithErrors: (options) => fetchSingleWithErrors(client, objDef, options ?? {}, getWireObjectSet(objectSet))
    } : objectSet;
    return [linkName, value];
  })));
}
const specialPropertyTypes = /* @__PURE__ */ new Set(["attachment", "geotimeSeriesReference", "mediaReference", "numericTimeseries", "stringTimeseries", "sensorTimeseries"]);
const basePropDefs = {
  "$as": {
    get: function() {
      return get$as(this[ObjectDefRef]);
    }
  },
  "$link": {
    get: function() {
      return get$link(this);
    }
  },
  "$clone": {
    value: function(update) {
      const rawObj = this[UnderlyingOsdkObject];
      const def = this[ObjectDefRef];
      if (update == null) {
        return createOsdkObject(this[ClientRef], def, {
          ...rawObj
        });
      }
      if (def.primaryKeyApiName in update && rawObj[def.primaryKeyApiName] !== update[def.primaryKeyApiName]) {
        throw new Error(`Cannot update ${def.apiName} object with differing primary key values `);
      }
      if (def.titleProperty in update && !("$title" in update)) {
        update.$title = update[def.titleProperty];
      }
      const newObject = {
        ...this[UnderlyingOsdkObject],
        ...update
      };
      return createOsdkObject(this[ClientRef], this[ObjectDefRef], newObject);
    }
  },
  "$objectSpecifier": {
    get: function() {
      const rawObj = this[UnderlyingOsdkObject];
      return createObjectSpecifierFromPrimaryKey(this[ObjectDefRef], rawObj.$primaryKey);
    },
    enumerable: true
  }
};
function createOsdkObject(client, objectDef, simpleOsdkProperties, derivedPropertyTypeByName = {}) {
  const rawObj = simpleOsdkProperties;
  Object.defineProperties(rawObj, {
    [UnderlyingOsdkObject]: {
      enumerable: false,
      value: simpleOsdkProperties
    },
    [ObjectDefRef]: {
      value: objectDef,
      enumerable: false
    },
    [ClientRef]: {
      value: client,
      enumerable: false
    },
    ...basePropDefs
  });
  for (const propKey of Object.keys(rawObj)) {
    if (propKey in objectDef.properties && typeof objectDef.properties[propKey].type === "string" && specialPropertyTypes.has(objectDef.properties[propKey].type)) {
      rawObj[propKey] = createSpecialProperty(client, objectDef, rawObj, propKey);
    } else if (propKey in derivedPropertyTypeByName) {
      rawObj[propKey] = modifyRdpProperties(client, derivedPropertyTypeByName, rawObj[propKey], propKey);
    }
  }
  return Object.freeze(rawObj);
}
function modifyRdpProperties(client, derivedPropertyTypeByName, rawValue, propKey) {
  var _a2;
  if (derivedPropertyTypeByName[propKey].definition.type === "selection" && derivedPropertyTypeByName[propKey].definition.operation.type === "count") {
    const num = Number(rawValue);
    !Number.isSafeInteger(num) ? false ? invariant(false, "Count aggregation for derived property " + propKey + " returned a value larger than safe integer.") : invariant(false) : void 0;
    return num;
  } else if (derivedPropertyTypeByName[propKey].selectedOrCollectedPropertyType != null && typeof derivedPropertyTypeByName[propKey].selectedOrCollectedPropertyType.type === "string" && specialPropertyTypes.has(derivedPropertyTypeByName[propKey].selectedOrCollectedPropertyType.type)) {
    switch ((_a2 = derivedPropertyTypeByName[propKey].selectedOrCollectedPropertyType) == null ? void 0 : _a2.type) {
      case "attachment":
        if (Array.isArray(rawValue)) {
          return rawValue.map((a) => hydrateAttachmentFromRidInternal(client, a.rid));
        } else {
          return hydrateAttachmentFromRidInternal(client, rawValue.rid);
        }
        break;
      default:
        false ? invariant(false, "Derived property aggregations for Timeseries and Media are not supported") : invariant(false);
    }
  }
  return rawValue;
}
function createSpecialProperty(client, objectDef, rawObject, p) {
  const rawValue = rawObject[p];
  const propDef = objectDef.properties[p];
  if (false) {
    !(propDef != null && typeof propDef.type === "string" && specialPropertyTypes.has(propDef.type)) ? false ? invariant(false) : invariant(false) : void 0;
  }
  if (propDef.type === "attachment") {
    if (Array.isArray(rawValue)) {
      return rawValue.map((a) => hydrateAttachmentFromRidInternal(client, a.rid));
    }
    return hydrateAttachmentFromRidInternal(client, rawValue.rid);
  }
  if (propDef.type === "numericTimeseries" || propDef.type === "stringTimeseries" || propDef.type === "sensorTimeseries") {
    return new TimeSeriesPropertyImpl(client, objectDef.apiName, rawObject[objectDef.primaryKeyApiName], p);
  }
  if (propDef.type === "geotimeSeriesReference") {
    return new GeotimeSeriesPropertyImpl(client, objectDef.apiName, rawObject[objectDef.primaryKeyApiName], p, rawValue.type === "geotimeSeriesValue" ? {
      time: rawValue.timestamp,
      value: {
        type: "Point",
        coordinates: rawValue.position
      }
    } : void 0);
  }
  if (propDef.type === "mediaReference") {
    return new MediaReferencePropertyImpl({
      client,
      objectApiName: objectDef.apiName,
      primaryKey: rawObject[objectDef.primaryKeyApiName],
      propertyName: p,
      mediaReference: rawValue
    });
  }
}
async function convertWireToOsdkObjects(client, objects2, interfaceApiName, forceRemoveRid = false, derivedPropertyTypesByName, selectedProps, strictNonNull = false) {
  fixObjectPropertiesInPlace(objects2, forceRemoveRid);
  const ifaceDef = interfaceApiName ? await client.ontologyProvider.getInterfaceDefinition(interfaceApiName) : void 0;
  const ifaceSelected = ifaceDef ? selectedProps ?? Object.keys(ifaceDef.properties) : void 0;
  const ret = [];
  for (const rawObj of objects2) {
    const objectDef = await client.ontologyProvider.getObjectDefinition(rawObj.$apiName);
    !objectDef ? false ? invariant(false, `Missing definition for '${rawObj.$apiName}'`) : invariant(false) : void 0;
    let objProps;
    let conforming = true;
    if (ifaceDef && ifaceSelected) {
      invariantInterfacesAsViews(objectDef, ifaceDef.apiName, client);
      conforming && (conforming = isConforming(client, ifaceDef, rawObj, ifaceSelected));
      reframeAsObjectInPlace(objectDef, ifaceDef.apiName, rawObj);
      objProps = convertInterfacePropNamesToObjectPropNames(objectDef, ifaceDef.apiName, ifaceSelected);
    } else {
      objProps = selectedProps ?? Object.keys(objectDef.properties);
    }
    conforming && (conforming = isConforming(client, objectDef, rawObj, objProps));
    if (strictNonNull === "throw" && !conforming) {
      throw new Error("Unable to safely convert objects as some non nullable properties are null");
    } else if (strictNonNull === "drop" && !conforming) {
      continue;
    }
    let osdkObject = createOsdkObject(client, objectDef, rawObj, derivedPropertyTypesByName);
    if (interfaceApiName) osdkObject = osdkObject.$as(interfaceApiName);
    ret.push(osdkObject);
  }
  return ret;
}
async function convertWireToOsdkObjects2(client, objects2, interfaceApiName, derivedPropertyTypeByName, forceRemoveRid = false, selectedProps, strictNonNull = false, interfaceToObjectTypeMappings = {}) {
  fixObjectPropertiesInPlace(objects2, forceRemoveRid);
  const ret = [];
  for (const rawObj of objects2) {
    const objectDef = await client.ontologyProvider.getObjectDefinition(rawObj.$apiName);
    !objectDef ? false ? invariant(false, `Missing definition for '${rawObj.$apiName}'`) : invariant(false) : void 0;
    const interfaceToObjMapping = interfaceApiName ? interfaceToObjectTypeMappings[interfaceApiName][rawObj.$apiName] : void 0;
    const ifaceSelected = interfaceApiName && interfaceToObjMapping ? selectedProps ? Object.keys(interfaceToObjMapping).filter((val) => {
      selectedProps == null ? void 0 : selectedProps.includes(interfaceToObjMapping[val]);
    }) : [...Object.values(interfaceToObjMapping), objectDef.primaryKeyApiName] : void 0;
    let objProps;
    let conforming = true;
    if (interfaceApiName && ifaceSelected) {
      invariantInterfacesAsViews(objectDef, interfaceApiName, client);
      objProps = ifaceSelected;
    } else {
      objProps = selectedProps ?? Object.keys(objectDef.properties);
    }
    conforming && (conforming = isConforming(client, objectDef, rawObj, objProps));
    if (strictNonNull === "throw" && !conforming) {
      throw new Error("Unable to safely convert objects as some non nullable properties are null");
    } else if (strictNonNull === "drop" && !conforming) {
      continue;
    }
    let osdkObject = createOsdkObject(client, objectDef, rawObj, derivedPropertyTypeByName);
    if (interfaceApiName) osdkObject = osdkObject.$as(interfaceApiName);
    ret.push(osdkObject);
  }
  return ret;
}
function convertInterfacePropNamesToObjectPropNames(objectDef, interfaceApiName, ifacePropsToMap) {
  return ifacePropsToMap.map((ifaceProp) => objectDef.interfaceMap[interfaceApiName][ifaceProp]);
}
function reframeAsObjectInPlace(objectDef, interfaceApiName, rawObj) {
  const newProps = {};
  for (const [sptProp, regularProp] of Object.entries(objectDef.interfaceMap[interfaceApiName])) {
    if (sptProp in rawObj) {
      const value = rawObj[sptProp];
      delete rawObj[sptProp];
      if (value !== void 0) {
        newProps[regularProp] = value;
      }
    }
  }
  Object.assign(rawObj, newProps);
  if (!(objectDef.primaryKeyApiName in rawObj)) {
    rawObj[objectDef.primaryKeyApiName] = rawObj.$primaryKey;
  }
}
function isConforming(client, def, obj, propsToCheck) {
  for (const propName of propsToCheck) {
    if (propName in def.properties && def.properties[propName].nullable === false && obj[propName] == null) {
      if (false) {
        (_a2 = client.logger) == null ? void 0 : _a2.debug({
          obj: {
            $apiName: obj["$apiName"],
            $objectType: obj["$objectType"],
            $primaryKey: obj["$primaryKey"]
          }
        }, `Found object that does not conform to its definition. Expected ${def.apiName}'s ${propName} to not be null.`);
      }
      return false;
    }
  }
  return true;
}
function invariantInterfacesAsViews(objectDef, interfaceApiName, client) {
  var _a2;
  if (((_a2 = objectDef.interfaceMap) == null ? void 0 : _a2[interfaceApiName]) == null) {
    const warning = "Interfaces are only supported 'as views' but your metadata object is missing the correct information. This suggests your interfaces have not been migrated to the newer version yet and you cannot use this version of the SDK.";
    if (client.logger) {
      client.logger.warn(warning);
    } else {
      console.error(`WARNING! ${warning}`);
    }
    throw new Error(warning);
  }
}
function fixObjectPropertiesInPlace(objs, forceRemoveRid) {
  for (const obj of objs) {
    if (forceRemoveRid) {
      delete obj.__rid;
    }
    if (obj.__rid) {
      obj.$rid = obj.__rid;
      delete obj.__rid;
    }
    obj.$apiName ?? (obj.$apiName = obj.__apiName);
    obj.$objectType = obj.$apiName;
    obj.$primaryKey ?? (obj.$primaryKey = obj.__primaryKey);
    obj.$title ?? (obj.$title = obj.__title);
    delete obj.__apiName;
    delete obj.__primaryKey;
    delete obj.__title;
  }
}
function createClientCache(fn) {
  const cache = /* @__PURE__ */ new WeakMap();
  function set(client, key, value) {
    if (cache.get(client.clientCacheKey) == null) {
      cache.set(client.clientCacheKey, /* @__PURE__ */ new Map());
    }
    cache.get(client.clientCacheKey).set(key, value);
    return value;
  }
  return {
    get: function(client, key) {
      if (cache.get(client.clientCacheKey) == null) {
        cache.set(client.clientCacheKey, /* @__PURE__ */ new Map());
      }
      let r = cache.get(client.clientCacheKey).get(key);
      if (r === void 0 && fn !== void 0) {
        return set(client, key, fn(client, key));
      } else {
        return r;
      }
    },
    set,
    remove: function(client, key) {
      if (cache.get(client.clientCacheKey) == null) return false;
      return cache.get(client.clientCacheKey).delete(key);
    }
  };
}
function createAsyncClientCache(fn, createCacheLocal = createClientCache) {
  const cache = createCacheLocal();
  const inProgress = createCacheLocal();
  const ret = {
    getOrUndefined: function(client, key) {
      return cache.get(client, key);
    },
    get: async function(client, key) {
      return cache.get(client, key) ?? inProgress.get(client, key) ?? ret.set(client, key, fn(client, key));
    },
    set: async function(client, k, v) {
      try {
        const r = await inProgress.set(client, k, v);
        cache.set(client, k, r);
        inProgress.remove(client, k);
        return r;
      } catch (e2) {
        inProgress.remove(client, k);
        throw e2;
      }
    }
  };
  return ret;
}
function wirePropertyV2ToSdkPropertyDefinition(input, isNullable = true, log) {
  const sdkPropDefinition = objectPropertyTypeToSdkPropertyDefinition(input.dataType, log);
  if (sdkPropDefinition == null) {
    return void 0;
  }
  switch (input.dataType.type) {
    case "integer":
    case "string":
    case "byte":
    case "decimal":
    case "double":
    case "float":
    case "long":
    case "short":
    case "boolean":
    case "date":
    case "attachment":
    case "mediaReference":
    case "geopoint":
    case "geoshape":
    case "timestamp":
    case "timeseries":
    case "marking":
    case "geotimeSeriesReference":
    case "struct":
      return {
        displayName: input.displayName,
        multiplicity: false,
        description: input.description,
        type: sdkPropDefinition,
        nullable: input.nullable == null ? isNullable : input.nullable
      };
    case "array": {
      return {
        displayName: input.displayName,
        multiplicity: true,
        description: input.description,
        type: sdkPropDefinition,
        nullable: true
      };
    }
    case "cipherText":
    case "vector": {
      log == null ? void 0 : log.info(`${JSON.stringify(input.dataType.type)} is not a supported dataType`);
      return void 0;
    }
    default:
      input.dataType;
      log == null ? void 0 : log.info(`${JSON.stringify(input.dataType)} is not a supported dataType`);
      return void 0;
  }
}
function objectPropertyTypeToSdkPropertyDefinition(propertyType, log) {
  var _a2, _b2;
  switch (propertyType.type) {
    case "integer":
    case "string":
    case "byte":
    case "decimal":
    case "double":
    case "float":
    case "long":
    case "short":
    case "boolean":
    case "attachment":
    case "geopoint":
    case "geoshape":
    case "timestamp":
    case "marking":
    case "geotimeSeriesReference":
    case "mediaReference":
      return propertyType.type;
    case "date":
      return "datetime";
    case "array":
      return objectPropertyTypeToSdkPropertyDefinition(propertyType.subType);
    case "timeseries":
      if (((_a2 = propertyType.itemType) == null ? void 0 : _a2.type) === "string") {
        return "stringTimeseries";
      } else if (((_b2 = propertyType.itemType) == null ? void 0 : _b2.type) === "double") {
        return "numericTimeseries";
      } else return "sensorTimeseries";
    case "struct": {
      return propertyType.structFieldTypes.reduce((structMap, structField) => {
        structMap[structField.apiName] = objectPropertyTypeToSdkPropertyDefinition(structField.dataType);
        return structMap;
      }, {});
    }
    case "cipherText":
    case "vector": {
      log == null ? void 0 : log.info(`${JSON.stringify(propertyType.type)} is not a supported propertyType`);
      return void 0;
    }
    default: {
      log == null ? void 0 : log.info(`${JSON.stringify(propertyType)} is not a supported propertyType`);
      return void 0;
    }
  }
}
function __UNSTABLE_wireInterfaceTypeV2ToSdkObjectDefinition(interfaceType, v2, log) {
  return {
    type: "interface",
    rid: interfaceType.rid,
    apiName: interfaceType.apiName,
    displayName: interfaceType.displayName,
    description: interfaceType.description,
    implements: interfaceType.allExtendsInterfaces ?? interfaceType.extendsInterfaces,
    properties: Object.fromEntries(Object.entries(interfaceType.allProperties ?? interfaceType.properties).map(([key, value]) => {
      return [key, wirePropertyV2ToSdkPropertyDefinition(value, true, log)];
    }).filter(([key, value]) => value != null)),
    links: {},
    implementedBy: interfaceType.implementedByObjectTypes
  };
}
function getModifiedEntityTypes(action) {
  const addedObjects = /* @__PURE__ */ new Set();
  const modifiedObjects = /* @__PURE__ */ new Set();
  for (const operation of action.operations) {
    switch (operation.type) {
      case "createObject":
        addedObjects.add(operation.objectTypeApiName);
        break;
      case "modifyObject":
        modifiedObjects.add(operation.objectTypeApiName);
        break;
      case "deleteObject":
      case "createLink":
      case "deleteLink":
      case "createInterfaceObject":
      case "modifyInterfaceObject":
      case "deleteInterfaceObject":
        break;
      default:
    }
  }
  return {
    addedObjects,
    modifiedObjects
  };
}
function wirePropertyV2ToSdkPrimaryKeyTypeDefinition(input) {
  switch (input.dataType.type) {
    case "integer":
    case "double":
    case "string":
    case "byte":
    case "long":
    case "short":
    case "timestamp": {
      return input.dataType.type;
    }
    case "date": {
      return "datetime";
    }
    case "boolean":
    case "geopoint":
    case "geoshape":
    case "decimal":
    case "attachment":
    case "timeseries":
    case "array":
    case "marking":
    case "float":
    case "geotimeSeriesReference":
    case "mediaReference":
    case "struct":
    case "cipherText":
    case "vector":
      throw new Error(`Primary key of type ${input.dataType.type} is not supported`);
    default:
      input.dataType;
      throw new Error(`Unknown type encountered for primaryKey: ${input.dataType}`);
  }
}
function wireObjectTypeFullMetadataToSdkObjectMetadata(objectTypeWithLink, v2, log) {
  if (objectTypeWithLink.objectType.properties[objectTypeWithLink.objectType.primaryKey] === void 0) {
    throw new Error(`Primary key ${objectTypeWithLink.objectType.primaryKey} not found in ${objectTypeWithLink.objectType.apiName}`);
  }
  if (objectTypeWithLink.implementsInterfaces2 == null && objectTypeWithLink.implementsInterfaces != null) {
    throw new Error("Your ontology.json file is missing the implementsInterfaces2 field. Please regenerate it.");
  }
  const interfaceMap = objectTypeWithLink.implementsInterfaces2 ? Object.fromEntries(Object.entries(objectTypeWithLink.implementsInterfaces2).map(([interfaceApiName, impl]) => [interfaceApiName, impl.properties])) : {};
  return {
    type: "object",
    apiName: objectTypeWithLink.objectType.apiName,
    description: objectTypeWithLink.objectType.description,
    primaryKeyApiName: objectTypeWithLink.objectType.primaryKey,
    primaryKeyType: wirePropertyV2ToSdkPrimaryKeyTypeDefinition(objectTypeWithLink.objectType.properties[objectTypeWithLink.objectType.primaryKey]),
    links: Object.fromEntries(objectTypeWithLink.linkTypes.map((linkType) => {
      return [linkType.apiName, {
        multiplicity: linkType.cardinality === "MANY",
        targetType: linkType.objectTypeApiName
      }];
    })),
    properties: Object.fromEntries(Object.entries(objectTypeWithLink.objectType.properties).map(([key, value]) => [key, wirePropertyV2ToSdkPropertyDefinition(value, !(v2 && objectTypeWithLink.objectType.primaryKey === key), log)]).filter(([key, value]) => value != null)),
    implements: objectTypeWithLink.implementsInterfaces,
    interfaceMap,
    inverseInterfaceMap: Object.fromEntries(Object.entries(interfaceMap).map(([interfaceApiName, props]) => [interfaceApiName, invertProps(props)])),
    icon: supportedIconTypes.includes(objectTypeWithLink.objectType.icon.type) ? objectTypeWithLink.objectType.icon : void 0,
    titleProperty: objectTypeWithLink.objectType.titleProperty,
    displayName: objectTypeWithLink.objectType.displayName,
    pluralDisplayName: objectTypeWithLink.objectType.pluralDisplayName,
    status: ensureStringEnumSupportedOrUndefined(objectTypeWithLink.objectType.status, supportedReleaseStatus),
    rid: objectTypeWithLink.objectType.rid,
    visibility: ensureStringEnumSupportedOrUndefined(objectTypeWithLink.objectType.visibility, supportedObjectTypeVisibility)
  };
}
function invertProps(a) {
  return a ? Object.fromEntries(Object.entries(a).map(([k, v]) => [v, k])) : void 0;
}
const supportedIconTypes = ["blueprint"];
const supportedReleaseStatus = ["ACTIVE", "EXPERIMENTAL", "DEPRECATED", "ENDORSED"];
const supportedObjectTypeVisibility = ["NORMAL", "PROMINENT", "HIDDEN"];
function ensureStringEnumSupportedOrUndefined(value, supportedValues) {
  return value && supportedValues.includes(value) ? value : void 0;
}
function wireActionTypeV2ToSdkActionMetadata(input) {
  const modifiedEntityTypes = getModifiedEntityTypes(input);
  return {
    type: "action",
    apiName: input.apiName,
    parameters: Object.fromEntries(Object.entries(input.parameters).map(([key, value]) => [key, wireActionParameterV2ToSdkParameterDefinition(value)])),
    displayName: input.displayName,
    description: input.description,
    modifiedEntities: createModifiedEntities(modifiedEntityTypes.addedObjects, modifiedEntityTypes.modifiedObjects),
    rid: input.rid,
    status: ensureStringEnumSupportedOrUndefined(input.status, supportedReleaseStatus)
  };
}
function wireActionParameterV2ToSdkParameterDefinition(value) {
  return {
    multiplicity: value.dataType.type === "array",
    type: actionPropertyToSdkPropertyDefinition(value.dataType.type === "array" ? value.dataType.subType : value.dataType),
    nullable: !value.required,
    description: value.description
  };
}
function actionPropertyToSdkPropertyDefinition(parameterType) {
  switch (parameterType.type) {
    case "string":
    case "boolean":
    case "attachment":
    case "double":
    case "integer":
    case "long":
    case "timestamp":
    case "mediaReference":
    case "marking":
    case "objectType":
    case "geohash":
    case "geoshape":
      return parameterType.type;
    case "date":
      return "datetime";
    case "objectSet":
      return {
        type: "objectSet",
        objectSet: parameterType.objectTypeApiName
      };
    case "object":
      return {
        type: "object",
        object: parameterType.objectTypeApiName
      };
    case "array":
      return actionPropertyToSdkPropertyDefinition(parameterType.subType);
    case "interfaceObject":
      return {
        type: "interface",
        interface: parameterType.interfaceTypeApiName
      };
    case "struct":
      return {
        type: "struct",
        struct: parameterType.fields.reduce((structMap, structField) => {
          structMap[structField.name] = actionPropertyToSdkPropertyDefinition(structField.fieldType);
          return structMap;
        }, {})
      };
    default:
      throw new Error(`Unsupported action parameter type: ${JSON.stringify(parameterType)}`);
  }
}
function createModifiedEntities(addedObjects, modifiedObjects) {
  const entities = {};
  for (const key of addedObjects) {
    entities[key] = {
      created: true,
      modified: false
    };
  }
  for (const key of modifiedObjects) {
    if (entities[key]) {
      entities[key].modified = true;
    } else {
      entities[key] = {
        created: false,
        modified: true
      };
    }
  }
  return entities;
}
function isNullableQueryDataType(input) {
  if (input.type === "null") {
    return true;
  }
  if (input.type === "union") {
    return input.unionTypes.some((t) => isNullableQueryDataType(t));
  }
  return false;
}
function wireQueryDataTypeToQueryDataTypeDefinition(input) {
  switch (input.type) {
    case "double":
    case "float":
    case "integer":
    case "long":
    case "attachment":
    case "boolean":
    case "date":
    case "string":
    case "timestamp":
      return {
        type: input.type,
        nullable: false
      };
    case "object":
      return {
        type: "object",
        object: input.objectTypeApiName,
        nullable: false
      };
    case "objectSet":
      return {
        type: "objectSet",
        objectSet: input.objectTypeApiName,
        nullable: false
      };
    case "array":
      return {
        ...wireQueryDataTypeToQueryDataTypeDefinition(input.subType),
        multiplicity: true
      };
    case "set":
      return {
        type: "set",
        set: wireQueryDataTypeToQueryDataTypeDefinition(input.subType),
        nullable: false
      };
    case "union":
      const allowNulls = isNullableQueryDataType(input);
      if (allowNulls && input.unionTypes.length === 2) {
        const nonNull = input.unionTypes.find((t) => t.type != null);
        if (nonNull) {
          return {
            ...wireQueryDataTypeToQueryDataTypeDefinition(nonNull),
            nullable: true
          };
        }
      }
      return {
        type: "union",
        union: input.unionTypes.reduce((acc, t) => {
          if (t.type === "null") {
            return acc;
          }
          acc.push(wireQueryDataTypeToQueryDataTypeDefinition(t));
          return acc;
        }, []),
        nullable: allowNulls
      };
    case "struct":
      return {
        type: "struct",
        struct: Object.fromEntries(input.fields.map((f) => [f.name, wireQueryDataTypeToQueryDataTypeDefinition(f.fieldType)])),
        nullable: false
      };
    case "twoDimensionalAggregation":
      return {
        type: "twoDimensionalAggregation",
        twoDimensionalAggregation: get2DQueryAggregationProps(input),
        nullable: false
      };
    case "threeDimensionalAggregation":
      return {
        type: "threeDimensionalAggregation",
        threeDimensionalAggregation: get3DQueryAggregationProps(input),
        nullable: false
      };
    case "entrySet":
      const keyType = wireQueryDataTypeToQueryDataTypeDefinition(input.keyType);
      if (!validMapKeyTypes.includes(keyType.type)) {
        throw new Error("Map types with a key type of " + keyType.type + " are not supported" + validMapKeyTypes.toString());
      }
      if (keyType.multiplicity === true) {
        throw new Error("Map types cannot have keys as arrays");
      }
      return {
        type: "map",
        nullable: false,
        keyType,
        valueType: wireQueryDataTypeToQueryDataTypeDefinition(input.valueType)
      };
    case "null":
    case "unsupported":
      throw new Error(`Unable to process query because the server indicated an unsupported QueryDataType.type: ${input.type}. Please check that your query is using supported types.`);
    default:
      throw new Error(`Unsupported QueryDataType.type ${input.type}`);
  }
}
function get2DQueryAggregationProps(input) {
  if (input.keyType.type === "range") {
    return {
      keyType: input.keyType.type,
      keySubtype: input.keyType.subType.type,
      valueType: input.valueType.type
    };
  } else {
    if (guardInvalidKeyTypes(input.keyType)) {
      return {
        keyType: input.keyType.type,
        valueType: input.valueType.type
      };
    }
    throw new Error(`Cannot create 2D aggregation with ${input.keyType.type} as its type`);
  }
}
function get3DQueryAggregationProps(input) {
  if (input.keyType.type === "range") {
    return {
      keyType: input.keyType.type,
      keySubtype: input.keyType.subType.type,
      valueType: get2DQueryAggregationProps(input.valueType)
    };
  } else {
    if (guardInvalidKeyTypes(input.keyType)) {
      return {
        keyType: input.keyType.type,
        valueType: get2DQueryAggregationProps(input.valueType)
      };
    }
    throw new Error(`Cannot create 3D aggregation with ${input.keyType.type} as its type`);
  }
}
function guardInvalidKeyTypes(key) {
  return key.type === "string" || key.type === "boolean";
}
const validMapKeyTypes = ["string", "object", "double", "float", "integer", "long", "date", "timestamp", "byte", "datetime", "decimal", "marking", "short", "objectType"];
function wireQueryTypeV2ToSdkQueryMetadata(input) {
  return {
    type: "query",
    apiName: input.apiName,
    description: input.description,
    displayName: input.displayName,
    version: input.version,
    parameters: Object.fromEntries(Object.entries(input.parameters).map(([name, parameter]) => [name, wireQueryParameterV2ToQueryParameterDefinition(parameter)])),
    output: wireQueryDataTypeToQueryDataTypeDefinition(input.output),
    rid: input.rid
  };
}
function wireQueryTypeV2ToSdkQueryDefinitionNoParams(input) {
  return {
    type: "query",
    apiName: input.apiName,
    description: input.description,
    displayName: input.displayName,
    version: input.version,
    rid: input.rid
  };
}
function wireQueryParameterV2ToQueryParameterDefinition(parameter) {
  return {
    description: parameter.description,
    ...wireQueryDataTypeToQueryDataTypeDefinition(parameter.dataType)
  };
}
async function loadActionMetadata(client, actionType) {
  const r = await get$h(client, await client.ontologyRid, actionType);
  return wireActionTypeV2ToSdkActionMetadata(r);
}
async function loadFullObjectMetadata(client, objectType) {
  const full = await getFullMetadata$1(client, await client.ontologyRid, objectType, {
    preview: true
  });
  const ret = wireObjectTypeFullMetadataToSdkObjectMetadata(full, true);
  return {
    ...ret
  };
}
async function loadInterfaceMetadata(client, objectType) {
  const r = await get$e(client, await client.ontologyRid, objectType, {
    preview: true
  });
  return __UNSTABLE_wireInterfaceTypeV2ToSdkObjectDefinition(r, true);
}
async function loadQueryMetadata(client, queryTypeApiNameAndVersion) {
  const [apiName, version] = queryTypeApiNameAndVersion.split(":");
  const r = await get$a(client, await client.ontologyRid, apiName, {
    version
  });
  return wireQueryTypeV2ToSdkQueryMetadata(r);
}
const createStandardOntologyProviderFactory = () => {
  return (client) => {
    function makeGetter(fn) {
      const cache = createAsyncClientCache((client2, key) => fn(client2, key, false));
      return async (apiName) => {
        return await cache.get(client, apiName);
      };
    }
    const ret = {
      getObjectDefinition: makeGetter(async function(client2, key) {
        var _a2;
        const objectDef = await loadFullObjectMetadata(client2, key);
        const interfaceDefs = Object.fromEntries((await Promise.all(((_a2 = objectDef.implements) == null ? void 0 : _a2.map((i) => ret.getInterfaceDefinition(i))) ?? [])).map((i) => [i.apiName, {
          def: i,
          handler: void 0
        }]));
        const fullObjectDef = {
          ...objectDef,
          [InterfaceDefinitions]: interfaceDefs
        };
        return fullObjectDef;
      }),
      getInterfaceDefinition: makeGetter(async function(client2, key) {
        return loadInterfaceMetadata(client2, key);
      }),
      getActionDefinition: makeGetter(async function(client2, key) {
        const r = await loadActionMetadata(client2, key);
        return r;
      }),
      getQueryDefinition: function(client2, fn) {
        const queryCache = createAsyncClientCache((client3, key) => {
          return fn(client3, key);
        });
        return async (apiName, version) => {
          const key = version ? `${apiName}:${version}` : apiName;
          return await queryCache.get(client2, key);
        };
      }(client, async function(client2, key) {
        return loadQueryMetadata(client2, key);
      })
    };
    return ret;
  };
};
const USER_AGENT$1 = `osdk-client/${"2.3.0-beta.8"}`;
const OBSERVABLE_USER_AGENT = `osdk-observable-client/${"2.3.0-beta.8"}`;
function createMinimalClient(metadata, baseUrl, tokenProvider, options = {}, fetchFn = global.fetch, objectSetFactory = createObjectSet, createOntologyProviderFactory = createStandardOntologyProviderFactory) {
  if (false) {
    try {
      new URL(baseUrl);
    } catch (e2) {
      const hint = !baseUrl.startsWith("http://") || !baseUrl.startsWith("https://") ? ". Did you forget to add 'http://' or 'https://'?" : "";
      throw new Error(`Invalid stack URL: ${baseUrl}${hint}`);
    }
  }
  const processedBaseUrl = new URL(baseUrl);
  processedBaseUrl.pathname += processedBaseUrl.pathname.endsWith("/") ? "" : "/";
  const minimalClient = {
    ...createSharedClientContext(processedBaseUrl.toString(), tokenProvider, USER_AGENT$1, fetchFn),
    objectSetFactory,
    objectFactory: convertWireToOsdkObjects,
    objectFactory2: convertWireToOsdkObjects2,
    ontologyRid: metadata.ontologyRid,
    logger: options.logger,
    clientCacheKey: {},
    requestContext: {}
  };
  return Object.freeze(Object.assign(minimalClient, {
    ontologyProvider: createOntologyProviderFactory(options)(minimalClient)
  }));
}
const fetchMetadataInternal = async (client, definition) => {
  if (definition.type === "object") {
    const {
      [InterfaceDefinitions]: interfaceDefs,
      ...objectTypeDef
    } = await client.ontologyProvider.getObjectDefinition(definition.apiName);
    return objectTypeDef;
  } else if (definition.type === "interface") {
    return client.ontologyProvider.getInterfaceDefinition(definition.apiName);
  } else if (definition.type === "action") {
    return client.ontologyProvider.getActionDefinition(definition.apiName);
  } else if (definition.type === "query") {
    return client.ontologyProvider.getQueryDefinition(definition.apiName, definition.isFixedVersion ? definition.version : void 0);
  } else {
    throw new Error("Not implemented for given definition");
  }
};
function noop() {
}
const levels = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60
};
class BaseLogger {
  constructor(bindings, options = {}, factory) {
    __privateAdd(this, _factory);
    __publicField(this, "trace", noop);
    __publicField(this, "debug", noop);
    __publicField(this, "warn", noop);
    __publicField(this, "info", noop);
    __publicField(this, "error", noop);
    __publicField(this, "fatal", noop);
    var _a2;
    this.bindings = bindings;
    this.options = options;
    __privateSet(this, _factory, factory);
    for (const k of ["trace", "debug", "info", "warn", "error", "fatal"]) {
      if (((_a2 = this.options) == null ? void 0 : _a2.level) && !this.isLevelEnabled(k)) {
        continue;
      }
      this[k] = this.createLogMethod(k, bindings);
    }
  }
  child(bindings, options) {
    var _a2, _b2;
    return new (__privateGet(this, _factory))({
      ...this.bindings,
      ...bindings
    }, {
      level: (options == null ? void 0 : options.level) ?? ((_a2 = this.options) == null ? void 0 : _a2.level),
      msgPrefix: [(_b2 = this.options) == null ? void 0 : _b2.msgPrefix, options == null ? void 0 : options.msgPrefix].filter((x) => x).join(" ")
    });
  }
  isLevelEnabled(level) {
    var _a2;
    const ourLevel = ((_a2 = this.options) == null ? void 0 : _a2.level) ?? "info";
    return level in levels && ourLevel in levels && levels[level] >= levels[ourLevel];
  }
}
_factory = new WeakMap();
class MinimalLogger extends BaseLogger {
  constructor(bindings = {}, options = {}) {
    super(bindings, {
      ...options,
      level: options.level ?? "error"
    }, MinimalLogger);
  }
  createLogMethod(name, bindings) {
    var _a2;
    const msgs = [name];
    if ((_a2 = this.options) == null ? void 0 : _a2.msgPrefix) {
      msgs.push(this.options.msgPrefix);
    }
    if (typeof bindings === "object" && "methodName" in bindings) {
      msgs.push(`.${bindings.methodName}()`);
    }
    return (...args) => {
      console[name === "fatal" ? "error" : name](msgs.join(" "), ...args);
    };
  }
}
async function toDataValueQueries(value, client, desiredType) {
  if (value == null) {
    return value;
  }
  if (Array.isArray(value) && desiredType.multiplicity) {
    const values = Array.from(value);
    if (values.some((dataValue) => isAttachmentUpload(dataValue) || isAttachmentFile(dataValue))) {
      const converted = [];
      for (const value2 of values) {
        converted.push(await toDataValueQueries(value2, client, desiredType));
      }
      return converted;
    }
    const promiseArray = Array.from(value, async (innerValue) => await toDataValueQueries(innerValue, client, desiredType));
    return Promise.all(promiseArray);
  }
  switch (desiredType.type) {
    case "attachment": {
      if (isAttachmentUpload(value)) {
        const attachment = await upload$1(client, value.data, {
          filename: value.name
        });
        return attachment.rid;
      }
      if (isAttachmentFile(value)) {
        const attachment = await upload$1(client, value, {
          filename: value.name
        });
        return attachment.rid;
      }
      return value;
    }
    case "twoDimensionalAggregation": {
      return {
        groups: value
      };
    }
    case "threeDimensionalAggregation": {
      return {
        groups: value
      };
    }
    case "set": {
      if (value instanceof Set) {
        const promiseArray = Array.from(value, async (innerValue) => await toDataValueQueries(innerValue, client, desiredType["set"]));
        return Promise.all(promiseArray);
      }
      break;
    }
    case "object": {
      if (isObjectSpecifiersObject(value)) {
        return value.$primaryKey;
      }
      break;
    }
    case "objectSet": {
      if (isWireObjectSet(value)) {
        return value;
      }
      if (isObjectSet(value)) {
        return getWireObjectSet(value);
      }
      break;
    }
    case "map": {
      if (typeof value === "object") {
        const entrySet = [];
        for (const [key, mapValue] of Object.entries(value)) {
          entrySet.push({
            key: desiredType.keyType.type === "object" ? extractPrimaryKeyFromObjectSpecifier(key) : await toDataValueQueries(key, client, desiredType.keyType),
            value: await toDataValueQueries(mapValue, client, desiredType.valueType)
          });
        }
        return entrySet;
      }
      break;
    }
    case "struct": {
      if (typeof value === "object") {
        const structMap = {};
        for (const [key, structValue] of Object.entries(value)) {
          structMap[key] = await toDataValueQueries(structValue, client, desiredType["struct"][key]);
        }
        return structMap;
      }
    }
    case "boolean":
    case "date":
    case "double":
    case "float":
    case "integer":
    case "long":
    case "string":
    case "timestamp":
      return value;
  }
  return value;
}
async function applyQuery(client, query, params) {
  const qd = await client.ontologyProvider.getQueryDefinition(query.apiName, query.isFixedVersion ? query.version : void 0);
  const response = await execute(addUserAgentAndRequestContextHeaders(augmentRequestContext(client, () => ({
    finalMethodCall: "applyQuery"
  })), query), await client.ontologyRid, query.apiName, {
    parameters: params ? await remapQueryParams(params, client, qd.parameters) : {}
  }, {
    version: qd.version
  });
  const objectOutputDefs = await getRequiredDefinitions(qd.output, client);
  const remappedResponse = await remapQueryResponse(client, qd.output, response.value, objectOutputDefs);
  return remappedResponse;
}
async function remapQueryParams(params, client, paramTypes) {
  const parameterMap = {};
  for (const [key, value] of Object.entries(params)) {
    parameterMap[key] = await toDataValueQueries(value, client, paramTypes[key]);
  }
  return parameterMap;
}
async function remapQueryResponse(client, responseDataType, responseValue, definitions) {
  if (responseValue == null) {
    if (responseDataType.nullable) {
      return void 0;
    } else {
      throw new Error("Got null response when nullable was not allowed");
    }
  }
  if (responseDataType.multiplicity != null && responseDataType.multiplicity) {
    const withoutMultiplicity = {
      ...responseDataType,
      multiplicity: false
    };
    for (let i = 0; i < responseValue.length; i++) {
      responseValue[i] = await remapQueryResponse(client, withoutMultiplicity, responseValue[i], definitions);
    }
    return responseValue;
  }
  switch (responseDataType.type) {
    case "union": {
      throw new Error("Union return types are not yet supported");
    }
    case "set": {
      for (let i = 0; i < responseValue.length; i++) {
        responseValue[i] = await remapQueryResponse(client, responseDataType.set, responseValue[i], definitions);
      }
      return responseValue;
    }
    case "attachment": {
      return hydrateAttachmentFromRidInternal(client, responseValue);
    }
    case "object": {
      const def = definitions.get(responseDataType.object);
      if (!def || def.type !== "object") {
        throw new Error(`Missing definition for ${responseDataType.object}`);
      }
      return createQueryObjectResponse(responseValue, def);
    }
    case "objectSet": {
      const def = definitions.get(responseDataType.objectSet);
      if (!def) {
        throw new Error(`Missing definition for ${responseDataType.objectSet}`);
      }
      if (typeof responseValue === "string") {
        return createObjectSet(def, client, {
          type: "intersect",
          objectSets: [{
            type: "base",
            objectType: responseDataType.objectSet
          }, {
            type: "reference",
            reference: responseValue
          }]
        });
      }
      return createObjectSet(def, client, responseValue);
    }
    case "struct": {
      for (const [key, subtype] of Object.entries(responseDataType.struct)) {
        if (requiresConversion(subtype)) {
          responseValue[key] = await remapQueryResponse(client, subtype, responseValue[key], definitions);
        }
      }
      return responseValue;
    }
    case "map": {
      const map = {};
      !Array.isArray(responseValue) ? false ? invariant(false, "Expected array entry") : invariant(false) : void 0;
      for (const entry of responseValue) {
        !entry.key ? false ? invariant(false, "Expected key") : invariant(false) : void 0;
        !entry.value ? false ? invariant(false, "Expected value") : invariant(false) : void 0;
        const key = responseDataType.keyType.type === "object" ? getObjectSpecifier(entry.key, responseDataType.keyType.object, definitions) : entry.key;
        const value = await remapQueryResponse(client, responseDataType.valueType, entry.value, definitions);
        map[key] = value;
      }
      return map;
    }
    case "twoDimensionalAggregation": {
      const result = [];
      for (const {
        key,
        value
      } of responseValue.groups) {
        result.push({
          key,
          value
        });
      }
      return result;
    }
    case "threeDimensionalAggregation": {
      const result = [];
      for (const {
        key,
        groups
      } of responseValue.groups) {
        const subResult = [];
        for (const {
          key: subKey,
          value
        } of groups) {
          subResult.push({
            key: subKey,
            value
          });
        }
        result.push({
          key,
          groups: subResult
        });
      }
      return result;
    }
  }
  return responseValue;
}
async function getRequiredDefinitions(dataType, client) {
  const result = /* @__PURE__ */ new Map();
  switch (dataType.type) {
    case "objectSet": {
      const objectDef = await client.ontologyProvider.getObjectDefinition(dataType.objectSet);
      result.set(dataType.objectSet, objectDef);
      break;
    }
    case "object": {
      const objectDef = await client.ontologyProvider.getObjectDefinition(dataType.object);
      result.set(dataType.object, objectDef);
      break;
    }
    case "set": {
      return getRequiredDefinitions(dataType.set, client);
    }
    case "map": {
      for (const value of [dataType.keyType, dataType.valueType]) {
        for (const [type, objectDef] of await getRequiredDefinitions(value, client)) {
          result.set(type, objectDef);
        }
      }
      break;
    }
    case "struct": {
      for (const value of Object.values(dataType.struct)) {
        for (const [type, objectDef] of await getRequiredDefinitions(value, client)) {
          result.set(type, objectDef);
        }
      }
      break;
    }
    case "attachment":
    case "boolean":
    case "date":
    case "double":
    case "float":
    case "integer":
    case "long":
    case "string":
    case "threeDimensionalAggregation":
    case "timestamp":
    case "twoDimensionalAggregation":
    case "union":
      break;
  }
  return result;
}
function requiresConversion(dataType) {
  switch (dataType.type) {
    case "boolean":
    case "date":
    case "double":
    case "float":
    case "integer":
    case "long":
    case "string":
    case "timestamp":
      return false;
    case "union":
      return true;
    case "struct":
      return Object.values(dataType.struct).some(requiresConversion);
    case "set":
      return requiresConversion(dataType.set);
    case "attachment":
    case "objectSet":
    case "twoDimensionalAggregation":
    case "threeDimensionalAggregation":
    case "object":
      return true;
    default:
      return false;
  }
}
function getObjectSpecifier(primaryKey, objectTypeApiName, definitions) {
  const def = definitions.get(objectTypeApiName);
  if (!def || def.type !== "object") {
    throw new Error(`Missing definition for ${objectTypeApiName}`);
  }
  return createObjectSpecifierFromPrimaryKey(def, primaryKey);
}
function createQueryObjectResponse(primaryKey, objectDef) {
  return {
    $apiName: objectDef.apiName,
    $title: void 0,
    $objectType: objectDef.apiName,
    $primaryKey: primaryKey,
    $objectSpecifier: createObjectSpecifierFromPrimaryKey(objectDef, primaryKey)
  };
}
class ActionInvoker {
  constructor(clientCtx, actionDef) {
    this.applyAction = applyAction.bind(void 0, clientCtx, actionDef);
    this.batchApplyAction = applyAction.bind(void 0, clientCtx, actionDef);
  }
}
class QueryInvoker {
  constructor(clientCtx, queryDef) {
    this.executeFunction = applyQuery.bind(void 0, clientCtx, queryDef);
  }
}
function createClientInternal(objectSetFactory, baseUrl, ontologyRid, tokenProvider, options = void 0, fetchFn = fetch) {
  if (typeof ontologyRid === "string") {
    if (!ontologyRid.startsWith("ri.")) {
      throw new Error("Invalid ontology RID");
    }
  } else {
    ontologyRid.then((ontologyRid2) => {
      if (!ontologyRid2.startsWith("ri.")) {
        throw new Error("Invalid ontology RID");
      }
    });
  }
  const clientCtx = createMinimalClient({
    ontologyRid
  }, baseUrl, tokenProvider, {
    ...options,
    logger: (options == null ? void 0 : options.logger) ?? new MinimalLogger()
  }, fetchFn, objectSetFactory);
  return createClientFromContext(clientCtx);
}
function createClientFromContext(clientCtx) {
  const fetchMetadata = fetchMetadataInternal.bind(void 0, clientCtx);
  const client = Object.defineProperties(function(o) {
    if (o.type === "object" || o.type === "interface") {
      return clientCtx.objectSetFactory(o, clientCtx);
    } else if (o.type === "action") {
      return new ActionInvoker(clientCtx, o);
    } else if (o.type === "query") {
      return new QueryInvoker(clientCtx, o);
    } else if (o.type === "experiment") {
      switch (o.name) {
        case __EXPERIMENTAL__NOT_SUPPORTED_YET__getBulkLinks.name:
          return {
            getBulkLinks: createBulkLinksAsyncIterFactory(clientCtx)
          };
        case __EXPERIMENTAL__NOT_SUPPORTED_YET__fetchOneByRid.name:
          return {
            fetchOneByRid: async (objectType, rid, options) => {
              return await fetchSingle(clientCtx, objectType, options, createWithRid([rid]));
            }
          };
        case __EXPERIMENTAL__NOT_SUPPORTED_YET__createMediaReference.name:
          return {
            createMediaReference: async (args) => {
              const {
                data,
                fileName,
                objectType,
                propertyType
              } = args;
              return await upload(clientCtx, await clientCtx.ontologyRid, objectType.apiName, propertyType, data, {
                mediaItemPath: fileName,
                preview: true
              });
            }
          };
        case __EXPERIMENTAL__NOT_SUPPORTED_YET__fetchPageByRid.name:
          return {
            fetchPageByRid: async (objectOrInterfaceType, rids, options = {}) => {
              return await fetchPage(clientCtx, objectOrInterfaceType, options, createWithRid(rids));
            }
          };
      }
      throw new Error("not implemented");
    } else {
      throw new Error("not implemented");
    }
  }, {
    [symbolClientContext$1]: {
      value: clientCtx
    },
    ["__osdkClientContext"]: {
      value: clientCtx
    },
    [additionalContext]: {
      value: clientCtx
    },
    fetchMetadata: {
      value: fetchMetadata
    }
  });
  return client;
}
const createClient = createClientInternal.bind(void 0, createObjectSet);
function createWithRid(rids) {
  return {
    type: "static",
    "objects": rids
  };
}
function createPlatformClient(baseUrl, tokenProvider, options = void 0, fetchFn = fetch) {
  return createSharedClientContext(baseUrl, tokenProvider, USER_AGENT$1, fetchFn);
}
const isoRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?$/;
const extractDate = (dateTime) => {
  !(dateTime.length < 33) ? false ? invariant(false, "Invalid date format. Provided input is too long.") : invariant(false) : void 0;
  !isoRegex.test(dateTime) ? false ? invariant(false, `Invalid date format. Expected ISO 8601 format, but received ${dateTime}`) : invariant(false) : void 0;
  return extractDateFromIsoString(dateTime);
};
const extractDateInUTC = (date) => {
  return extractDateFromIsoString(date.toISOString());
};
const extractDateInLocalTime = (date) => {
  return extractDateFromIsoString(generateOffsetUtcString(date));
};
const generateOffsetUtcString = (date) => {
  const offsetMs = date.getTimezoneOffset() * 60 * 1e3;
  return new Date(date.getTime() - offsetMs).toISOString();
};
const extractDateFromIsoString = (dateTime) => {
  return dateTime.split("T")[0];
};
const $osdkMetadata = { extraUserAgent: "typescript-sdk/0.8.0 typescript-sdk-generator/2.3.0-beta.5" };
const $ontologyRid = "ri.ontology.main.ontology.ab265709-5927-4853-99f0-c8f173e324e0";
const buildLegsFlightPlanner20 = {
  apiName: "buildLegsFlightPlanner20",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const buildNewGtLocationsV2 = {
  apiName: "buildNewGtLocationsV2",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const calculateFlightTimes = {
  apiName: "calculateFlightTimes",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const calculateSunriseSunset = {
  apiName: "calculateSunriseSunset",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const createFlightLogObject = {
  apiName: "createFlightLogObject",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const createFlightWithWaypoints = {
  apiName: "createFlightWithWaypoints",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const createNewFlightFp2 = {
  apiName: "createNewFlightFp2",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const createOrModifyMainFuelFastPlanner = {
  apiName: "createOrModifyMainFuelFastPlanner",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const deleteLocationAllgtlocationsV2 = {
  apiName: "deleteLocationAllgtlocationsV2",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const editExistingFlightFp2 = {
  apiName: "editExistingFlightFp2",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const flightAppUpdateEtdAndCrew = {
  apiName: "flightAppUpdateEtdAndCrew",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const flightFuelFpv2 = {
  apiName: "flightFuelFpv2",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const flightWeatherRiskTriggeredLightningWaves = {
  apiName: "flightWeatherRiskTriggeredLightningWaves",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const getGlobalWindsForFlight = {
  apiName: "getGlobalWindsForFlight",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const getWeatherForAlternates = {
  apiName: "getWeatherForAlternates",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const pseudoWeatherSegments = {
  apiName: "pseudoWeatherSegments",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const singleFlightAutomation = {
  apiName: "singleFlightAutomation",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const updateAlternantOneStep = {
  apiName: "updateAlternantOneStep",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const updateFastPlannerFlight = {
  apiName: "updateFastPlannerFlight",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const updateWeatherByRegion = {
  apiName: "updateWeatherByRegion",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const weatherWebookNorwayV9 = {
  apiName: "weatherWebookNorwayV9",
  type: "action",
  osdkMetadata: $osdkMetadata
};
const actions = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  buildLegsFlightPlanner20,
  buildNewGtLocationsV2,
  calculateFlightTimes,
  calculateSunriseSunset,
  createFlightLogObject,
  createFlightWithWaypoints,
  createNewFlightFp2,
  createOrModifyMainFuelFastPlanner,
  deleteLocationAllgtlocationsV2,
  editExistingFlightFp2,
  flightAppUpdateEtdAndCrew,
  flightFuelFpv2,
  flightWeatherRiskTriggeredLightningWaves,
  getGlobalWindsForFlight,
  getWeatherForAlternates,
  pseudoWeatherSegments,
  singleFlightAutomation,
  updateAlternantOneStep,
  updateFastPlannerFlight,
  updateWeatherByRegion,
  weatherWebookNorwayV9
}, Symbol.toStringTag, { value: "Module" }));
const interfaces = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
const AirportsData = {
  type: "object",
  apiName: "AirportsData",
  osdkMetadata: $osdkMetadata
};
const AllGtLocationsV2 = {
  type: "object",
  apiName: "AllGtLocationsV2",
  osdkMetadata: $osdkMetadata
};
const Asset = {
  type: "object",
  apiName: "Asset",
  osdkMetadata: $osdkMetadata
};
const BristowHelidecks = {
  type: "object",
  apiName: "BristowHelidecks",
  osdkMetadata: $osdkMetadata
};
const FlightFuelDburbury = {
  type: "object",
  apiName: "FlightFuelDburbury",
  osdkMetadata: $osdkMetadata
};
const FlightLogObject = {
  type: "object",
  apiName: "FlightLogObject",
  osdkMetadata: $osdkMetadata
};
const FuelPolicyBuilder = {
  type: "object",
  apiName: "FuelPolicyBuilder",
  osdkMetadata: $osdkMetadata
};
const InternationalWeather = {
  type: "object",
  apiName: "InternationalWeather",
  osdkMetadata: $osdkMetadata
};
const LegObjectOutputObject = {
  type: "object",
  apiName: "LegObjectOutputObject",
  osdkMetadata: $osdkMetadata
};
const MainFlightObjectFp2 = {
  type: "object",
  apiName: "MainFlightObjectFp2",
  osdkMetadata: $osdkMetadata
};
const MainFuelV2 = {
  type: "object",
  apiName: "MainFuelV2",
  osdkMetadata: $osdkMetadata
};
const NorwayWeatherDatav2 = {
  type: "object",
  apiName: "NorwayWeatherDatav2",
  osdkMetadata: $osdkMetadata
};
const NorwayWeatherSegments = {
  type: "object",
  apiName: "NorwayWeatherSegments",
  osdkMetadata: $osdkMetadata
};
const NorwayWeatherXv8 = {
  type: "object",
  apiName: "NorwayWeatherXv8",
  osdkMetadata: $osdkMetadata
};
const RegionalWeatherMinimaSettings = {
  type: "object",
  apiName: "RegionalWeatherMinimaSettings",
  osdkMetadata: $osdkMetadata
};
const User = {
  type: "object",
  apiName: "User",
  osdkMetadata: $osdkMetadata
};
const objects = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  AirportsData,
  AllGtLocationsV2,
  Asset,
  BristowHelidecks,
  FlightFuelDburbury,
  FlightLogObject,
  FuelPolicyBuilder,
  InternationalWeather,
  LegObjectOutputObject,
  MainFlightObjectFp2,
  MainFuelV2,
  NorwayWeatherDatav2,
  NorwayWeatherSegments,
  NorwayWeatherXv8,
  RegionalWeatherMinimaSettings,
  User
}, Symbol.toStringTag, { value: "Module" }));
const queries = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null
}, Symbol.toStringTag, { value: "Module" }));
const index = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  $Actions: actions,
  $Interfaces: interfaces,
  $Objects: objects,
  $Queries: queries,
  $ontologyRid,
  $osdkMetadata,
  AirportsData,
  AllGtLocationsV2,
  Asset,
  BristowHelidecks,
  FlightFuelDburbury,
  FlightLogObject,
  FuelPolicyBuilder,
  InternationalWeather,
  LegObjectOutputObject,
  MainFlightObjectFp2,
  MainFuelV2,
  NorwayWeatherDatav2,
  NorwayWeatherSegments,
  NorwayWeatherXv8,
  RegionalWeatherMinimaSettings,
  User,
  buildLegsFlightPlanner20,
  buildNewGtLocationsV2,
  calculateFlightTimes,
  calculateSunriseSunset,
  createFlightLogObject,
  createFlightWithWaypoints,
  createNewFlightFp2,
  createOrModifyMainFuelFastPlanner,
  deleteLocationAllgtlocationsV2,
  editExistingFlightFp2,
  flightAppUpdateEtdAndCrew,
  flightFuelFpv2,
  flightWeatherRiskTriggeredLightningWaves,
  getGlobalWindsForFlight,
  getWeatherForAlternates,
  pseudoWeatherSegments,
  singleFlightAutomation,
  updateAlternantOneStep,
  updateFastPlannerFlight,
  updateWeatherByRegion,
  weatherWebookNorwayV9
}, Symbol.toStringTag, { value: "Module" }));
let USER_AGENT;
if (typeof navigator === "undefined" || !((_b = (_a = navigator.userAgent) == null ? void 0 : _a.startsWith) == null ? void 0 : _b.call(_a, "Mozilla/5.0 "))) {
  const NAME = "oauth4webapi";
  const VERSION = "v2.17.0";
  USER_AGENT = `${NAME}/${VERSION}`;
}
function looseInstanceOf(input, expected) {
  if (input == null) {
    return false;
  }
  try {
    return input instanceof expected || Object.getPrototypeOf(input)[Symbol.toStringTag] === expected.prototype[Symbol.toStringTag];
  } catch {
    return false;
  }
}
const clockSkew = Symbol();
const clockTolerance = Symbol();
const customFetch = Symbol();
const modifyAssertion = Symbol();
const jweDecrypt = Symbol();
const jwksCache = Symbol();
const useMtlsAlias = Symbol();
const encoder = new TextEncoder();
const decoder = new TextDecoder();
function buf(input) {
  if (typeof input === "string") {
    return encoder.encode(input);
  }
  return decoder.decode(input);
}
const CHUNK_SIZE = 32768;
function encodeBase64Url(input) {
  if (input instanceof ArrayBuffer) {
    input = new Uint8Array(input);
  }
  const arr = [];
  for (let i = 0; i < input.byteLength; i += CHUNK_SIZE) {
    arr.push(String.fromCharCode.apply(null, input.subarray(i, i + CHUNK_SIZE)));
  }
  return btoa(arr.join("")).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}
function decodeBase64Url(input) {
  try {
    const binary = atob(input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, ""));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  } catch (cause) {
    throw new OPE("The input to be decoded is not correctly encoded.", { cause });
  }
}
function b64u(input) {
  if (typeof input === "string") {
    return decodeBase64Url(input);
  }
  return encodeBase64Url(input);
}
class LRU {
  constructor(maxSize) {
    this.cache = /* @__PURE__ */ new Map();
    this._cache = /* @__PURE__ */ new Map();
    this.maxSize = maxSize;
  }
  get(key) {
    let v = this.cache.get(key);
    if (v) {
      return v;
    }
    if (v = this._cache.get(key)) {
      this.update(key, v);
      return v;
    }
    return void 0;
  }
  has(key) {
    return this.cache.has(key) || this._cache.has(key);
  }
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.set(key, value);
    } else {
      this.update(key, value);
    }
    return this;
  }
  delete(key) {
    if (this.cache.has(key)) {
      return this.cache.delete(key);
    }
    if (this._cache.has(key)) {
      return this._cache.delete(key);
    }
    return false;
  }
  update(key, value) {
    this.cache.set(key, value);
    if (this.cache.size >= this.maxSize) {
      this._cache = this.cache;
      this.cache = /* @__PURE__ */ new Map();
    }
  }
}
class UnsupportedOperationError extends Error {
  constructor(message) {
    var _a2;
    super(message ?? "operation not supported");
    this.name = this.constructor.name;
    (_a2 = Error.captureStackTrace) == null ? void 0 : _a2.call(Error, this, this.constructor);
  }
}
class OperationProcessingError extends Error {
  constructor(message, options) {
    var _a2;
    super(message, options);
    this.name = this.constructor.name;
    (_a2 = Error.captureStackTrace) == null ? void 0 : _a2.call(Error, this, this.constructor);
  }
}
const OPE = OperationProcessingError;
const dpopNonces = new LRU(100);
function isCryptoKey(key) {
  return key instanceof CryptoKey;
}
function isPrivateKey(key) {
  return isCryptoKey(key) && key.type === "private";
}
function isPublicKey(key) {
  return isCryptoKey(key) && key.type === "public";
}
const SUPPORTED_JWS_ALGS = [
  "PS256",
  "ES256",
  "RS256",
  "PS384",
  "ES384",
  "RS384",
  "PS512",
  "ES512",
  "RS512",
  "EdDSA"
];
function processDpopNonce(response) {
  try {
    const nonce = response.headers.get("dpop-nonce");
    if (nonce) {
      dpopNonces.set(new URL(response.url).origin, nonce);
    }
  } catch {
  }
  return response;
}
function normalizeTyp(value) {
  return value.toLowerCase().replace(/^application\//, "");
}
function isJsonObject(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    return false;
  }
  return true;
}
function prepareHeaders(input) {
  if (looseInstanceOf(input, Headers)) {
    input = Object.fromEntries(input.entries());
  }
  const headers = new Headers(input);
  if (USER_AGENT && !headers.has("user-agent")) {
    headers.set("user-agent", USER_AGENT);
  }
  if (headers.has("authorization")) {
    throw new TypeError('"options.headers" must not include the "authorization" header name');
  }
  if (headers.has("dpop")) {
    throw new TypeError('"options.headers" must not include the "dpop" header name');
  }
  return headers;
}
function signal(value) {
  if (typeof value === "function") {
    value = value();
  }
  if (!(value instanceof AbortSignal)) {
    throw new TypeError('"options.signal" must return or be an instance of AbortSignal');
  }
  return value;
}
async function discoveryRequest(issuerIdentifier, options) {
  if (!(issuerIdentifier instanceof URL)) {
    throw new TypeError('"issuerIdentifier" must be an instance of URL');
  }
  if (issuerIdentifier.protocol !== "https:" && issuerIdentifier.protocol !== "http:") {
    throw new TypeError('"issuer.protocol" must be "https:" or "http:"');
  }
  const url = new URL(issuerIdentifier.href);
  switch (options == null ? void 0 : options.algorithm) {
    case void 0:
    case "oidc":
      url.pathname = `${url.pathname}/.well-known/openid-configuration`.replace("//", "/");
      break;
    case "oauth2":
      if (url.pathname === "/") {
        url.pathname = ".well-known/oauth-authorization-server";
      } else {
        url.pathname = `.well-known/oauth-authorization-server/${url.pathname}`.replace("//", "/");
      }
      break;
    default:
      throw new TypeError('"options.algorithm" must be "oidc" (default), or "oauth2"');
  }
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.set("accept", "application/json");
  return ((options == null ? void 0 : options[customFetch]) || fetch)(url.href, {
    headers: Object.fromEntries(headers.entries()),
    method: "GET",
    redirect: "manual",
    signal: (options == null ? void 0 : options.signal) ? signal(options.signal) : null
  }).then(processDpopNonce);
}
function validateString(input) {
  return typeof input === "string" && input.length !== 0;
}
async function processDiscoveryResponse(expectedIssuerIdentifier, response) {
  if (!(expectedIssuerIdentifier instanceof URL)) {
    throw new TypeError('"expectedIssuer" must be an instance of URL');
  }
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    throw new OPE('"response" is not a conform Authorization Server Metadata response');
  }
  assertReadableResponse(response);
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OPE('failed to parse "response" body as JSON', { cause });
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!validateString(json.issuer)) {
    throw new OPE('"response" body "issuer" property must be a non-empty string');
  }
  if (new URL(json.issuer).href !== expectedIssuerIdentifier.href) {
    throw new OPE('"response" body "issuer" does not match "expectedIssuer"');
  }
  return json;
}
function randomBytes() {
  return b64u(crypto.getRandomValues(new Uint8Array(32)));
}
function generateRandomCodeVerifier() {
  return randomBytes();
}
function generateRandomState() {
  return randomBytes();
}
function generateRandomNonce() {
  return randomBytes();
}
async function calculatePKCECodeChallenge(codeVerifier) {
  if (!validateString(codeVerifier)) {
    throw new TypeError('"codeVerifier" must be a non-empty string');
  }
  return b64u(await crypto.subtle.digest("SHA-256", buf(codeVerifier)));
}
function getKeyAndKid(input) {
  if (input instanceof CryptoKey) {
    return { key: input };
  }
  if (!((input == null ? void 0 : input.key) instanceof CryptoKey)) {
    return {};
  }
  if (input.kid !== void 0 && !validateString(input.kid)) {
    throw new TypeError('"kid" must be a non-empty string');
  }
  return {
    key: input.key,
    kid: input.kid,
    modifyAssertion: input[modifyAssertion]
  };
}
function formUrlEncode(token) {
  return encodeURIComponent(token).replace(/%20/g, "+");
}
function clientSecretBasic(clientId, clientSecret) {
  const username = formUrlEncode(clientId);
  const password = formUrlEncode(clientSecret);
  const credentials = btoa(`${username}:${password}`);
  return `Basic ${credentials}`;
}
function psAlg(key) {
  switch (key.algorithm.hash.name) {
    case "SHA-256":
      return "PS256";
    case "SHA-384":
      return "PS384";
    case "SHA-512":
      return "PS512";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name");
  }
}
function rsAlg(key) {
  switch (key.algorithm.hash.name) {
    case "SHA-256":
      return "RS256";
    case "SHA-384":
      return "RS384";
    case "SHA-512":
      return "RS512";
    default:
      throw new UnsupportedOperationError("unsupported RsaHashedKeyAlgorithm hash name");
  }
}
function esAlg(key) {
  switch (key.algorithm.namedCurve) {
    case "P-256":
      return "ES256";
    case "P-384":
      return "ES384";
    case "P-521":
      return "ES512";
    default:
      throw new UnsupportedOperationError("unsupported EcKeyAlgorithm namedCurve");
  }
}
function keyToJws(key) {
  switch (key.algorithm.name) {
    case "RSA-PSS":
      return psAlg(key);
    case "RSASSA-PKCS1-v1_5":
      return rsAlg(key);
    case "ECDSA":
      return esAlg(key);
    case "Ed25519":
    case "Ed448":
      return "EdDSA";
    default:
      throw new UnsupportedOperationError("unsupported CryptoKey algorithm name");
  }
}
function getClockSkew(client) {
  const skew = client == null ? void 0 : client[clockSkew];
  return typeof skew === "number" && Number.isFinite(skew) ? skew : 0;
}
function getClockTolerance(client) {
  const tolerance = client == null ? void 0 : client[clockTolerance];
  return typeof tolerance === "number" && Number.isFinite(tolerance) && Math.sign(tolerance) !== -1 ? tolerance : 30;
}
function epochTime() {
  return Math.floor(Date.now() / 1e3);
}
function clientAssertion(as, client) {
  const now = epochTime() + getClockSkew(client);
  return {
    jti: randomBytes(),
    aud: [as.issuer, as.token_endpoint],
    exp: now + 60,
    iat: now,
    nbf: now,
    iss: client.client_id,
    sub: client.client_id
  };
}
async function privateKeyJwt(as, client, key, kid, modifyAssertion2) {
  const header = { alg: keyToJws(key), kid };
  const payload = clientAssertion(as, client);
  modifyAssertion2 == null ? void 0 : modifyAssertion2(header, payload);
  return jwt(header, payload, key);
}
function assertAs(as) {
  if (typeof as !== "object" || as === null) {
    throw new TypeError('"as" must be an object');
  }
  if (!validateString(as.issuer)) {
    throw new TypeError('"as.issuer" property must be a non-empty string');
  }
  return true;
}
function assertClient(client) {
  if (typeof client !== "object" || client === null) {
    throw new TypeError('"client" must be an object');
  }
  if (!validateString(client.client_id)) {
    throw new TypeError('"client.client_id" property must be a non-empty string');
  }
  return true;
}
function assertClientSecret(clientSecret) {
  if (!validateString(clientSecret)) {
    throw new TypeError('"client.client_secret" property must be a non-empty string');
  }
  return clientSecret;
}
function assertNoClientPrivateKey(clientAuthMethod, clientPrivateKey) {
  if (clientPrivateKey !== void 0) {
    throw new TypeError(`"options.clientPrivateKey" property must not be provided when ${clientAuthMethod} client authentication method is used.`);
  }
}
function assertNoClientSecret(clientAuthMethod, clientSecret) {
  if (clientSecret !== void 0) {
    throw new TypeError(`"client.client_secret" property must not be provided when ${clientAuthMethod} client authentication method is used.`);
  }
}
async function clientAuthentication(as, client, body, headers, clientPrivateKey) {
  body.delete("client_secret");
  body.delete("client_assertion_type");
  body.delete("client_assertion");
  switch (client.token_endpoint_auth_method) {
    case void 0:
    case "client_secret_basic": {
      assertNoClientPrivateKey("client_secret_basic", clientPrivateKey);
      headers.set("authorization", clientSecretBasic(client.client_id, assertClientSecret(client.client_secret)));
      break;
    }
    case "client_secret_post": {
      assertNoClientPrivateKey("client_secret_post", clientPrivateKey);
      body.set("client_id", client.client_id);
      body.set("client_secret", assertClientSecret(client.client_secret));
      break;
    }
    case "private_key_jwt": {
      assertNoClientSecret("private_key_jwt", client.client_secret);
      if (clientPrivateKey === void 0) {
        throw new TypeError('"options.clientPrivateKey" must be provided when "client.token_endpoint_auth_method" is "private_key_jwt"');
      }
      const { key, kid, modifyAssertion: modifyAssertion2 } = getKeyAndKid(clientPrivateKey);
      if (!isPrivateKey(key)) {
        throw new TypeError('"options.clientPrivateKey.key" must be a private CryptoKey');
      }
      body.set("client_id", client.client_id);
      body.set("client_assertion_type", "urn:ietf:params:oauth:client-assertion-type:jwt-bearer");
      body.set("client_assertion", await privateKeyJwt(as, client, key, kid, modifyAssertion2));
      break;
    }
    case "tls_client_auth":
    case "self_signed_tls_client_auth":
    case "none": {
      assertNoClientSecret(client.token_endpoint_auth_method, client.client_secret);
      assertNoClientPrivateKey(client.token_endpoint_auth_method, clientPrivateKey);
      body.set("client_id", client.client_id);
      break;
    }
    default:
      throw new UnsupportedOperationError("unsupported client token_endpoint_auth_method");
  }
}
async function jwt(header, payload, key) {
  if (!key.usages.includes("sign")) {
    throw new TypeError('CryptoKey instances used for signing assertions must include "sign" in their "usages"');
  }
  const input = `${b64u(buf(JSON.stringify(header)))}.${b64u(buf(JSON.stringify(payload)))}`;
  const signature = b64u(await crypto.subtle.sign(keyToSubtle(key), key, buf(input)));
  return `${input}.${signature}`;
}
async function issueRequestObject(as, client, parameters, privateKey) {
  assertAs(as);
  assertClient(client);
  parameters = new URLSearchParams(parameters);
  const { key, kid, modifyAssertion: modifyAssertion2 } = getKeyAndKid(privateKey);
  if (!isPrivateKey(key)) {
    throw new TypeError('"privateKey.key" must be a private CryptoKey');
  }
  parameters.set("client_id", client.client_id);
  const now = epochTime() + getClockSkew(client);
  const claims = {
    ...Object.fromEntries(parameters.entries()),
    jti: randomBytes(),
    aud: as.issuer,
    exp: now + 60,
    iat: now,
    nbf: now,
    iss: client.client_id
  };
  let resource;
  if (parameters.has("resource") && (resource = parameters.getAll("resource")) && resource.length > 1) {
    claims.resource = resource;
  }
  {
    let value = parameters.get("max_age");
    if (value !== null) {
      claims.max_age = parseInt(value, 10);
      if (!Number.isFinite(claims.max_age)) {
        throw new OPE('"max_age" parameter must be a number');
      }
    }
  }
  {
    let value = parameters.get("claims");
    if (value !== null) {
      try {
        claims.claims = JSON.parse(value);
      } catch (cause) {
        throw new OPE('failed to parse the "claims" parameter as JSON', { cause });
      }
      if (!isJsonObject(claims.claims)) {
        throw new OPE('"claims" parameter must be a JSON with a top level object');
      }
    }
  }
  {
    let value = parameters.get("authorization_details");
    if (value !== null) {
      try {
        claims.authorization_details = JSON.parse(value);
      } catch (cause) {
        throw new OPE('failed to parse the "authorization_details" parameter as JSON', { cause });
      }
      if (!Array.isArray(claims.authorization_details)) {
        throw new OPE('"authorization_details" parameter must be a JSON with a top level array');
      }
    }
  }
  const header = {
    alg: keyToJws(key),
    typ: "oauth-authz-req+jwt",
    kid
  };
  modifyAssertion2 == null ? void 0 : modifyAssertion2(header, claims);
  return jwt(header, claims, key);
}
async function dpopProofJwt(headers, options, url, htm, clockSkew2, accessToken) {
  var _a2;
  const { privateKey, publicKey, nonce = dpopNonces.get(url.origin) } = options;
  if (!isPrivateKey(privateKey)) {
    throw new TypeError('"DPoP.privateKey" must be a private CryptoKey');
  }
  if (!isPublicKey(publicKey)) {
    throw new TypeError('"DPoP.publicKey" must be a public CryptoKey');
  }
  if (nonce !== void 0 && !validateString(nonce)) {
    throw new TypeError('"DPoP.nonce" must be a non-empty string or undefined');
  }
  if (!publicKey.extractable) {
    throw new TypeError('"DPoP.publicKey.extractable" must be true');
  }
  const now = epochTime() + clockSkew2;
  const header = {
    alg: keyToJws(privateKey),
    typ: "dpop+jwt",
    jwk: await publicJwk(publicKey)
  };
  const payload = {
    iat: now,
    jti: randomBytes(),
    htm,
    nonce,
    htu: `${url.origin}${url.pathname}`,
    ath: accessToken ? b64u(await crypto.subtle.digest("SHA-256", buf(accessToken))) : void 0
  };
  (_a2 = options[modifyAssertion]) == null ? void 0 : _a2.call(options, header, payload);
  headers.set("dpop", await jwt(header, payload, privateKey));
}
let jwkCache;
async function getSetPublicJwkCache(key) {
  const { kty, e: e2, n, x, y, crv } = await crypto.subtle.exportKey("jwk", key);
  const jwk = { kty, e: e2, n, x, y, crv };
  jwkCache.set(key, jwk);
  return jwk;
}
async function publicJwk(key) {
  jwkCache || (jwkCache = /* @__PURE__ */ new WeakMap());
  return jwkCache.get(key) || getSetPublicJwkCache(key);
}
function validateEndpoint(value, endpoint, useMtlsAlias2) {
  if (typeof value !== "string") {
    if (useMtlsAlias2) {
      throw new TypeError(`"as.mtls_endpoint_aliases.${endpoint}" must be a string`);
    }
    throw new TypeError(`"as.${endpoint}" must be a string`);
  }
  return new URL(value);
}
function resolveEndpoint(as, endpoint, useMtlsAlias2 = false) {
  if (useMtlsAlias2 && as.mtls_endpoint_aliases && endpoint in as.mtls_endpoint_aliases) {
    return validateEndpoint(as.mtls_endpoint_aliases[endpoint], endpoint, useMtlsAlias2);
  }
  return validateEndpoint(as[endpoint], endpoint, useMtlsAlias2);
}
function alias(client, options) {
  if (client.use_mtls_endpoint_aliases || (options == null ? void 0 : options[useMtlsAlias])) {
    return true;
  }
  return false;
}
async function pushedAuthorizationRequest(as, client, parameters, options) {
  assertAs(as);
  assertClient(client);
  const url = resolveEndpoint(as, "pushed_authorization_request_endpoint", alias(client, options));
  const body = new URLSearchParams(parameters);
  body.set("client_id", client.client_id);
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.set("accept", "application/json");
  if ((options == null ? void 0 : options.DPoP) !== void 0) {
    await dpopProofJwt(headers, options.DPoP, url, "POST", getClockSkew(client));
  }
  return authenticatedRequest(as, client, "POST", url, body, headers, options);
}
function isOAuth2Error(input) {
  const value = input;
  if (typeof value !== "object" || Array.isArray(value) || value === null) {
    return false;
  }
  return value.error !== void 0;
}
function unquote(value) {
  if (value.length >= 2 && value[0] === '"' && value[value.length - 1] === '"') {
    return value.slice(1, -1);
  }
  return value;
}
const SPLIT_REGEXP = /((?:,|, )?[0-9a-zA-Z!#$%&'*+-.^_`|~]+=)/;
const SCHEMES_REGEXP = /(?:^|, ?)([0-9a-zA-Z!#$%&'*+\-.^_`|~]+)(?=$|[ ,])/g;
function wwwAuth(scheme, params) {
  const arr = params.split(SPLIT_REGEXP).slice(1);
  if (!arr.length) {
    return { scheme: scheme.toLowerCase(), parameters: {} };
  }
  arr[arr.length - 1] = arr[arr.length - 1].replace(/,$/, "");
  const parameters = {};
  for (let i = 1; i < arr.length; i += 2) {
    const idx = i;
    if (arr[idx][0] === '"') {
      while (arr[idx].slice(-1) !== '"' && ++i < arr.length) {
        arr[idx] += arr[i];
      }
    }
    const key = arr[idx - 1].replace(/^(?:, ?)|=$/g, "").toLowerCase();
    parameters[key] = unquote(arr[idx]);
  }
  return {
    scheme: scheme.toLowerCase(),
    parameters
  };
}
function parseWwwAuthenticateChallenges(response) {
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  const header = response.headers.get("www-authenticate");
  if (header === null) {
    return void 0;
  }
  const result = [];
  for (const { 1: scheme, index: index2 } of header.matchAll(SCHEMES_REGEXP)) {
    result.push([scheme, index2]);
  }
  if (!result.length) {
    return void 0;
  }
  const challenges = result.map(([scheme, indexOf], i, others) => {
    const next = others[i + 1];
    let parameters;
    if (next) {
      parameters = header.slice(indexOf, next[1]);
    } else {
      parameters = header.slice(indexOf);
    }
    return wwwAuth(scheme, parameters);
  });
  return challenges;
}
async function processPushedAuthorizationResponse(as, client, response) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 201) {
    let err;
    if (err = await handleOAuthBodyError(response)) {
      return err;
    }
    throw new OPE('"response" is not a conform Pushed Authorization Request Endpoint response');
  }
  assertReadableResponse(response);
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OPE('failed to parse "response" body as JSON', { cause });
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!validateString(json.request_uri)) {
    throw new OPE('"response" body "request_uri" property must be a non-empty string');
  }
  if (typeof json.expires_in !== "number" || json.expires_in <= 0) {
    throw new OPE('"response" body "expires_in" property must be a positive number');
  }
  return json;
}
async function protectedResourceRequest(accessToken, method, url, headers, body, options) {
  if (!validateString(accessToken)) {
    throw new TypeError('"accessToken" must be a non-empty string');
  }
  if (!(url instanceof URL)) {
    throw new TypeError('"url" must be an instance of URL');
  }
  headers = prepareHeaders(headers);
  if ((options == null ? void 0 : options.DPoP) === void 0) {
    headers.set("authorization", `Bearer ${accessToken}`);
  } else {
    await dpopProofJwt(headers, options.DPoP, url, method.toUpperCase(), getClockSkew({ [clockSkew]: options == null ? void 0 : options[clockSkew] }), accessToken);
    headers.set("authorization", `DPoP ${accessToken}`);
  }
  return ((options == null ? void 0 : options[customFetch]) || fetch)(url.href, {
    body,
    headers: Object.fromEntries(headers.entries()),
    method,
    redirect: "manual",
    signal: (options == null ? void 0 : options.signal) ? signal(options.signal) : null
  }).then(processDpopNonce);
}
async function userInfoRequest(as, client, accessToken, options) {
  assertAs(as);
  assertClient(client);
  const url = resolveEndpoint(as, "userinfo_endpoint", alias(client, options));
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  if (client.userinfo_signed_response_alg) {
    headers.set("accept", "application/jwt");
  } else {
    headers.set("accept", "application/json");
    headers.append("accept", "application/jwt");
  }
  return protectedResourceRequest(accessToken, "GET", url, headers, null, {
    ...options,
    [clockSkew]: getClockSkew(client)
  });
}
let jwksMap;
function setJwksCache(as, jwks, uat, cache) {
  jwksMap || (jwksMap = /* @__PURE__ */ new WeakMap());
  jwksMap.set(as, {
    jwks,
    uat,
    get age() {
      return epochTime() - this.uat;
    }
  });
  if (cache) {
    Object.assign(cache, { jwks: structuredClone(jwks), uat });
  }
}
function isFreshJwksCache(input) {
  if (typeof input !== "object" || input === null) {
    return false;
  }
  if (!("uat" in input) || typeof input.uat !== "number" || epochTime() - input.uat >= 300) {
    return false;
  }
  if (!("jwks" in input) || !isJsonObject(input.jwks) || !Array.isArray(input.jwks.keys) || !Array.prototype.every.call(input.jwks.keys, isJsonObject)) {
    return false;
  }
  return true;
}
function clearJwksCache(as, cache) {
  jwksMap == null ? void 0 : jwksMap.delete(as);
  cache == null ? true : delete cache.jwks;
  cache == null ? true : delete cache.uat;
}
async function getPublicSigKeyFromIssuerJwksUri(as, options, header) {
  const { alg, kid } = header;
  checkSupportedJwsAlg(alg);
  if (!(jwksMap == null ? void 0 : jwksMap.has(as)) && isFreshJwksCache(options == null ? void 0 : options[jwksCache])) {
    setJwksCache(as, options == null ? void 0 : options[jwksCache].jwks, options == null ? void 0 : options[jwksCache].uat);
  }
  let jwks;
  let age;
  if (jwksMap == null ? void 0 : jwksMap.has(as)) {
    ;
    ({ jwks, age } = jwksMap.get(as));
    if (age >= 300) {
      clearJwksCache(as, options == null ? void 0 : options[jwksCache]);
      return getPublicSigKeyFromIssuerJwksUri(as, options, header);
    }
  } else {
    jwks = await jwksRequest(as, options).then(processJwksResponse);
    age = 0;
    setJwksCache(as, jwks, epochTime(), options == null ? void 0 : options[jwksCache]);
  }
  let kty;
  switch (alg.slice(0, 2)) {
    case "RS":
    case "PS":
      kty = "RSA";
      break;
    case "ES":
      kty = "EC";
      break;
    case "Ed":
      kty = "OKP";
      break;
    default:
      throw new UnsupportedOperationError();
  }
  const candidates = jwks.keys.filter((jwk2) => {
    var _a2;
    if (jwk2.kty !== kty) {
      return false;
    }
    if (kid !== void 0 && kid !== jwk2.kid) {
      return false;
    }
    if (jwk2.alg !== void 0 && alg !== jwk2.alg) {
      return false;
    }
    if (jwk2.use !== void 0 && jwk2.use !== "sig") {
      return false;
    }
    if (((_a2 = jwk2.key_ops) == null ? void 0 : _a2.includes("verify")) === false) {
      return false;
    }
    switch (true) {
      case (alg === "ES256" && jwk2.crv !== "P-256"):
      case (alg === "ES384" && jwk2.crv !== "P-384"):
      case (alg === "ES512" && jwk2.crv !== "P-521"):
      case (alg === "EdDSA" && !(jwk2.crv === "Ed25519" || jwk2.crv === "Ed448")):
        return false;
    }
    return true;
  });
  const { 0: jwk, length } = candidates;
  if (!length) {
    if (age >= 60) {
      clearJwksCache(as, options == null ? void 0 : options[jwksCache]);
      return getPublicSigKeyFromIssuerJwksUri(as, options, header);
    }
    throw new OPE("error when selecting a JWT verification key, no applicable keys found");
  }
  if (length !== 1) {
    throw new OPE('error when selecting a JWT verification key, multiple applicable keys found, a "kid" JWT Header Parameter is required');
  }
  const key = await importJwk(alg, jwk);
  if (key.type !== "public") {
    throw new OPE("jwks_uri must only contain public keys");
  }
  return key;
}
const skipSubjectCheck = Symbol();
function getContentType(response) {
  var _a2;
  return (_a2 = response.headers.get("content-type")) == null ? void 0 : _a2.split(";")[0];
}
async function processUserInfoResponse(as, client, expectedSubject, response) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    throw new OPE('"response" is not a conform UserInfo Endpoint response');
  }
  let json;
  if (getContentType(response) === "application/jwt") {
    assertReadableResponse(response);
    const { claims, jwt: jwt2 } = await validateJwt(await response.text(), checkSigningAlgorithm.bind(void 0, client.userinfo_signed_response_alg, as.userinfo_signing_alg_values_supported), noSignatureCheck, getClockSkew(client), getClockTolerance(client), client[jweDecrypt]).then(validateOptionalAudience.bind(void 0, client.client_id)).then(validateOptionalIssuer.bind(void 0, as.issuer));
    jwtResponseBodies.set(response, jwt2);
    json = claims;
  } else {
    if (client.userinfo_signed_response_alg) {
      throw new OPE("JWT UserInfo Response expected");
    }
    assertReadableResponse(response);
    try {
      json = await response.json();
    } catch (cause) {
      throw new OPE('failed to parse "response" body as JSON', { cause });
    }
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!validateString(json.sub)) {
    throw new OPE('"response" body "sub" property must be a non-empty string');
  }
  switch (expectedSubject) {
    case skipSubjectCheck:
      break;
    default:
      if (!validateString(expectedSubject)) {
        throw new OPE('"expectedSubject" must be a non-empty string');
      }
      if (json.sub !== expectedSubject) {
        throw new OPE('unexpected "response" body "sub" value');
      }
  }
  return json;
}
async function authenticatedRequest(as, client, method, url, body, headers, options) {
  await clientAuthentication(as, client, body, headers, options == null ? void 0 : options.clientPrivateKey);
  headers.set("content-type", "application/x-www-form-urlencoded;charset=UTF-8");
  return ((options == null ? void 0 : options[customFetch]) || fetch)(url.href, {
    body,
    headers: Object.fromEntries(headers.entries()),
    method,
    redirect: "manual",
    signal: (options == null ? void 0 : options.signal) ? signal(options.signal) : null
  }).then(processDpopNonce);
}
async function tokenEndpointRequest(as, client, grantType, parameters, options) {
  const url = resolveEndpoint(as, "token_endpoint", alias(client, options));
  parameters.set("grant_type", grantType);
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.set("accept", "application/json");
  if ((options == null ? void 0 : options.DPoP) !== void 0) {
    await dpopProofJwt(headers, options.DPoP, url, "POST", getClockSkew(client));
  }
  return authenticatedRequest(as, client, "POST", url, parameters, headers, options);
}
async function refreshTokenGrantRequest(as, client, refreshToken, options) {
  assertAs(as);
  assertClient(client);
  if (!validateString(refreshToken)) {
    throw new TypeError('"refreshToken" must be a non-empty string');
  }
  const parameters = new URLSearchParams(options == null ? void 0 : options.additionalParameters);
  parameters.set("refresh_token", refreshToken);
  return tokenEndpointRequest(as, client, "refresh_token", parameters, options);
}
const idTokenClaims = /* @__PURE__ */ new WeakMap();
const jwtResponseBodies = /* @__PURE__ */ new WeakMap();
function getValidatedIdTokenClaims(ref) {
  if (!ref.id_token) {
    return void 0;
  }
  const claims = idTokenClaims.get(ref);
  if (!claims) {
    throw new TypeError('"ref" was already garbage collected or did not resolve from the proper sources');
  }
  return claims[0];
}
async function validateIdTokenSignature(as, ref, options) {
  assertAs(as);
  if (!idTokenClaims.has(ref)) {
    throw new OPE('"ref" does not contain an ID Token to verify the signature of');
  }
  const { 0: protectedHeader, 1: payload, 2: encodedSignature } = idTokenClaims.get(ref)[1].split(".");
  const header = JSON.parse(buf(b64u(protectedHeader)));
  if (header.alg.startsWith("HS")) {
    throw new UnsupportedOperationError();
  }
  let key;
  key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
  await validateJwsSignature(protectedHeader, payload, key, b64u(encodedSignature));
}
async function validateJwtResponseSignature(as, ref, options) {
  assertAs(as);
  if (!jwtResponseBodies.has(ref)) {
    throw new OPE('"ref" does not contain a processed JWT Response to verify the signature of');
  }
  const { 0: protectedHeader, 1: payload, 2: encodedSignature } = jwtResponseBodies.get(ref).split(".");
  const header = JSON.parse(buf(b64u(protectedHeader)));
  if (header.alg.startsWith("HS")) {
    throw new UnsupportedOperationError();
  }
  let key;
  key = await getPublicSigKeyFromIssuerJwksUri(as, options, header);
  await validateJwsSignature(protectedHeader, payload, key, b64u(encodedSignature));
}
function validateJwtUserInfoSignature(as, ref, options) {
  return validateJwtResponseSignature(as, ref, options);
}
function validateJwtIntrospectionSignature(as, ref, options) {
  return validateJwtResponseSignature(as, ref, options);
}
async function processGenericAccessTokenResponse(as, client, response, ignoreIdToken = false, ignoreRefreshToken = false) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    let err;
    if (err = await handleOAuthBodyError(response)) {
      return err;
    }
    throw new OPE('"response" is not a conform Token Endpoint response');
  }
  assertReadableResponse(response);
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OPE('failed to parse "response" body as JSON', { cause });
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!validateString(json.access_token)) {
    throw new OPE('"response" body "access_token" property must be a non-empty string');
  }
  if (!validateString(json.token_type)) {
    throw new OPE('"response" body "token_type" property must be a non-empty string');
  }
  json.token_type = json.token_type.toLowerCase();
  if (json.token_type !== "dpop" && json.token_type !== "bearer") {
    throw new UnsupportedOperationError("unsupported `token_type` value");
  }
  if (json.expires_in !== void 0 && (typeof json.expires_in !== "number" || json.expires_in <= 0)) {
    throw new OPE('"response" body "expires_in" property must be a positive number');
  }
  if (!ignoreRefreshToken && json.refresh_token !== void 0 && !validateString(json.refresh_token)) {
    throw new OPE('"response" body "refresh_token" property must be a non-empty string');
  }
  if (json.scope !== void 0 && typeof json.scope !== "string") {
    throw new OPE('"response" body "scope" property must be a string');
  }
  if (!ignoreIdToken) {
    if (json.id_token !== void 0 && !validateString(json.id_token)) {
      throw new OPE('"response" body "id_token" property must be a non-empty string');
    }
    if (json.id_token) {
      const { claims, jwt: jwt2 } = await validateJwt(json.id_token, checkSigningAlgorithm.bind(void 0, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported), noSignatureCheck, getClockSkew(client), getClockTolerance(client), client[jweDecrypt]).then(validatePresence.bind(void 0, ["aud", "exp", "iat", "iss", "sub"])).then(validateIssuer.bind(void 0, as.issuer)).then(validateAudience.bind(void 0, client.client_id));
      if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
        if (claims.azp === void 0) {
          throw new OPE('ID Token "aud" (audience) claim includes additional untrusted audiences');
        }
        if (claims.azp !== client.client_id) {
          throw new OPE('unexpected ID Token "azp" (authorized party) claim value');
        }
      }
      if (claims.auth_time !== void 0 && (!Number.isFinite(claims.auth_time) || Math.sign(claims.auth_time) !== 1)) {
        throw new OPE('ID Token "auth_time" (authentication time) must be a positive number');
      }
      idTokenClaims.set(json, [claims, jwt2]);
    }
  }
  return json;
}
async function processRefreshTokenResponse(as, client, response) {
  return processGenericAccessTokenResponse(as, client, response);
}
function validateOptionalAudience(expected, result) {
  if (result.claims.aud !== void 0) {
    return validateAudience(expected, result);
  }
  return result;
}
function validateAudience(expected, result) {
  if (Array.isArray(result.claims.aud)) {
    if (!result.claims.aud.includes(expected)) {
      throw new OPE('unexpected JWT "aud" (audience) claim value');
    }
  } else if (result.claims.aud !== expected) {
    throw new OPE('unexpected JWT "aud" (audience) claim value');
  }
  return result;
}
function validateOptionalIssuer(expected, result) {
  if (result.claims.iss !== void 0) {
    return validateIssuer(expected, result);
  }
  return result;
}
function validateIssuer(expected, result) {
  if (result.claims.iss !== expected) {
    throw new OPE('unexpected JWT "iss" (issuer) claim value');
  }
  return result;
}
const branded = /* @__PURE__ */ new WeakSet();
function brand(searchParams) {
  branded.add(searchParams);
  return searchParams;
}
async function authorizationCodeGrantRequest(as, client, callbackParameters, redirectUri, codeVerifier, options) {
  assertAs(as);
  assertClient(client);
  if (!branded.has(callbackParameters)) {
    throw new TypeError('"callbackParameters" must be an instance of URLSearchParams obtained from "validateAuthResponse()", or "validateJwtAuthResponse()');
  }
  if (!validateString(redirectUri)) {
    throw new TypeError('"redirectUri" must be a non-empty string');
  }
  if (!validateString(codeVerifier)) {
    throw new TypeError('"codeVerifier" must be a non-empty string');
  }
  const code = getURLSearchParameter(callbackParameters, "code");
  if (!code) {
    throw new OPE('no authorization code in "callbackParameters"');
  }
  const parameters = new URLSearchParams(options == null ? void 0 : options.additionalParameters);
  parameters.set("redirect_uri", redirectUri);
  parameters.set("code_verifier", codeVerifier);
  parameters.set("code", code);
  return tokenEndpointRequest(as, client, "authorization_code", parameters, options);
}
const jwtClaimNames = {
  aud: "audience",
  c_hash: "code hash",
  client_id: "client id",
  exp: "expiration time",
  iat: "issued at",
  iss: "issuer",
  jti: "jwt id",
  nonce: "nonce",
  s_hash: "state hash",
  sub: "subject",
  ath: "access token hash",
  htm: "http method",
  htu: "http uri",
  cnf: "confirmation"
};
function validatePresence(required, result) {
  for (const claim of required) {
    if (result.claims[claim] === void 0) {
      throw new OPE(`JWT "${claim}" (${jwtClaimNames[claim]}) claim missing`);
    }
  }
  return result;
}
const expectNoNonce = Symbol();
const skipAuthTimeCheck = Symbol();
async function processAuthorizationCodeOpenIDResponse(as, client, response, expectedNonce, maxAge) {
  const result = await processGenericAccessTokenResponse(as, client, response);
  if (isOAuth2Error(result)) {
    return result;
  }
  if (!validateString(result.id_token)) {
    throw new OPE('"response" body "id_token" property must be a non-empty string');
  }
  maxAge ?? (maxAge = client.default_max_age ?? skipAuthTimeCheck);
  const claims = getValidatedIdTokenClaims(result);
  if ((client.require_auth_time || maxAge !== skipAuthTimeCheck) && claims.auth_time === void 0) {
    throw new OPE('ID Token "auth_time" (authentication time) claim missing');
  }
  if (maxAge !== skipAuthTimeCheck) {
    if (typeof maxAge !== "number" || maxAge < 0) {
      throw new TypeError('"maxAge" must be a non-negative number');
    }
    const now = epochTime() + getClockSkew(client);
    const tolerance = getClockTolerance(client);
    if (claims.auth_time + maxAge < now - tolerance) {
      throw new OPE("too much time has elapsed since the last End-User authentication");
    }
  }
  switch (expectedNonce) {
    case void 0:
    case expectNoNonce:
      if (claims.nonce !== void 0) {
        throw new OPE('unexpected ID Token "nonce" claim value');
      }
      break;
    default:
      if (!validateString(expectedNonce)) {
        throw new TypeError('"expectedNonce" must be a non-empty string');
      }
      if (claims.nonce === void 0) {
        throw new OPE('ID Token "nonce" claim missing');
      }
      if (claims.nonce !== expectedNonce) {
        throw new OPE('unexpected ID Token "nonce" claim value');
      }
  }
  return result;
}
async function processAuthorizationCodeOAuth2Response(as, client, response) {
  const result = await processGenericAccessTokenResponse(as, client, response, true);
  if (isOAuth2Error(result)) {
    return result;
  }
  if (result.id_token !== void 0) {
    if (typeof result.id_token === "string" && result.id_token.length) {
      throw new OPE("Unexpected ID Token returned, use processAuthorizationCodeOpenIDResponse() for OpenID Connect callback processing");
    }
    delete result.id_token;
  }
  return result;
}
function checkJwtType(expected, result) {
  if (typeof result.header.typ !== "string" || normalizeTyp(result.header.typ) !== expected) {
    throw new OPE('unexpected JWT "typ" header parameter value');
  }
  return result;
}
async function clientCredentialsGrantRequest(as, client, parameters, options) {
  assertAs(as);
  assertClient(client);
  return tokenEndpointRequest(as, client, "client_credentials", new URLSearchParams(parameters), options);
}
async function genericTokenEndpointRequest(as, client, grantType, parameters, options) {
  assertAs(as);
  assertClient(client);
  if (!validateString(grantType)) {
    throw new TypeError('"grantType" must be a non-empty string');
  }
  return tokenEndpointRequest(as, client, grantType, new URLSearchParams(parameters), options);
}
async function processClientCredentialsResponse(as, client, response) {
  const result = await processGenericAccessTokenResponse(as, client, response, true, true);
  if (isOAuth2Error(result)) {
    return result;
  }
  return result;
}
async function revocationRequest(as, client, token, options) {
  assertAs(as);
  assertClient(client);
  if (!validateString(token)) {
    throw new TypeError('"token" must be a non-empty string');
  }
  const url = resolveEndpoint(as, "revocation_endpoint", alias(client, options));
  const body = new URLSearchParams(options == null ? void 0 : options.additionalParameters);
  body.set("token", token);
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.delete("accept");
  return authenticatedRequest(as, client, "POST", url, body, headers, options);
}
async function processRevocationResponse(response) {
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    let err;
    if (err = await handleOAuthBodyError(response)) {
      return err;
    }
    throw new OPE('"response" is not a conform Revocation Endpoint response');
  }
  return void 0;
}
function assertReadableResponse(response) {
  if (response.bodyUsed) {
    throw new TypeError('"response" body has been used already');
  }
}
async function introspectionRequest(as, client, token, options) {
  assertAs(as);
  assertClient(client);
  if (!validateString(token)) {
    throw new TypeError('"token" must be a non-empty string');
  }
  const url = resolveEndpoint(as, "introspection_endpoint", alias(client, options));
  const body = new URLSearchParams(options == null ? void 0 : options.additionalParameters);
  body.set("token", token);
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  if ((options == null ? void 0 : options.requestJwtResponse) ?? client.introspection_signed_response_alg) {
    headers.set("accept", "application/token-introspection+jwt");
  } else {
    headers.set("accept", "application/json");
  }
  return authenticatedRequest(as, client, "POST", url, body, headers, options);
}
async function processIntrospectionResponse(as, client, response) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    let err;
    if (err = await handleOAuthBodyError(response)) {
      return err;
    }
    throw new OPE('"response" is not a conform Introspection Endpoint response');
  }
  let json;
  if (getContentType(response) === "application/token-introspection+jwt") {
    assertReadableResponse(response);
    const { claims, jwt: jwt2 } = await validateJwt(await response.text(), checkSigningAlgorithm.bind(void 0, client.introspection_signed_response_alg, as.introspection_signing_alg_values_supported), noSignatureCheck, getClockSkew(client), getClockTolerance(client), client[jweDecrypt]).then(checkJwtType.bind(void 0, "token-introspection+jwt")).then(validatePresence.bind(void 0, ["aud", "iat", "iss"])).then(validateIssuer.bind(void 0, as.issuer)).then(validateAudience.bind(void 0, client.client_id));
    jwtResponseBodies.set(response, jwt2);
    json = claims.token_introspection;
    if (!isJsonObject(json)) {
      throw new OPE('JWT "token_introspection" claim must be a JSON object');
    }
  } else {
    assertReadableResponse(response);
    try {
      json = await response.json();
    } catch (cause) {
      throw new OPE('failed to parse "response" body as JSON', { cause });
    }
    if (!isJsonObject(json)) {
      throw new OPE('"response" body must be a top level object');
    }
  }
  if (typeof json.active !== "boolean") {
    throw new OPE('"response" body "active" property must be a boolean');
  }
  return json;
}
async function jwksRequest(as, options) {
  assertAs(as);
  const url = resolveEndpoint(as, "jwks_uri");
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.set("accept", "application/json");
  headers.append("accept", "application/jwk-set+json");
  return ((options == null ? void 0 : options[customFetch]) || fetch)(url.href, {
    headers: Object.fromEntries(headers.entries()),
    method: "GET",
    redirect: "manual",
    signal: (options == null ? void 0 : options.signal) ? signal(options.signal) : null
  }).then(processDpopNonce);
}
async function processJwksResponse(response) {
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    throw new OPE('"response" is not a conform JSON Web Key Set response');
  }
  assertReadableResponse(response);
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OPE('failed to parse "response" body as JSON', { cause });
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!Array.isArray(json.keys)) {
    throw new OPE('"response" body "keys" property must be an array');
  }
  if (!Array.prototype.every.call(json.keys, isJsonObject)) {
    throw new OPE('"response" body "keys" property members must be JWK formatted objects');
  }
  return json;
}
async function handleOAuthBodyError(response) {
  if (response.status > 399 && response.status < 500) {
    assertReadableResponse(response);
    try {
      const json = await response.json();
      if (isJsonObject(json) && typeof json.error === "string" && json.error.length) {
        if (json.error_description !== void 0 && typeof json.error_description !== "string") {
          delete json.error_description;
        }
        if (json.error_uri !== void 0 && typeof json.error_uri !== "string") {
          delete json.error_uri;
        }
        if (json.algs !== void 0 && typeof json.algs !== "string") {
          delete json.algs;
        }
        if (json.scope !== void 0 && typeof json.scope !== "string") {
          delete json.scope;
        }
        return json;
      }
    } catch {
    }
  }
  return void 0;
}
function checkSupportedJwsAlg(alg) {
  if (!SUPPORTED_JWS_ALGS.includes(alg)) {
    throw new UnsupportedOperationError('unsupported JWS "alg" identifier');
  }
  return alg;
}
function checkRsaKeyAlgorithm(algorithm) {
  if (typeof algorithm.modulusLength !== "number" || algorithm.modulusLength < 2048) {
    throw new OPE(`${algorithm.name} modulusLength must be at least 2048 bits`);
  }
}
function ecdsaHashName(namedCurve) {
  switch (namedCurve) {
    case "P-256":
      return "SHA-256";
    case "P-384":
      return "SHA-384";
    case "P-521":
      return "SHA-512";
    default:
      throw new UnsupportedOperationError();
  }
}
function keyToSubtle(key) {
  switch (key.algorithm.name) {
    case "ECDSA":
      return {
        name: key.algorithm.name,
        hash: ecdsaHashName(key.algorithm.namedCurve)
      };
    case "RSA-PSS": {
      checkRsaKeyAlgorithm(key.algorithm);
      switch (key.algorithm.hash.name) {
        case "SHA-256":
        case "SHA-384":
        case "SHA-512":
          return {
            name: key.algorithm.name,
            saltLength: parseInt(key.algorithm.hash.name.slice(-3), 10) >> 3
          };
        default:
          throw new UnsupportedOperationError();
      }
    }
    case "RSASSA-PKCS1-v1_5":
      checkRsaKeyAlgorithm(key.algorithm);
      return key.algorithm.name;
    case "Ed448":
    case "Ed25519":
      return key.algorithm.name;
  }
  throw new UnsupportedOperationError();
}
const noSignatureCheck = Symbol();
async function validateJwsSignature(protectedHeader, payload, key, signature) {
  const input = `${protectedHeader}.${payload}`;
  const verified = await crypto.subtle.verify(keyToSubtle(key), key, signature, buf(input));
  if (!verified) {
    throw new OPE("JWT signature verification failed");
  }
}
async function validateJwt(jws, checkAlg, getKey, clockSkew2, clockTolerance2, decryptJwt) {
  let { 0: protectedHeader, 1: payload, 2: encodedSignature, length } = jws.split(".");
  if (length === 5) {
    if (decryptJwt !== void 0) {
      jws = await decryptJwt(jws);
      ({ 0: protectedHeader, 1: payload, 2: encodedSignature, length } = jws.split("."));
    } else {
      throw new UnsupportedOperationError("JWE structure JWTs are not supported");
    }
  }
  if (length !== 3) {
    throw new OPE("Invalid JWT");
  }
  let header;
  try {
    header = JSON.parse(buf(b64u(protectedHeader)));
  } catch (cause) {
    throw new OPE("failed to parse JWT Header body as base64url encoded JSON", { cause });
  }
  if (!isJsonObject(header)) {
    throw new OPE("JWT Header must be a top level object");
  }
  checkAlg(header);
  if (header.crit !== void 0) {
    throw new OPE('unexpected JWT "crit" header parameter');
  }
  const signature = b64u(encodedSignature);
  let key;
  if (getKey !== noSignatureCheck) {
    key = await getKey(header);
    await validateJwsSignature(protectedHeader, payload, key, signature);
  }
  let claims;
  try {
    claims = JSON.parse(buf(b64u(payload)));
  } catch (cause) {
    throw new OPE("failed to parse JWT Payload body as base64url encoded JSON", { cause });
  }
  if (!isJsonObject(claims)) {
    throw new OPE("JWT Payload must be a top level object");
  }
  const now = epochTime() + clockSkew2;
  if (claims.exp !== void 0) {
    if (typeof claims.exp !== "number") {
      throw new OPE('unexpected JWT "exp" (expiration time) claim type');
    }
    if (claims.exp <= now - clockTolerance2) {
      throw new OPE('unexpected JWT "exp" (expiration time) claim value, timestamp is <= now()');
    }
  }
  if (claims.iat !== void 0) {
    if (typeof claims.iat !== "number") {
      throw new OPE('unexpected JWT "iat" (issued at) claim type');
    }
  }
  if (claims.iss !== void 0) {
    if (typeof claims.iss !== "string") {
      throw new OPE('unexpected JWT "iss" (issuer) claim type');
    }
  }
  if (claims.nbf !== void 0) {
    if (typeof claims.nbf !== "number") {
      throw new OPE('unexpected JWT "nbf" (not before) claim type');
    }
    if (claims.nbf > now + clockTolerance2) {
      throw new OPE('unexpected JWT "nbf" (not before) claim value, timestamp is > now()');
    }
  }
  if (claims.aud !== void 0) {
    if (typeof claims.aud !== "string" && !Array.isArray(claims.aud)) {
      throw new OPE('unexpected JWT "aud" (audience) claim type');
    }
  }
  return { header, claims, signature, key, jwt: jws };
}
async function validateJwtAuthResponse(as, client, parameters, expectedState, options) {
  assertAs(as);
  assertClient(client);
  if (parameters instanceof URL) {
    parameters = parameters.searchParams;
  }
  if (!(parameters instanceof URLSearchParams)) {
    throw new TypeError('"parameters" must be an instance of URLSearchParams, or URL');
  }
  const response = getURLSearchParameter(parameters, "response");
  if (!response) {
    throw new OPE('"parameters" does not contain a JARM response');
  }
  const { claims } = await validateJwt(response, checkSigningAlgorithm.bind(void 0, client.authorization_signed_response_alg, as.authorization_signing_alg_values_supported), getPublicSigKeyFromIssuerJwksUri.bind(void 0, as, options), getClockSkew(client), getClockTolerance(client), client[jweDecrypt]).then(validatePresence.bind(void 0, ["aud", "exp", "iss"])).then(validateIssuer.bind(void 0, as.issuer)).then(validateAudience.bind(void 0, client.client_id));
  const result = new URLSearchParams();
  for (const [key, value] of Object.entries(claims)) {
    if (typeof value === "string" && key !== "aud") {
      result.set(key, value);
    }
  }
  return validateAuthResponse(as, client, result, expectedState);
}
async function idTokenHash(alg, data, key) {
  let algorithm;
  switch (alg) {
    case "RS256":
    case "PS256":
    case "ES256":
      algorithm = "SHA-256";
      break;
    case "RS384":
    case "PS384":
    case "ES384":
      algorithm = "SHA-384";
      break;
    case "RS512":
    case "PS512":
    case "ES512":
      algorithm = "SHA-512";
      break;
    case "EdDSA":
      if (key.algorithm.name === "Ed25519") {
        algorithm = "SHA-512";
        break;
      }
      throw new UnsupportedOperationError();
    default:
      throw new UnsupportedOperationError();
  }
  const digest = await crypto.subtle.digest(algorithm, buf(data));
  return b64u(digest.slice(0, digest.byteLength / 2));
}
async function idTokenHashMatches(data, actual, alg, key) {
  const expected = await idTokenHash(alg, data, key);
  return actual === expected;
}
async function validateDetachedSignatureResponse(as, client, parameters, expectedNonce, expectedState, maxAge, options) {
  assertAs(as);
  assertClient(client);
  if (parameters instanceof URL) {
    if (!parameters.hash.length) {
      throw new TypeError('"parameters" as an instance of URL must contain a hash (fragment) with the Authorization Response parameters');
    }
    parameters = new URLSearchParams(parameters.hash.slice(1));
  }
  if (!(parameters instanceof URLSearchParams)) {
    throw new TypeError('"parameters" must be an instance of URLSearchParams');
  }
  parameters = new URLSearchParams(parameters);
  const id_token = getURLSearchParameter(parameters, "id_token");
  parameters.delete("id_token");
  switch (expectedState) {
    case void 0:
    case expectNoState:
      break;
    default:
      if (!validateString(expectedState)) {
        throw new TypeError('"expectedState" must be a non-empty string');
      }
  }
  const result = validateAuthResponse({
    ...as,
    authorization_response_iss_parameter_supported: false
  }, client, parameters, expectedState);
  if (isOAuth2Error(result)) {
    return result;
  }
  if (!id_token) {
    throw new OPE('"parameters" does not contain an ID Token');
  }
  const code = getURLSearchParameter(parameters, "code");
  if (!code) {
    throw new OPE('"parameters" does not contain an Authorization Code');
  }
  const requiredClaims = [
    "aud",
    "exp",
    "iat",
    "iss",
    "sub",
    "nonce",
    "c_hash"
  ];
  if (typeof expectedState === "string") {
    requiredClaims.push("s_hash");
  }
  const { claims, header, key } = await validateJwt(id_token, checkSigningAlgorithm.bind(void 0, client.id_token_signed_response_alg, as.id_token_signing_alg_values_supported), getPublicSigKeyFromIssuerJwksUri.bind(void 0, as, options), getClockSkew(client), getClockTolerance(client), client[jweDecrypt]).then(validatePresence.bind(void 0, requiredClaims)).then(validateIssuer.bind(void 0, as.issuer)).then(validateAudience.bind(void 0, client.client_id));
  const clockSkew2 = getClockSkew(client);
  const now = epochTime() + clockSkew2;
  if (claims.iat < now - 3600) {
    throw new OPE('unexpected JWT "iat" (issued at) claim value, it is too far in the past');
  }
  if (typeof claims.c_hash !== "string" || await idTokenHashMatches(code, claims.c_hash, header.alg, key) !== true) {
    throw new OPE('invalid ID Token "c_hash" (code hash) claim value');
  }
  if (claims.s_hash !== void 0 && typeof expectedState !== "string") {
    throw new OPE('could not verify ID Token "s_hash" (state hash) claim value');
  }
  if (typeof expectedState === "string" && (typeof claims.s_hash !== "string" || await idTokenHashMatches(expectedState, claims.s_hash, header.alg, key) !== true)) {
    throw new OPE('invalid ID Token "s_hash" (state hash) claim value');
  }
  if (claims.auth_time !== void 0 && (!Number.isFinite(claims.auth_time) || Math.sign(claims.auth_time) !== 1)) {
    throw new OPE('ID Token "auth_time" (authentication time) must be a positive number');
  }
  maxAge ?? (maxAge = client.default_max_age ?? skipAuthTimeCheck);
  if ((client.require_auth_time || maxAge !== skipAuthTimeCheck) && claims.auth_time === void 0) {
    throw new OPE('ID Token "auth_time" (authentication time) claim missing');
  }
  if (maxAge !== skipAuthTimeCheck) {
    if (typeof maxAge !== "number" || maxAge < 0) {
      throw new TypeError('"maxAge" must be a non-negative number');
    }
    const now2 = epochTime() + getClockSkew(client);
    const tolerance = getClockTolerance(client);
    if (claims.auth_time + maxAge < now2 - tolerance) {
      throw new OPE("too much time has elapsed since the last End-User authentication");
    }
  }
  if (!validateString(expectedNonce)) {
    throw new TypeError('"expectedNonce" must be a non-empty string');
  }
  if (claims.nonce !== expectedNonce) {
    throw new OPE('unexpected ID Token "nonce" claim value');
  }
  if (Array.isArray(claims.aud) && claims.aud.length !== 1) {
    if (claims.azp === void 0) {
      throw new OPE('ID Token "aud" (audience) claim includes additional untrusted audiences');
    }
    if (claims.azp !== client.client_id) {
      throw new OPE('unexpected ID Token "azp" (authorized party) claim value');
    }
  }
  return result;
}
function checkSigningAlgorithm(client, issuer, header) {
  if (client !== void 0) {
    if (header.alg !== client) {
      throw new OPE('unexpected JWT "alg" header parameter');
    }
    return;
  }
  if (Array.isArray(issuer)) {
    if (!issuer.includes(header.alg)) {
      throw new OPE('unexpected JWT "alg" header parameter');
    }
    return;
  }
  if (header.alg !== "RS256") {
    throw new OPE('unexpected JWT "alg" header parameter');
  }
}
function getURLSearchParameter(parameters, name) {
  const { 0: value, length } = parameters.getAll(name);
  if (length > 1) {
    throw new OPE(`"${name}" parameter must be provided only once`);
  }
  return value;
}
const skipStateCheck = Symbol();
const expectNoState = Symbol();
function validateAuthResponse(as, client, parameters, expectedState) {
  assertAs(as);
  assertClient(client);
  if (parameters instanceof URL) {
    parameters = parameters.searchParams;
  }
  if (!(parameters instanceof URLSearchParams)) {
    throw new TypeError('"parameters" must be an instance of URLSearchParams, or URL');
  }
  if (getURLSearchParameter(parameters, "response")) {
    throw new OPE('"parameters" contains a JARM response, use validateJwtAuthResponse() instead of validateAuthResponse()');
  }
  const iss = getURLSearchParameter(parameters, "iss");
  const state = getURLSearchParameter(parameters, "state");
  if (!iss && as.authorization_response_iss_parameter_supported) {
    throw new OPE('response parameter "iss" (issuer) missing');
  }
  if (iss && iss !== as.issuer) {
    throw new OPE('unexpected "iss" (issuer) response parameter value');
  }
  switch (expectedState) {
    case void 0:
    case expectNoState:
      if (state !== void 0) {
        throw new OPE('unexpected "state" response parameter encountered');
      }
      break;
    case skipStateCheck:
      break;
    default:
      if (!validateString(expectedState)) {
        throw new OPE('"expectedState" must be a non-empty string');
      }
      if (state === void 0) {
        throw new OPE('response parameter "state" missing');
      }
      if (state !== expectedState) {
        throw new OPE('unexpected "state" response parameter value');
      }
  }
  const error = getURLSearchParameter(parameters, "error");
  if (error) {
    return {
      error,
      error_description: getURLSearchParameter(parameters, "error_description"),
      error_uri: getURLSearchParameter(parameters, "error_uri")
    };
  }
  const id_token = getURLSearchParameter(parameters, "id_token");
  const token = getURLSearchParameter(parameters, "token");
  if (id_token !== void 0 || token !== void 0) {
    throw new UnsupportedOperationError("implicit and hybrid flows are not supported");
  }
  return brand(new URLSearchParams(parameters));
}
function algToSubtle(alg, crv) {
  switch (alg) {
    case "PS256":
    case "PS384":
    case "PS512":
      return { name: "RSA-PSS", hash: `SHA-${alg.slice(-3)}` };
    case "RS256":
    case "RS384":
    case "RS512":
      return { name: "RSASSA-PKCS1-v1_5", hash: `SHA-${alg.slice(-3)}` };
    case "ES256":
    case "ES384":
      return { name: "ECDSA", namedCurve: `P-${alg.slice(-3)}` };
    case "ES512":
      return { name: "ECDSA", namedCurve: "P-521" };
    case "EdDSA": {
      switch (crv) {
        case "Ed25519":
        case "Ed448":
          return crv;
        default:
          throw new UnsupportedOperationError();
      }
    }
    default:
      throw new UnsupportedOperationError();
  }
}
async function importJwk(alg, jwk) {
  const { ext, key_ops, use, ...key } = jwk;
  return crypto.subtle.importKey("jwk", key, algToSubtle(alg, jwk.crv), true, ["verify"]);
}
async function deviceAuthorizationRequest(as, client, parameters, options) {
  assertAs(as);
  assertClient(client);
  const url = resolveEndpoint(as, "device_authorization_endpoint", alias(client, options));
  const body = new URLSearchParams(parameters);
  body.set("client_id", client.client_id);
  const headers = prepareHeaders(options == null ? void 0 : options.headers);
  headers.set("accept", "application/json");
  return authenticatedRequest(as, client, "POST", url, body, headers, options);
}
async function processDeviceAuthorizationResponse(as, client, response) {
  assertAs(as);
  assertClient(client);
  if (!looseInstanceOf(response, Response)) {
    throw new TypeError('"response" must be an instance of Response');
  }
  if (response.status !== 200) {
    let err;
    if (err = await handleOAuthBodyError(response)) {
      return err;
    }
    throw new OPE('"response" is not a conform Device Authorization Endpoint response');
  }
  assertReadableResponse(response);
  let json;
  try {
    json = await response.json();
  } catch (cause) {
    throw new OPE('failed to parse "response" body as JSON', { cause });
  }
  if (!isJsonObject(json)) {
    throw new OPE('"response" body must be a top level object');
  }
  if (!validateString(json.device_code)) {
    throw new OPE('"response" body "device_code" property must be a non-empty string');
  }
  if (!validateString(json.user_code)) {
    throw new OPE('"response" body "user_code" property must be a non-empty string');
  }
  if (!validateString(json.verification_uri)) {
    throw new OPE('"response" body "verification_uri" property must be a non-empty string');
  }
  if (typeof json.expires_in !== "number" || json.expires_in <= 0) {
    throw new OPE('"response" body "expires_in" property must be a positive number');
  }
  if (json.verification_uri_complete !== void 0 && !validateString(json.verification_uri_complete)) {
    throw new OPE('"response" body "verification_uri_complete" property must be a non-empty string');
  }
  if (json.interval !== void 0 && (typeof json.interval !== "number" || json.interval <= 0)) {
    throw new OPE('"response" body "interval" property must be a positive number');
  }
  return json;
}
async function deviceCodeGrantRequest(as, client, deviceCode, options) {
  assertAs(as);
  assertClient(client);
  if (!validateString(deviceCode)) {
    throw new TypeError('"deviceCode" must be a non-empty string');
  }
  const parameters = new URLSearchParams(options == null ? void 0 : options.additionalParameters);
  parameters.set("device_code", deviceCode);
  return tokenEndpointRequest(as, client, "urn:ietf:params:oauth:grant-type:device_code", parameters, options);
}
async function processDeviceCodeResponse(as, client, response) {
  return processGenericAccessTokenResponse(as, client, response);
}
async function generateKeyPair(alg, options) {
  if (!validateString(alg)) {
    throw new TypeError('"alg" must be a non-empty string');
  }
  const algorithm = algToSubtle(alg, alg === "EdDSA" ? (options == null ? void 0 : options.crv) ?? "Ed25519" : void 0);
  if (alg.startsWith("PS") || alg.startsWith("RS")) {
    Object.assign(algorithm, {
      modulusLength: (options == null ? void 0 : options.modulusLength) ?? 2048,
      publicExponent: new Uint8Array([1, 0, 1])
    });
  }
  return crypto.subtle.generateKey(algorithm, (options == null ? void 0 : options.extractable) ?? false, [
    "sign",
    "verify"
  ]);
}
function normalizeHtu(htu) {
  const url = new URL(htu);
  url.search = "";
  url.hash = "";
  return url.href;
}
async function validateDPoP(as, request, accessToken, accessTokenClaims, options) {
  var _a2, _b2;
  const header = request.headers.get("dpop");
  if (header === null) {
    throw new OPE("operation indicated DPoP use but the request has no DPoP HTTP Header");
  }
  if (((_a2 = request.headers.get("authorization")) == null ? void 0 : _a2.toLowerCase().startsWith("dpop ")) === false) {
    throw new OPE(`operation indicated DPoP use but the request's Authorization HTTP Header scheme is not DPoP`);
  }
  if (typeof ((_b2 = accessTokenClaims.cnf) == null ? void 0 : _b2.jkt) !== "string") {
    throw new OPE("operation indicated DPoP use but the JWT Access Token has no jkt confirmation claim");
  }
  const clockSkew2 = getClockSkew(options);
  const proof = await validateJwt(header, checkSigningAlgorithm.bind(void 0, void 0, (as == null ? void 0 : as.dpop_signing_alg_values_supported) || SUPPORTED_JWS_ALGS), async ({ jwk, alg }) => {
    if (!jwk) {
      throw new OPE("DPoP Proof is missing the jwk header parameter");
    }
    const key = await importJwk(alg, jwk);
    if (key.type !== "public") {
      throw new OPE("DPoP Proof jwk header parameter must contain a public key");
    }
    return key;
  }, clockSkew2, getClockTolerance(options), void 0).then(checkJwtType.bind(void 0, "dpop+jwt")).then(validatePresence.bind(void 0, ["iat", "jti", "ath", "htm", "htu"]));
  const now = epochTime() + clockSkew2;
  const diff = Math.abs(now - proof.claims.iat);
  if (diff > 300) {
    throw new OPE("DPoP Proof iat is not recent enough");
  }
  if (proof.claims.htm !== request.method) {
    throw new OPE("DPoP Proof htm mismatch");
  }
  if (typeof proof.claims.htu !== "string" || normalizeHtu(proof.claims.htu) !== normalizeHtu(request.url)) {
    throw new OPE("DPoP Proof htu mismatch");
  }
  {
    const expected = b64u(await crypto.subtle.digest("SHA-256", encoder.encode(accessToken)));
    if (proof.claims.ath !== expected) {
      throw new OPE("DPoP Proof ath mismatch");
    }
  }
  {
    let components;
    switch (proof.header.jwk.kty) {
      case "EC":
        components = {
          crv: proof.header.jwk.crv,
          kty: proof.header.jwk.kty,
          x: proof.header.jwk.x,
          y: proof.header.jwk.y
        };
        break;
      case "OKP":
        components = {
          crv: proof.header.jwk.crv,
          kty: proof.header.jwk.kty,
          x: proof.header.jwk.x
        };
        break;
      case "RSA":
        components = {
          e: proof.header.jwk.e,
          kty: proof.header.jwk.kty,
          n: proof.header.jwk.n
        };
        break;
      default:
        throw new UnsupportedOperationError();
    }
    const expected = b64u(await crypto.subtle.digest("SHA-256", encoder.encode(JSON.stringify(components))));
    if (accessTokenClaims.cnf.jkt !== expected) {
      throw new OPE("JWT Access Token confirmation mismatch");
    }
  }
}
async function validateJwtAccessToken(as, request, expectedAudience, options) {
  var _a2;
  assertAs(as);
  if (!looseInstanceOf(request, Request)) {
    throw new TypeError('"request" must be an instance of Request');
  }
  if (!validateString(expectedAudience)) {
    throw new OPE('"expectedAudience" must be a non-empty string');
  }
  const authorization = request.headers.get("authorization");
  if (authorization === null) {
    throw new OPE('"request" is missing an Authorization HTTP Header');
  }
  let { 0: scheme, 1: accessToken, length } = authorization.split(" ");
  scheme = scheme.toLowerCase();
  switch (scheme) {
    case "dpop":
    case "bearer":
      break;
    default:
      throw new UnsupportedOperationError("unsupported Authorization HTTP Header scheme");
  }
  if (length !== 2) {
    throw new OPE("invalid Authorization HTTP Header format");
  }
  const requiredClaims = [
    "iss",
    "exp",
    "aud",
    "sub",
    "iat",
    "jti",
    "client_id"
  ];
  if ((options == null ? void 0 : options.requireDPoP) || scheme === "dpop" || request.headers.has("dpop")) {
    requiredClaims.push("cnf");
  }
  const { claims } = await validateJwt(accessToken, checkSigningAlgorithm.bind(void 0, void 0, SUPPORTED_JWS_ALGS), getPublicSigKeyFromIssuerJwksUri.bind(void 0, as, options), getClockSkew(options), getClockTolerance(options), void 0).then(checkJwtType.bind(void 0, "at+jwt")).then(validatePresence.bind(void 0, requiredClaims)).then(validateIssuer.bind(void 0, as.issuer)).then(validateAudience.bind(void 0, expectedAudience));
  for (const claim of ["client_id", "jti", "sub"]) {
    if (typeof claims[claim] !== "string") {
      throw new OPE(`unexpected JWT "${claim}" claim type`);
    }
  }
  if ("cnf" in claims) {
    if (!isJsonObject(claims.cnf)) {
      throw new OPE('unexpected JWT "cnf" (confirmation) claim value');
    }
    const { 0: cnf, length: length2 } = Object.keys(claims.cnf);
    if (length2) {
      if (length2 !== 1) {
        throw new UnsupportedOperationError("multiple confirmation claims are not supported");
      }
      if (cnf !== "jkt") {
        throw new UnsupportedOperationError("unsupported JWT Confirmation method");
      }
    }
  }
  if ((options == null ? void 0 : options.requireDPoP) || scheme === "dpop" || ((_a2 = claims.cnf) == null ? void 0 : _a2.jkt) !== void 0 || request.headers.has("dpop")) {
    await validateDPoP(as, request, accessToken, claims, options);
  }
  return claims;
}
const experimentalCustomFetch = customFetch;
const experimental_customFetch = customFetch;
const experimentalUseMtlsAlias = useMtlsAlias;
const experimental_useMtlsAlias = useMtlsAlias;
const experimental_validateDetachedSignatureResponse = (...args) => validateDetachedSignatureResponse(...args);
const experimental_validateJwtAccessToken = (...args) => validateJwtAccessToken(...args);
const validateJwtUserinfoSignature = (...args) => validateJwtUserInfoSignature(...args);
const experimental_jwksCache = jwksCache;
var e = class extends EventTarget {
  dispatchTypedEvent(s, t) {
    return super.dispatchEvent(t);
  }
};
function throwIfError(result) {
  if (isOAuth2Error(result)) {
    throw new Error(`Failed to get token: ${result.error}`);
  }
  return result;
}
const CustomEvent = globalThis.CustomEvent;
function localStorageKey(client) {
  return `@osdk/oauth : refresh : ${client.client_id}`;
}
function saveLocal(client, x) {
  var _a2;
  (_a2 = globalThis.localStorage) == null ? void 0 : _a2.setItem(localStorageKey(client), JSON.stringify(x));
}
function removeLocal(client) {
  var _a2;
  (_a2 = globalThis.localStorage) == null ? void 0 : _a2.removeItem(localStorageKey(client));
}
function readLocal(client) {
  var _a2;
  return JSON.parse(
    // MUST `localStorage?` as nodejs does not have localStorage
    ((_a2 = globalThis.localStorage) == null ? void 0 : _a2.getItem(localStorageKey(client))) ?? "{}"
  );
}
function saveSession(client, x) {
  var _a2;
  (_a2 = globalThis.sessionStorage) == null ? void 0 : _a2.setItem(localStorageKey(client), JSON.stringify(x));
}
function removeSession(client) {
  var _a2;
  (_a2 = globalThis.sessionStorage) == null ? void 0 : _a2.removeItem(localStorageKey(client));
}
function readSession(client) {
  var _a2;
  return JSON.parse(
    // MUST `sessionStorage?` as nodejs does not have sessionStorage
    ((_a2 = globalThis.sessionStorage) == null ? void 0 : _a2.getItem(localStorageKey(client))) ?? "{}"
  );
}
function common(client, as, _signIn, oauthHttpOptions, refresh, refreshTokenMarker, scopes) {
  let token;
  const eventTarget = new e();
  function makeTokenAndSaveRefresh(resp, type) {
    const {
      refresh_token,
      expires_in,
      access_token
    } = resp;
    !(expires_in != null) ? false ? invariant(false) : invariant(false) : void 0;
    saveLocal(client, {
      refresh_token,
      refreshTokenMarker,
      requestedScopes: scopes
    });
    token = {
      refresh_token,
      expires_in,
      access_token,
      expires_at: Date.now() + expires_in * 1e3
    };
    eventTarget.dispatchTypedEvent(type, new CustomEvent(type, {
      detail: token
    }));
    return token;
  }
  let refreshTimeout;
  function rmTimeout() {
    if (refreshTimeout) clearTimeout(refreshTimeout);
  }
  function restartRefreshTimer(evt) {
    if (refresh) {
      rmTimeout();
      refreshTimeout = setTimeout(refresh, evt.detail.expires_in * 1e3 - 60 * 1e3);
    }
  }
  let pendingSignIn;
  async function signIn() {
    if (pendingSignIn) {
      return pendingSignIn;
    }
    try {
      pendingSignIn = _signIn();
      return await pendingSignIn;
    } finally {
      pendingSignIn = void 0;
    }
  }
  eventTarget.addEventListener("signIn", restartRefreshTimer);
  eventTarget.addEventListener("refresh", restartRefreshTimer);
  function getTokenOrUndefined() {
    if (!token || Date.now() >= token.expires_at) {
      return void 0;
    }
    return token == null ? void 0 : token.access_token;
  }
  const getToken = Object.assign(async function getToken2() {
    if (!token || Date.now() >= token.expires_at) {
      token = await signIn();
    }
    return token == null ? void 0 : token.access_token;
  }, {
    signIn,
    refresh,
    signOut: async function signOut() {
      !token ? false ? invariant(false, "not signed in") : invariant(false) : void 0;
      const result = await processRevocationResponse(await revocationRequest(as, client, token.access_token, oauthHttpOptions));
      rmTimeout();
      removeLocal(client);
      token = void 0;
      throwIfError(result);
      eventTarget.dispatchTypedEvent("signOut", new Event("signOut"));
    },
    rmTimeout,
    getTokenOrUndefined,
    addEventListener: eventTarget.addEventListener.bind(eventTarget),
    removeEventListener: eventTarget.removeEventListener.bind(eventTarget)
  });
  return {
    getToken,
    makeTokenAndSaveRefresh
  };
}
function createAuthorizationServer(ctxPath, url) {
  const issuer = `${new URL(ctxPath, url.endsWith("/") ? url : url + "/")}`;
  return {
    token_endpoint: `${issuer}/api/oauth2/token`,
    authorization_endpoint: `${issuer}/api/oauth2/authorize`,
    revocation_endpoint: `${issuer}/api/oauth2/revoke_token`,
    issuer
  };
}
function createConfidentialOauthClient(client_id, client_secret, url, scopes = ["api:read-data", "api:write-data", "api:use-ontologies-read", "api:use-ontologies-write"], fetchFn = globalThis.fetch, ctxPath = "multipass") {
  const client = {
    client_id,
    client_secret
  };
  const authServer = createAuthorizationServer(ctxPath, url);
  const oauthHttpOptions = {
    [customFetch]: fetchFn
  };
  const joinedScopes = scopes.join(" ");
  const {
    getToken,
    makeTokenAndSaveRefresh
  } = common(client, authServer, async function() {
    return makeTokenAndSaveRefresh(throwIfError(await processClientCredentialsResponse(authServer, client, await clientCredentialsGrantRequest(authServer, client, new URLSearchParams({
      scope: joinedScopes
    }), oauthHttpOptions))), "signIn");
  }, oauthHttpOptions, void 0, void 0, joinedScopes);
  return getToken;
}
const randomInteger = (minimum, maximum) => Math.floor(Math.random() * (maximum - minimum + 1) + minimum);
const createAbortError = () => {
  const error = new Error("Delay aborted");
  error.name = "AbortError";
  return error;
};
const clearMethods = /* @__PURE__ */ new WeakMap();
function createDelay({ clearTimeout: defaultClear, setTimeout: defaultSet } = {}) {
  return (milliseconds, { value, signal: signal2 } = {}) => {
    if (signal2 == null ? void 0 : signal2.aborted) {
      return Promise.reject(createAbortError());
    }
    let timeoutId;
    let settle;
    let rejectFunction;
    const clear = defaultClear ?? clearTimeout;
    const signalListener = () => {
      clear(timeoutId);
      rejectFunction(createAbortError());
    };
    const cleanup = () => {
      if (signal2) {
        signal2.removeEventListener("abort", signalListener);
      }
    };
    const delayPromise = new Promise((resolve, reject) => {
      settle = () => {
        cleanup();
        resolve(value);
      };
      rejectFunction = reject;
      timeoutId = (defaultSet ?? setTimeout)(settle, milliseconds);
    });
    if (signal2) {
      signal2.addEventListener("abort", signalListener, { once: true });
    }
    clearMethods.set(delayPromise, () => {
      clear(timeoutId);
      timeoutId = null;
      settle();
    });
    return delayPromise;
  };
}
const delay = createDelay();
async function rangeDelay(minimum, maximum, options = {}) {
  return delay(randomInteger(minimum, maximum), options);
}
function clearDelay(promise) {
  var _a2;
  (_a2 = clearMethods.get(promise)) == null ? void 0 : _a2();
}
function processOptionsAndAssignDefaults(url, redirect_uri, useHistory, loginPage, postLoginPage, scopes, fetchFn, ctxPath) {
  let options = {};
  if (typeof useHistory === "object") {
    !(!loginPage && !postLoginPage && !scopes && !fetchFn && !ctxPath) ? false ? invariant(false, "If useHistory is an object, other options should not be provided") : invariant(false) : void 0;
    options = useHistory;
  } else {
    options = {
      useHistory,
      loginPage,
      postLoginPage,
      scopes,
      fetchFn,
      ctxPath
    };
  }
  !url ? false ? invariant(false, "url is required") : invariant(false) : void 0;
  !redirect_uri ? false ? invariant(false, "redirectUrl is required") : invariant(false) : void 0;
  return {
    useHistory: options.useHistory ?? true,
    loginPage: options.loginPage,
    postLoginPage: options.postLoginPage || window.location.toString(),
    joinedScopes: [...options.scopes ?? ["api:read-data", "api:write-data", "api:use-ontologies-read", "api:use-ontologies-write"]].sort().join(" "),
    fetchFn: options.fetchFn ?? globalThis.fetch,
    ctxPath: options.ctxPath ?? "multipass",
    refreshTokenMarker: options.refreshTokenMarker
  };
}
function createPublicOauthClient(client_id, url, redirect_uri, useHistory, loginPage, postLoginPage, scopes, fetchFn, ctxPath) {
  let refreshTokenMarker;
  let joinedScopes;
  ({
    useHistory,
    loginPage,
    postLoginPage,
    joinedScopes,
    fetchFn,
    ctxPath,
    refreshTokenMarker
  } = processOptionsAndAssignDefaults(url, redirect_uri, useHistory, loginPage, postLoginPage, scopes, fetchFn, ctxPath));
  const client = {
    client_id,
    token_endpoint_auth_method: "none"
  };
  const authServer = createAuthorizationServer(ctxPath, url);
  const oauthHttpOptions = {
    [customFetch]: fetchFn
  };
  const {
    makeTokenAndSaveRefresh,
    getToken
  } = common(
    client,
    authServer,
    /** Will throw if there is no token! */
    async function _signIn() {
      return await maybeRefresh() ?? await maybeHandleAuthReturn() ?? await initiateLoginRedirect();
    },
    oauthHttpOptions,
    maybeRefresh.bind(globalThis, true),
    refreshTokenMarker,
    joinedScopes
  );
  const go = async (x) => {
    if (useHistory) {
      window.history.replaceState({}, "", x);
      return;
    } else window.location.assign(x);
    await delay(1e3);
    throw new Error("Unable to redirect");
  };
  async function maybeRefresh(expectRefreshToken) {
    const {
      refresh_token,
      refreshTokenMarker: lastRefreshTokenMarker,
      requestedScopes: initialRequestedScopes
    } = readLocal(client);
    const areScopesEqual = initialRequestedScopes != null && joinedScopes === initialRequestedScopes;
    if (!refresh_token || lastRefreshTokenMarker !== refreshTokenMarker || !areScopesEqual) {
      if (expectRefreshToken) throw new Error("No refresh token found");
      return;
    }
    try {
      const result = makeTokenAndSaveRefresh(throwIfError(await processAuthorizationCodeOAuth2Response(authServer, client, await refreshTokenGrantRequest(authServer, client, refresh_token, oauthHttpOptions))), "refresh");
      if (result && window.location.pathname === new URL(redirect_uri).pathname) {
        const {
          oldUrl
        } = readSession(client);
        void go(oldUrl ?? "/");
      }
      return result;
    } catch (e2) {
      if (false) {
        console.warn("Failed to get OAuth2 refresh token. Removing refresh token", e2);
      }
      removeLocal(client);
      if (expectRefreshToken) {
        throw new Error("Could not refresh token");
      }
    }
  }
  async function maybeHandleAuthReturn() {
    const {
      state,
      oldUrl,
      codeVerifier
    } = readSession(client);
    if (!codeVerifier) return;
    try {
      const ret = makeTokenAndSaveRefresh(throwIfError(await processAuthorizationCodeOAuth2Response(authServer, client, await authorizationCodeGrantRequest(authServer, client, throwIfError(validateAuthResponse(authServer, client, new URL(window.location.href), state)), redirect_uri, codeVerifier, oauthHttpOptions))), "signIn");
      void go(oldUrl);
      return ret;
    } catch (e2) {
      if (false) {
        console.warn("Failed to get OAuth2 token using PKCE, removing PKCE and starting a new auth flow", e2);
      }
      removeLocal(client);
      removeSession(client);
      throw e2;
    }
  }
  const initiateLoginRedirect = async () => {
    if (loginPage && window.location.href !== loginPage && window.location.pathname !== loginPage) {
      saveLocal(client, {});
      saveSession(client, {
        oldUrl: postLoginPage
      });
      await go(loginPage);
      return;
    }
    const state = generateRandomState();
    const codeVerifier = generateRandomCodeVerifier();
    const oldUrl = readSession(client).oldUrl ?? window.location.toString();
    saveLocal(client, {});
    saveSession(client, {
      codeVerifier,
      state,
      oldUrl
    });
    window.location.assign(`${authServer.authorization_endpoint}?${new URLSearchParams({
      client_id,
      response_type: "code",
      state,
      redirect_uri,
      code_challenge: await calculatePKCECodeChallenge(codeVerifier),
      code_challenge_method: "S256",
      scope: `offline_access ${joinedScopes}`
    })}`);
    await delay(1e3);
    throw new Error("Unable to redirect");
  };
  return getToken;
}
const _list$9 = [0, "/v2/admin/enrollments/{0}/authenticationProviders", 2];
function list$9($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$9, ...args);
}
const _get$9 = [0, "/v2/admin/enrollments/{0}/authenticationProviders/{1}", 2];
function get$9($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$9, ...args);
}
const _preregisterUser = [1, "/v2/admin/enrollments/{0}/authenticationProviders/{1}/preregisterUser", 3];
function preregisterUser($ctx, ...args) {
  return foundryPlatformFetch($ctx, _preregisterUser, ...args);
}
const _preregisterGroup = [1, "/v2/admin/enrollments/{0}/authenticationProviders/{1}/preregisterGroup", 3];
function preregisterGroup($ctx, ...args) {
  return foundryPlatformFetch($ctx, _preregisterGroup, ...args);
}
const AuthenticationProvider = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$9,
  list: list$9,
  preregisterGroup,
  preregisterUser
}, Symbol.toStringTag, { value: "Module" }));
const _get$8 = [0, "/v2/admin/enrollments/{0}", 2];
function get$8($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$8, ...args);
}
const _getCurrent$1 = [0, "/v2/admin/enrollments/getCurrent", 2];
function getCurrent$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getCurrent$1, ...args);
}
const Enrollment = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$8,
  getCurrent: getCurrent$1
}, Symbol.toStringTag, { value: "Module" }));
const _create$1 = [1, "/v2/admin/groups", 1];
function create$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _create$1, ...args);
}
const _deleteGroup = [3, "/v2/admin/groups/{0}"];
function deleteGroup($ctx, ...args) {
  return foundryPlatformFetch($ctx, _deleteGroup, ...args);
}
const _list$8 = [0, "/v2/admin/groups", 2];
function list$8($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$8, ...args);
}
const _get$7 = [0, "/v2/admin/groups/{0}"];
function get$7($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$7, ...args);
}
const _getBatch$3 = [1, "/v2/admin/groups/getBatch", 1];
function getBatch$3($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getBatch$3, ...args);
}
const _search$1 = [1, "/v2/admin/groups/search", 1];
function search$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _search$1, ...args);
}
const Group = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  create: create$1,
  deleteGroup,
  get: get$7,
  getBatch: getBatch$3,
  list: list$8,
  search: search$1
}, Symbol.toStringTag, { value: "Module" }));
const _list$7 = [0, "/v2/admin/groups/{0}/groupMembers", 2];
function list$7($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$7, ...args);
}
const _add$2 = [1, "/v2/admin/groups/{0}/groupMembers/add", 1];
function add$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _add$2, ...args);
}
const _remove$2 = [1, "/v2/admin/groups/{0}/groupMembers/remove", 1];
function remove$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _remove$2, ...args);
}
const GroupMember = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: add$2,
  list: list$7,
  remove: remove$2
}, Symbol.toStringTag, { value: "Module" }));
const _list$6 = [0, "/v2/admin/users/{0}/groupMemberships", 2];
function list$6($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$6, ...args);
}
const GroupMembership = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  list: list$6
}, Symbol.toStringTag, { value: "Module" }));
const _get$6 = [0, "/v2/admin/groups/{0}/providerInfo", 2];
function get$6($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$6, ...args);
}
const _replace$2 = [2, "/v2/admin/groups/{0}/providerInfo", 3];
function replace$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _replace$2, ...args);
}
const GroupProviderInfo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$6,
  replace: replace$2
}, Symbol.toStringTag, { value: "Module" }));
const _list$5 = [0, "/v2/admin/enrollments/{0}/hosts", 2];
function list$5($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$5, ...args);
}
const Host = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  list: list$5
}, Symbol.toStringTag, { value: "Module" }));
const _create = [1, "/v2/admin/markings", 3];
function create($ctx, ...args) {
  return foundryPlatformFetch($ctx, _create, ...args);
}
const _list$4 = [0, "/v2/admin/markings", 2];
function list$4($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$4, ...args);
}
const _get$5 = [0, "/v2/admin/markings/{0}", 2];
function get$5($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$5, ...args);
}
const _getBatch$2 = [1, "/v2/admin/markings/getBatch", 3];
function getBatch$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getBatch$2, ...args);
}
const Marking = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  create,
  get: get$5,
  getBatch: getBatch$2,
  list: list$4
}, Symbol.toStringTag, { value: "Module" }));
const _list$3 = [0, "/v2/admin/markingCategories", 2];
function list$3($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$3, ...args);
}
const _get$4 = [0, "/v2/admin/markingCategories/{0}", 2];
function get$4($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$4, ...args);
}
const MarkingCategory = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$4,
  list: list$3
}, Symbol.toStringTag, { value: "Module" }));
const _list$2 = [0, "/v2/admin/markings/{0}/markingMembers", 2];
function list$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$2, ...args);
}
const _add$1 = [1, "/v2/admin/markings/{0}/markingMembers/add", 3];
function add$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _add$1, ...args);
}
const _remove$1 = [1, "/v2/admin/markings/{0}/markingMembers/remove", 3];
function remove$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _remove$1, ...args);
}
const MarkingMember = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add: add$1,
  list: list$2,
  remove: remove$1
}, Symbol.toStringTag, { value: "Module" }));
const _list$1 = [0, "/v2/admin/markings/{0}/roleAssignments", 2];
function list$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list$1, ...args);
}
const _add = [1, "/v2/admin/markings/{0}/roleAssignments/add", 3];
function add($ctx, ...args) {
  return foundryPlatformFetch($ctx, _add, ...args);
}
const _remove = [1, "/v2/admin/markings/{0}/roleAssignments/remove", 3];
function remove($ctx, ...args) {
  return foundryPlatformFetch($ctx, _remove, ...args);
}
const MarkingRoleAssignment = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  add,
  list: list$1,
  remove
}, Symbol.toStringTag, { value: "Module" }));
const _get$3 = [0, "/v2/admin/organizations/{0}", 2];
function get$3($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$3, ...args);
}
const _replace$1 = [2, "/v2/admin/organizations/{0}", 3];
function replace$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _replace$1, ...args);
}
const Organization = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$3,
  replace: replace$1
}, Symbol.toStringTag, { value: "Module" }));
const _get$2 = [0, "/v2/admin/roles/{0}", 2];
function get$2($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$2, ...args);
}
const _getBatch$1 = [1, "/v2/admin/roles/getBatch", 3];
function getBatch$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getBatch$1, ...args);
}
const Role = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get: get$2,
  getBatch: getBatch$1
}, Symbol.toStringTag, { value: "Module" }));
const _deleteUser = [3, "/v2/admin/users/{0}"];
function deleteUser($ctx, ...args) {
  return foundryPlatformFetch($ctx, _deleteUser, ...args);
}
const _list = [0, "/v2/admin/users", 2];
function list($ctx, ...args) {
  return foundryPlatformFetch($ctx, _list, ...args);
}
const _get$1 = [0, "/v2/admin/users/{0}"];
function get$1($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get$1, ...args);
}
const _getBatch = [1, "/v2/admin/users/getBatch", 1];
function getBatch($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getBatch, ...args);
}
const _getCurrent = [0, "/v2/admin/users/getCurrent"];
function getCurrent($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getCurrent, ...args);
}
const _getMarkings = [0, "/v2/admin/users/{0}/getMarkings", 2];
function getMarkings($ctx, ...args) {
  return foundryPlatformFetch($ctx, _getMarkings, ...args);
}
const _profilePicture = [0, "/v2/admin/users/{0}/profilePicture", , , "application/octet-stream"];
function profilePicture($ctx, ...args) {
  return foundryPlatformFetch($ctx, _profilePicture, ...args);
}
const _search = [1, "/v2/admin/users/search", 1];
function search($ctx, ...args) {
  return foundryPlatformFetch($ctx, _search, ...args);
}
const Users$1 = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  deleteUser,
  get: get$1,
  getBatch,
  getCurrent,
  getMarkings,
  list,
  profilePicture,
  search
}, Symbol.toStringTag, { value: "Module" }));
const _get = [0, "/v2/admin/users/{0}/providerInfo", 2];
function get($ctx, ...args) {
  return foundryPlatformFetch($ctx, _get, ...args);
}
const _replace = [2, "/v2/admin/users/{0}/providerInfo", 3];
function replace($ctx, ...args) {
  return foundryPlatformFetch($ctx, _replace, ...args);
}
const UserProviderInfo = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  get,
  replace
}, Symbol.toStringTag, { value: "Module" }));
export {
  $ontologyRid as $,
  Users$1 as U,
  createClient as a,
  getCurrent as b,
  createPublicOauthClient as c,
  commonjsGlobal as d,
  getAugmentedNamespace as e,
  getDefaultExportFromCjs as g,
  index as i
};
//# sourceMappingURL=osdk-vendors-Bhbwzvvx.js.map

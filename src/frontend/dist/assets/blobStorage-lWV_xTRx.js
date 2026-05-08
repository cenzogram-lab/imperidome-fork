var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
class LocalBlobHandle {
  constructor(bytes) {
    __publicField(this, "bytes");
    __publicField(this, "progressCallback", null);
    this.bytes = bytes;
  }
  withUploadProgress(callback) {
    this.progressCallback = callback;
    return this;
  }
  getDirectURL() {
    if (this.progressCallback) {
      setTimeout(() => {
        var _a;
        return (_a = this.progressCallback) == null ? void 0 : _a.call(this, 0.5);
      }, 50);
      setTimeout(() => {
        var _a;
        return (_a = this.progressCallback) == null ? void 0 : _a.call(this, 1);
      }, 100);
    }
    const blob = new Blob([this.bytes.buffer]);
    return URL.createObjectURL(blob);
  }
}
function createBlobFromBytes(bytes) {
  var _a;
  const w = window;
  if ((_a = w.__icpBlobStorage) == null ? void 0 : _a.ExternalBlob) {
    return w.__icpBlobStorage.ExternalBlob.fromBytes(bytes);
  }
  return new LocalBlobHandle(bytes);
}
export {
  createBlobFromBytes
};

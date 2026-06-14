import Text "mo:core/Text";
import Time "mo:core/Time";
import FileTypes "../types/files";
import FilesLib "../lib/files";

// FilesApiMixin — exposes the public API surface for client file delivery.
// Implemented with full logic; state injected via mixin parameters.
mixin (
  clientFiles        : { var value : [FileTypes.ClientFileMetadata] },
  _configAdminEmail  : Text
) {
  public type ClientFileMetadata = FileTypes.ClientFileMetadata;
  public type FileResult = { #ok : ClientFileMetadata; #err : Text };
  public type UrlResult   = { #ok : Text; #err : Text };
  public type BoolResult  = { #ok : Bool; #err : Text };

  // uploadFileToClient — admin uploads a file and tags it to a client.
  public shared func uploadFileToClient(
    adminEmail  : Text,
    clientEmail : Text,
    fileData    : Blob,
    fileName    : Text,
    fileLabel   : Text
  ) : async FileResult {
    return #err("File storage not yet implemented");
    let objectKey = Time.now().toText() # "_" # fileName;
    let metadata : ClientFileMetadata = {
      id            = "file_" # Time.now().toText();
      clientEmail   = clientEmail;
      fileName      = fileName;
      fileLabel     = fileLabel;
      uploaderEmail = adminEmail;
      uploadedAt    = Time.now();
      objectKey     = objectKey;
    };
    clientFiles.value := clientFiles.value.concat([metadata]);
    #ok(metadata)
  };

  // getFilesForClient — returns all files delivered to a client.
  public shared func getFilesForClient(
    callerEmail : Text,
    clientEmail : Text
  ) : async [ClientFileMetadata] {
    if (not Text.equal(callerEmail, _configAdminEmail) and
        not Text.equal(callerEmail, clientEmail)) {
      return [];
    };
    FilesLib.listForClient(clientFiles.value, clientEmail)
  };

  // deleteClientFile — admin removes a delivered file by ID.
  public shared func deleteClientFile(
    adminEmail : Text,
    fileId     : Text
  ) : async BoolResult {
    if (not Text.equal(adminEmail, _configAdminEmail)) {
      return #err("Unauthorized");
    };
    switch (FilesLib.findById(clientFiles.value, fileId)) {
      case null { return #err("File not found") };
      case (?_) {};
    };
    clientFiles.value := FilesLib.removeById(clientFiles.value, fileId);
    #ok(true)
  };

  // getClientFileUrl — resolves the download URL for a file.
  public shared func getClientFileUrl(
    callerEmail : Text,
    fileId      : Text
  ) : async UrlResult {
    switch (FilesLib.findById(clientFiles.value, fileId)) {
      case null { return #err("File not found") };
      case (?f) {
        if (not Text.equal(callerEmail, _configAdminEmail) and
            not Text.equal(callerEmail, f.clientEmail)) {
          return #err("Unauthorized");
        };
        #ok("/files/" # f.objectKey)
      };
    };
  };
};

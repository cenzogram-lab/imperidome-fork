import Text "mo:core/Text";
import FileTypes "../types/files";

// FilesLib — domain logic for client file delivery.
module {
  public type ClientFileMetadata = FileTypes.ClientFileMetadata;

  // listForClient — returns all files tagged to a specific clientEmail, newest first.
  public func listForClient(
    files       : [ClientFileMetadata],
    clientEmail : Text
  ) : [ClientFileMetadata] {
    files.filter(func(f) { Text.equal(f.clientEmail, clientEmail) })
  };

  // findById — looks up a file record by ID; returns null when not found.
  public func findById(
    files  : [ClientFileMetadata],
    fileId : Text
  ) : ?ClientFileMetadata {
    files.find(func(f) { Text.equal(f.id, fileId) })
  };

  // removeById — returns a new array with the given file ID filtered out.
  public func removeById(
    files  : [ClientFileMetadata],
    fileId : Text
  ) : [ClientFileMetadata] {
    files.filter(func(f) { not Text.equal(f.id, fileId) })
  };
};

module {
  // ClientFileMetadata — represents one file delivered by admin to a specific client.
  // objectKey is the key in the object-storage extension (returned by the upload mixin).
  public type ClientFileMetadata = {
    id            : Text;
    clientEmail   : Text;   // email of the client this file is delivered to
    fileName      : Text;   // original file name (e.g. "logo-final.zip")
    fileLabel     : Text;   // admin-supplied label (e.g. "Final Logo Package")
    uploaderEmail : Text;   // must be vincenzo@imperidome.com
    uploadedAt    : Int;    // nanosecond timestamp
    objectKey     : Text;   // object-storage key for download URL resolution
  };
};

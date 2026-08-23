export const CONTRACT_ADDRESS =
  "0x2383eb180144C00cfFF71Bf12Be60D28344495c1";

export const CONTRACT_ABI = [
  "function uploadFile(string cid, string fileName, address recipient, uint256 expiry) returns (bytes32 fileId)",
  "function grantAccess(bytes32 fileId, address user, uint256 expiry)",
  "function revokeAccess(bytes32 fileId, address user)",
  "function canAccess(bytes32 fileId, address user) view returns (bool)",
  "function getFile(bytes32 fileId) view returns (string cid, string fileName, address owner, uint256 uploadedAt)",
  "function getMyUploadedFiles() view returns (bytes32[])",
  "function recordFileAccess(bytes32 fileId)",
  "event FileUploaded(bytes32 indexed fileId, string cid, address indexed owner, address indexed recipient, uint256 expiry)",
  "event AccessGranted(bytes32 indexed fileId, address indexed user, uint256 expiry)",
  "event AccessRevoked(bytes32 indexed fileId, address indexed user)",
  "event FileAccessed(bytes32 indexed fileId, address indexed user, uint256 accessedAt)"
];
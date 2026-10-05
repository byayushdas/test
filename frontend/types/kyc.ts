export enum KYCVerificationStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  RE_UPLOAD = 'RE_UPLOAD',
}

export const getKycStatusLabel = (status?: string | KYCVerificationStatus): string => {
  if (!status) return 'Pending Verification';
  const normalized = String(status).toUpperCase();
  if (normalized.includes('VERIFIED') || normalized.includes('APPROVED')) {
    return 'Verified';
  }
  if (normalized.includes('REJECT') || normalized.includes('REJECTED')) {
    return 'Rejected';
  }
  if (normalized.includes('RE_UPLOAD') || normalized.includes('RE-UPLOAD')) {
    return 'Re-Upload Requested';
  }
  return 'Pending Verification';
};

export default KYCVerificationStatus;

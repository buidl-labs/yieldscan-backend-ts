export interface IValidatorIdentity {
  stashId: string;
  vision: string;
  members: [{ member: string; role: string; twitter: string }];
}

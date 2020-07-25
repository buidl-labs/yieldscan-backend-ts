export interface ICouncilIdentity {
  accountId: string;
  vision: string;
  members: [{ member: string; role: string; twitter: string }];
}

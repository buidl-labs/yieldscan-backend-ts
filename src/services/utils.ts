import { CustomError } from 'ts-custom-error';
import mongoose from 'mongoose';
import { Container } from 'typedi';

import { IStakingInfo } from '../interfaces/IStakingInfo';
import { IAccountIdentity } from '../interfaces/IAccountIdentity';

export async function wait(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export async function getLinkedValidators(networkName, socialInfo, stashId) {
  const arr = Object.values(socialInfo).filter((x) => x !== null);
  const AccountIdentity = Container.get(networkName + 'AccountIdentity') as mongoose.Model<
    IAccountIdentity & mongoose.Document
  >;
  const linkedValidators = await AccountIdentity.aggregate([
    {
      $match: {
        $or: [
          { email: { $in: arr } },
          { legal: { $in: arr } },
          { riot: { $in: arr } },
          { web: { $in: arr } },
          { twitter: { $in: arr } },
        ],
      },
    },
  ]);

  const result = linkedValidators
    .map((x) => {
      return {
        stashId: x.stashId,
        name: x.display,
      };
    })
    .filter((el) => el.stashId != stashId);
  return result;
}

export function scaleData(val: number, max: number, min: number): number {
  return ((val - min) / (max - min)) * (100 - 1) + 1;
}

export function normalizeData(val: number, max: number, min: number): number {
  return (val - min) / (max - min);
}

export function sortLowRisk(arr: Array<IStakingInfo>): Array<IStakingInfo> {
  const lowestRiskset = arr.filter((x) => x.riskScore < 0.3 && x.commission !== 1 && !x.oversubscribed);

  // Uncomment below if you want to include include suggestions from other risk-sets

  // const medRiskSet = arr.filter((x) => x.riskScore >= 0.3 && x.riskScore < 0.5);
  // // console.log(medRiskSet)
  // const lowMedSet = lowestRiskset.concat(medRiskSet);
  // const remaining = arr.filter((n) => !lowMedSet.includes(n));
  // const result = lowMedSet.concat(remaining);
  // return result;
  return lowestRiskset;
}

export function sortMedRisk(arr: Array<IStakingInfo>): Array<IStakingInfo> {
  const medRiskSet = arr.filter((x) => x.riskScore < 0.5 && x.commission !== 1 && !x.oversubscribed);

  // Uncomment below if you want to include include suggestions from other risk-sets

  // const remaining = arr.filter((n) => !medRiskSet.includes(n));
  // const result = medRiskSet.concat(remaining);
  // return result;
  return medRiskSet;
}

export function sortHighRisk(arr: Array<IStakingInfo>): Array<IStakingInfo> {
  const highRiskSet = arr.filter((x) => x.commission !== 1 && !x.oversubscribed);

  // Uncomment below if you want to include include suggestions from other risk-sets

  // const remaining = arr.filter((n) => !medRiskSet.includes(n));
  // const result = medRiskSet.concat(remaining);
  // return result;
  return highRiskSet;
}

// Todo save and fetch reused data in a file

// export function jsonReader(filePath, cb) {
//   fs.readFile(filePath, (err, fileData) => {
//     if (err) {
//       return cb && cb(err);
//     }
//     try {
//       const object = JSON.parse(fileData);
//       return cb && cb(null, object);
//     } catch (err) {
//       return cb && cb(err);
//     }
//   });
// }

// export function saveTotalRewardLastIndexInfo(lastIndex: number) {
//   jsonReader('../lastIndexInfo.json', (err, lastIndexInfo) => {
//     if (err) {
//       console.log('Error reading file:', err);
//       return;
//     }
//     // increase customer order count by 1
//     lastIndexInfo.totalRewardLastIndex = lastIndex;
//     fs.writeFile('./lastIndexInfo.json', JSON.stringify(lastIndexInfo), (err) => {
//       if (err) console.log('Error writing file:', err);
//     });
//   });
// }

export class HttpError extends CustomError {
  public constructor(public code: number, message?: string) {
    super(message);
  }
}

export class NoDataFound extends Error {
  public name: string;
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = (this.constructor as any).name;
    this.message = message;
    this.status = status;
    Error.captureStackTrace(this, this.constructor); // after initialize properties
  }
}

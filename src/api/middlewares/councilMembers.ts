import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError, getNetworkDetails } from '../../services/utils';
import { ICouncil } from '../../interfaces/ICouncil';
import { isNil } from 'lodash';

const councilMembers = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  try {
    const networkDetails = getNetworkDetails(baseUrl);
    if (isNil(networkDetails)) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'Network Not found');
    }
    const Council = Container.get(networkDetails.name + 'Council') as mongoose.Model<ICouncil & mongoose.Document>;

    const data = await Council.aggregate([
      {
        $lookup: {
          from: networkDetails.name + 'accountidentities',
          localField: 'accountId',
          foreignField: 'accountId',
          as: 'memberIdentity',
        },
      },
      //   {
      //     $lookup: {
      //       from: 'accountidentities',
      //       localField: 'backersInfo.backer',
      //       foreignField: 'stashId',
      //       as: 'backersIdentity',
      //     },
      //   },
    ]);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No data found');
    }

    const activeMembers = data
      .filter((x) => !x.isRunnersUp)
      .map((x) => {
        const totalBalance = x.totalBalance / Math.pow(10, networkDetails.decimalPlaces);
        const backing = x.stake / Math.pow(10, networkDetails.decimalPlaces);
        const name = x.memberIdentity[0] !== undefined ? x.memberIdentity[0].display : null;
        const numberOfBackers = x.backersInfo.length;
        //   const backersInfo = x.backersInfo.map((y) => {
        //     const stake = y.stake / Math.pow(10, 12);
        //     const backerName = x.backersIdentity.filter((z) => z.accountId == y.backer);
        //     return {
        //       stake: stake,
        //       backer: y.backer,
        //       name: backerName[0] !== undefined ? backerName[0].display : null,
        //     };
        //   });
        return {
          name: name,
          accountId: x.accountId,
          backing: backing,
          totalBalance: totalBalance,
          numberOfBackers: numberOfBackers,
        };
      });

    const runnersUp = data
      .filter((x) => x.isRunnersUp)
      .map((x) => {
        const totalBalance = x.totalBalance / Math.pow(10, networkDetails.decimalPlaces);
        const backing = x.stake / Math.pow(10, networkDetails.decimalPlaces);
        const name = x.memberIdentity[0] !== undefined ? x.memberIdentity[0].display : null;
        const numberOfBackers = x.backersInfo.length;
        //   const backersInfo = x.backersInfo.map((y) => {
        //     const stake = y.stake / Math.pow(10, 12);
        //     const backerName = x.backersIdentity.filter((z) => z.accountId == y.backer);
        //     return {
        //       stake: stake,
        //       backer: y.backer,
        //       name: backerName[0] !== undefined ? backerName[0].display : null,
        //     };
        //   });
        return {
          name: name,
          accountId: x.accountId,
          backing: backing,
          totalBalance: totalBalance,
          numberOfBackers: numberOfBackers,
        };
      });

    return res.json({ members: activeMembers, runnersUp: runnersUp }).status(200);
  } catch (e) {
    Logger.error('🔥 Error fetching council data: %o', e);
    return next(e);
  }
};

export default councilMembers;

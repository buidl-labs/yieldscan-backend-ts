import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError } from '../../services/utils';
import { ICouncil } from '../../interfaces/ICouncil';

const councilMembers = async (req, res, next) => {
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  const Logger = Container.get('logger');
  try {
    const Council = Container.get(networkName + 'Council') as mongoose.Model<ICouncil & mongoose.Document>;

    const data = await Council.aggregate([
      {
        $lookup: {
          from: networkName + 'accountidentities',
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
        const totalBalance = x.totalBalance / Math.pow(10, 12);
        const backing = x.stake / Math.pow(10, 12);
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
        const totalBalance = x.totalBalance / Math.pow(10, 12);
        const backing = x.stake / Math.pow(10, 12);
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

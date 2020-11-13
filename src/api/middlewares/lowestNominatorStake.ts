import { Container } from 'typedi';
import mongoose from 'mongoose';
import { HttpError } from '../../services/utils';
import { IValidatorHistory } from '../../interfaces/IValidatorHistory';

const lowestNominatorStake = async (req, res, next) => {
  const Logger = Container.get('logger');
  const baseUrl = req.baseUrl;
  const networkName = baseUrl.includes('polkadot') ? 'polkadot' : 'kusama';
  try {
    const era = parseInt(req.params.era);
    const ValidatorHistory = Container.get(networkName + 'ValidatorHistory') as mongoose.Model<
      IValidatorHistory & mongoose.Document
    >;

    const data = await ValidatorHistory.aggregate([
      {
        $match: {
          eraIndex: era,
        },
      },
      {
        $sort: {
          'nominatorsInfo.nomStake': 1,
        },
      },
      {
        $limit: 1,
      },
    ]);

    if (data.length == 0) {
      Logger.error('🔥 No Data found: %o');
      throw new HttpError(404, 'No user data found');
    }

    const validatorInfo = data.map((x) => {
      x.commission = x.commission / Math.pow(10, 7);
      x.totalStake = x.totalStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
      x.nominatorsInfo = x.nominatorsInfo.map((nom) => {
        nom.nomStake = nom.nomStake / (networkName == 'kusama' ? Math.pow(10, 12) : Math.pow(10, 10));
        return { nomId: nom.nomId, nomStake: nom.nomStake };
      });
      return {
        stashId: x.stashId,
        commission: x.commission,
        eraIndex: x.eraIndex,
        nominatorsInfo: x.nominatorsInfo,
      };
    });
    const lowestStake = validatorInfo[0].nominatorsInfo.reduce((acc, val) => {
      return Math.min(acc, val.nomStake);
    }, Infinity);

    const lowestStakeNominator = validatorInfo[0].nominatorsInfo.filter((nom) => nom.nomStake == lowestStake);

    const result = {
      nomId: lowestStakeNominator[0].nomId,
      nomStake: lowestStake,
      validatorsInfo: validatorInfo,
    };

    return res.json(result).status(200);
  } catch (e) {
    Logger.error('🔥 Error generating user data: %o', e);
    return next(e);
  }
};

export default lowestNominatorStake;

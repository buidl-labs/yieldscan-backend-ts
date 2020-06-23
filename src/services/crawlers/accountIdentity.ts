import { Container } from 'typedi';

import { wait } from '../utils';
import { ITotalRewardHistory } from '../../interfaces/ITotalRewardHistory';
import mongoose from 'mongoose';
import { IAccountIdentity } from '../../interfaces/IAccountIdentity';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start accountIdentity');

    // get all stashes
    const allStashes = await api.derive.staking.stashes();
    // get all stashes account info

    // Todo complete accountIdentity module

    const accountsInfo = await Promise.all(allStashes.map((x) => api.derive.accounts.info(x)));
    Logger.debug(accountsInfo);
    Logger.info('Waiting 5s');
    await wait(5000);
    // Logger.debug(accountsInfo);

    accountsInfo.map((x, index) => {
      return {
        stashId: allStashes[index].toString(),
        accountId: x.accountId.toString(),
        display: x.identity.display.toString(),
        email: x.identity.email.toString(),
        legal: x.identity.legal.toString(),
        riot: x.identity.riot.toString(),
      };
    });

    Logger.debug(accountsInfo);

    // update info

    const AccountIdentity = Container.get('AccountIdentity') as mongoose.Model<IAccountIdentity & mongoose.Document>;
    // todo replace delete insert logic with a more suitable process like update/updateMany
    await AccountIdentity.deleteMany({});
    await AccountIdentity.insertMany(accountsInfo);

    Logger.info('stop accountIdentity');
  },
};

import { Container } from 'typedi';
import mongoose from 'mongoose';

import { wait } from '../utils';
import { IAccountIdentity } from '../../interfaces/IAccountIdentity';

module.exports = {
  start: async function (api) {
    const Logger = Container.get('logger');
    Logger.info('start accountIdentity');

    // get all accountIds

    const getAccountId = (account) =>
      account
        .map((e) => e.args)
        .map(([e]) => e)
        .map((e) => e.toHuman());

    const accountIds = getAccountId(await api.query.system.account.keys());
    // get all account identity info

    const accountsInfo = await Promise.all(
      accountIds.map(async (x) => {
        const info = await api.derive.accounts.info(x);
        const display = info.identity.display !== undefined ? info.identity.display.toString() : null;
        const email = info.identity.email !== undefined ? info.identity.email.toString() : null;
        const legal = info.identity.legal !== undefined ? info.identity.legal.toString() : null;
        const riot = info.identity.riot !== undefined ? info.identity.riot.toString() : null;
        const web = info.identity.web !== undefined ? info.identity.web.toString() : null;
        const twitter = info.identity.twitter !== undefined ? info.identity.twitter.toString() : null;
        return {
          stashId: x,
          accountId: x,
          display: display,
          email: email,
          legal: legal,
          riot: riot,
          twitter: twitter,
          web: web,
        };
      }),
    );
    Logger.info('Waiting 5s');
    await wait(5000);

    // update info

    const AccountIdentity = Container.get('AccountIdentity') as mongoose.Model<IAccountIdentity & mongoose.Document>;

    // todo replace delete insert logic with a more suitable process like update/updateMany
    try {
      await AccountIdentity.deleteMany({});
      await AccountIdentity.insertMany(accountsInfo);
    } catch (error) {
      Logger.error('Error while updating accountIdentities', error);
    }

    Logger.info('stop accountIdentity');
    return;
  },
};

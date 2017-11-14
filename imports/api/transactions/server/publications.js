import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { query } from '/lib/views';
import { Transactions } from '/imports/api/transactions/Transactions';

Meteor.publish('transactions', () => {
  Transactions.find();
});

Meteor.publish('userTransactions', (terms) => {
  check(terms, Object);
  const parameters = query(terms);

  console.log(`[id=${Meteor.userId()} publish] transactions by user`);
  return Transactions.find(parameters.find, parameters.options);
});
